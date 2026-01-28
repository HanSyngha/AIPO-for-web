/**
 * Comments Routes
 *
 * 블록 단위 댓글 관련 엔드포인트
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthenticatedRequest, loadUserId, isSuperAdmin } from '../middleware/auth.js';

export const commentsRoutes = Router();

commentsRoutes.use(authenticateToken);
commentsRoutes.use(loadUserId);

/**
 * 파일 접근 권한 확인
 */
async function canAccessFile(userId: string, loginid: string, fileId: string): Promise<{ canAccess: boolean; isAdmin: boolean; spaceId: string | null }> {
  if (isSuperAdmin(loginid)) {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { spaceId: true },
    });
    return { canAccess: true, isAdmin: true, spaceId: file?.spaceId || null };
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      space: {
        include: {
          user: { select: { id: true } },
          team: {
            include: {
              members: { select: { userId: true } },
              admins: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!file) return { canAccess: false, isAdmin: false, spaceId: null };

  const isTeamAdmin = file.space.team?.admins.some(a => a.userId === userId) || false;

  // 개인 공간
  if (file.space.userId === userId) {
    return { canAccess: true, isAdmin: true, spaceId: file.spaceId };
  }

  // 팀 공간
  if (file.space.team?.members.some(m => m.userId === userId)) {
    return { canAccess: true, isAdmin: isTeamAdmin, spaceId: file.spaceId };
  }

  return { canAccess: false, isAdmin: false, spaceId: null };
}

/**
 * @swagger
 * /comments/files/{fileId}/comments:
 *   get:
 *     summary: 파일의 모든 댓글 조회
 *     description: 지정된 파일에 달린 모든 댓글을 블록별로 그룹화하여 반환합니다.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 파일 ID
 *     responses:
 *       200:
 *         description: 댓글 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Comment'
 *                 totalCount:
 *                   type: integer
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
commentsRoutes.get('/files/:fileId/comments', async (req: AuthenticatedRequest, res) => {
  try {
    const { fileId } = req.params;

    const { canAccess } = await canAccessFile(req.userId!, req.user!.loginid, fileId);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 최상위 댓글만 조회 (답글은 포함)
    const comments = await prisma.comment.findMany({
      where: {
        fileId,
        parentId: null,
      },
      include: {
        user: {
          select: { id: true, loginid: true, username: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, loginid: true, username: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 블록별로 그룹화
    const commentsByBlock = new Map<string, typeof comments>();
    for (const comment of comments) {
      const blockComments = commentsByBlock.get(comment.blockId) || [];
      blockComments.push(comment);
      commentsByBlock.set(comment.blockId, blockComments);
    }

    res.json({
      comments: Object.fromEntries(commentsByBlock),
      totalCount: comments.length,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * @swagger
 * /comments/files/{fileId}/comments:
 *   post:
 *     summary: 댓글 작성
 *     description: 지정된 파일의 특정 블록에 댓글을 작성합니다. parentId를 제공하면 답글로 작성됩니다.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: 파일 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blockId
 *               - content
 *             properties:
 *               blockId:
 *                 type: string
 *                 description: 댓글을 달 블록 ID
 *               content:
 *                 type: string
 *                 description: 댓글 내용 (최대 5,000자)
 *               parentId:
 *                 type: string
 *                 description: 부모 댓글 ID (답글인 경우)
 *     responses:
 *       201:
 *         description: 댓글 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: 잘못된 요청
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
commentsRoutes.post('/files/:fileId/comments', async (req: AuthenticatedRequest, res) => {
  try {
    const { fileId } = req.params;
    const { blockId, content, parentId } = req.body;

    if (!blockId || !content) {
      res.status(400).json({ error: 'blockId and content are required' });
      return;
    }

    if (content.length > 5000) {
      res.status(400).json({ error: 'Comment is too long. Maximum 5,000 characters.' });
      return;
    }

    const { canAccess, spaceId } = await canAccessFile(req.userId!, req.user!.loginid, fileId);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 답글인 경우 부모 댓글 확인
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.fileId !== fileId) {
        res.status(400).json({ error: 'Invalid parent comment' });
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        fileId,
        blockId,
        userId: req.userId!,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, loginid: true, username: true },
        },
      },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId,
        action: 'CREATE_COMMENT',
        targetType: 'COMMENT',
        targetId: comment.id,
        details: { fileId, blockId, parentId },
      },
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * PUT /comments/:id
 * 댓글 수정 (본인 또는 관리자)
 */
commentsRoutes.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    if (content.length > 5000) {
      res.status(400).json({ error: 'Comment is too long. Maximum 5,000 characters.' });
      return;
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        file: { select: { spaceId: true } },
      },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const { canAccess, isAdmin } = await canAccessFile(req.userId!, req.user!.loginid, comment.fileId);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 본인 또는 관리자만 수정 가능
    if (comment.userId !== req.userId && !isAdmin) {
      res.status(403).json({ error: 'You can only edit your own comments' });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: { id: true, loginid: true, username: true },
        },
      },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId: comment.file.spaceId,
        action: 'UPDATE_COMMENT',
        targetType: 'COMMENT',
        targetId: comment.id,
      },
    });

    res.json({ comment: updated });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/**
 * DELETE /comments/:id
 * 댓글 삭제 (본인 또는 관리자)
 */
commentsRoutes.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        file: { select: { spaceId: true } },
        _count: { select: { replies: true } },
      },
    });

    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    const { canAccess, isAdmin } = await canAccessFile(req.userId!, req.user!.loginid, comment.fileId);
    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 본인 또는 관리자만 삭제 가능
    if (comment.userId !== req.userId && !isAdmin) {
      res.status(403).json({ error: 'You can only delete your own comments' });
      return;
    }

    // 답글이 있는 댓글은 삭제 불가 (또는 함께 삭제)
    if (comment._count.replies > 0) {
      // 답글도 함께 삭제
      await prisma.comment.deleteMany({
        where: { parentId: id },
      });
    }

    await prisma.comment.delete({
      where: { id },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId: comment.file.spaceId,
        action: 'DELETE_COMMENT',
        targetType: 'COMMENT',
        targetId: comment.id,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});
