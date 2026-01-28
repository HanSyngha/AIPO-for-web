/**
 * Trash Routes
 *
 * 휴지통 관련 엔드포인트
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthenticatedRequest, loadUserId, isSuperAdmin, requireTeamAdminOrHigher } from '../middleware/auth.js';

export const trashRoutes = Router();

trashRoutes.use(authenticateToken);
trashRoutes.use(loadUserId);

/**
 * GET /trash
 * 휴지통 목록 조회
 */
trashRoutes.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { spaceId } = req.query;

    if (!spaceId) {
      res.status(400).json({ error: 'spaceId is required' });
      return;
    }

    // 공간 접근 권한 확인
    const space = await prisma.space.findUnique({
      where: { id: spaceId as string },
      include: {
        user: { select: { id: true } },
        team: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }

    const canAccess =
      isSuperAdmin(req.user!.loginid) ||
      space.userId === req.userId ||
      space.team?.members.some(m => m.userId === req.userId);

    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 삭제된 파일 조회
    const trashedFiles = await prisma.file.findMany({
      where: {
        spaceId: spaceId as string,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        name: true,
        path: true,
        deletedAt: true,
        createdBy: true,
        folder: {
          select: { name: true, path: true },
        },
      },
    });

    // 30일 후 자동 삭제 날짜 계산
    const filesWithExpiry = trashedFiles.map(file => ({
      ...file,
      expiresAt: new Date(file.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000),
      daysUntilExpiry: Math.ceil(
        (30 * 24 * 60 * 60 * 1000 - (Date.now() - file.deletedAt!.getTime())) / (24 * 60 * 60 * 1000)
      ),
    }));

    res.json({
      files: filesWithExpiry,
      totalCount: filesWithExpiry.length,
    });
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ error: 'Failed to get trash' });
  }
});

/**
 * POST /trash/:id/restore
 * 휴지통에서 복원 (모든 팀원 가능)
 */
trashRoutes.post('/:id/restore', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        space: {
          include: {
            user: { select: { id: true } },
            team: {
              include: {
                members: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (!file.deletedAt) {
      res.status(400).json({ error: 'File is not in trash' });
      return;
    }

    // 접근 권한 확인
    const canAccess =
      isSuperAdmin(req.user!.loginid) ||
      file.space.userId === req.userId ||
      file.space.team?.members.some(m => m.userId === req.userId);

    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 복원
    const restored = await prisma.file.update({
      where: { id },
      data: { deletedAt: null },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId: file.spaceId,
        action: 'RESTORE_FROM_TRASH',
        targetType: 'FILE',
        targetId: file.id,
        details: { fileName: file.name },
      },
    });

    res.json({
      success: true,
      file: {
        id: restored.id,
        name: restored.name,
        path: restored.path,
      },
      message: '파일이 복원되었습니다.',
    });
  } catch (error) {
    console.error('Restore from trash error:', error);
    res.status(500).json({ error: 'Failed to restore file' });
  }
});

/**
 * DELETE /trash/:id
 * 영구 삭제 (관리자만)
 */
trashRoutes.delete('/:id', requireTeamAdminOrHigher, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        space: { select: { teamId: true } },
      },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    if (!file.deletedAt) {
      res.status(400).json({ error: 'File is not in trash' });
      return;
    }

    // 팀 관리자는 본인 팀만 삭제 가능
    if (!req.isSuperAdmin) {
      if (!file.space.teamId || !req.teamAdminTeamIds?.includes(file.space.teamId)) {
        res.status(403).json({ error: 'You can only permanently delete files from your team space' });
        return;
      }
    }

    // 영구 삭제 (관련 데이터도 cascade로 삭제됨)
    await prisma.file.delete({
      where: { id },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId: file.spaceId,
        action: 'PERMANENT_DELETE',
        targetType: 'FILE',
        targetId: file.id,
        details: { fileName: file.name, filePath: file.path },
      },
    });

    res.json({
      success: true,
      message: '파일이 영구 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ error: 'Failed to permanently delete file' });
  }
});

/**
 * DELETE /trash
 * 휴지통 비우기 (관리자만)
 */
trashRoutes.delete('/', requireTeamAdminOrHigher, async (req: AuthenticatedRequest, res) => {
  try {
    const { spaceId } = req.query;

    if (!spaceId) {
      res.status(400).json({ error: 'spaceId is required' });
      return;
    }

    const space = await prisma.space.findUnique({
      where: { id: spaceId as string },
      select: { teamId: true },
    });

    if (!space) {
      res.status(404).json({ error: 'Space not found' });
      return;
    }

    // 팀 관리자는 본인 팀만 비우기 가능
    if (!req.isSuperAdmin) {
      if (!space.teamId || !req.teamAdminTeamIds?.includes(space.teamId)) {
        res.status(403).json({ error: 'You can only empty trash from your team space' });
        return;
      }
    }

    // 휴지통에 있는 모든 파일 삭제
    const result = await prisma.file.deleteMany({
      where: {
        spaceId: spaceId as string,
        deletedAt: { not: null },
      },
    });

    // 감사 로그
    await prisma.auditLog.create({
      data: {
        userId: req.userId!,
        spaceId: spaceId as string,
        action: 'PERMANENT_DELETE',
        targetType: 'SPACE',
        targetId: spaceId as string,
        details: { action: 'empty_trash', deletedCount: result.count },
      },
    });

    res.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count}개의 파일이 영구 삭제되었습니다.`,
    });
  } catch (error) {
    console.error('Empty trash error:', error);
    res.status(500).json({ error: 'Failed to empty trash' });
  }
});
