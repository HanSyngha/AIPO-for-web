/**
 * Spaces Routes
 *
 * 공간(개인/팀) 관련 엔드포인트
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthenticatedRequest, loadUserId, isSuperAdmin } from '../middleware/auth.js';

export const spacesRoutes = Router();

// 모든 라우트에 인증 필요
spacesRoutes.use(authenticateToken);
spacesRoutes.use(loadUserId);

/**
 * GET /spaces/personal
 * 개인 공간 정보
 */
spacesRoutes.get('/personal', async (req: AuthenticatedRequest, res) => {
  try {
    const space = await prisma.space.findUnique({
      where: { userId: req.userId },
      include: {
        _count: {
          select: {
            folders: true,
            files: true,
          },
        },
      },
    });

    if (!space) {
      res.status(404).json({ error: 'Personal space not found' });
      return;
    }

    res.json({ space });
  } catch (error) {
    console.error('Get personal space error:', error);
    res.status(500).json({ error: 'Failed to get personal space' });
  }
});

/**
 * GET /spaces/team
 * 팀 공간 정보
 */
spacesRoutes.get('/team', async (req: AuthenticatedRequest, res) => {
  try {
    const teamMembership = await prisma.teamMember.findFirst({
      where: { userId: req.userId },
      include: {
        team: {
          include: {
            space: {
              include: {
                _count: {
                  select: {
                    folders: true,
                    files: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teamMembership?.team?.space) {
      res.status(404).json({ error: 'Team space not found' });
      return;
    }

    res.json({
      space: teamMembership.team.space,
      team: {
        id: teamMembership.team.id,
        name: teamMembership.team.name,
        displayName: teamMembership.team.displayName,
      },
    });
  } catch (error) {
    console.error('Get team space error:', error);
    res.status(500).json({ error: 'Failed to get team space' });
  }
});

/**
 * @swagger
 * /spaces/{id}/tree:
 *   get:
 *     summary: 폴더/파일 트리 구조 조회
 *     description: 공간의 전체 폴더와 파일 구조를 트리 형태로 반환합니다.
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 공간 ID
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           enum: [KO, EN, CN]
 *           default: KO
 *         description: 언어
 *     responses:
 *       200:
 *         description: 트리 구조
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 spaceId:
 *                   type: string
 *                 type:
 *                   type: string
 *                 tree:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TreeNode'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     folderCount:
 *                       type: integer
 *                     fileCount:
 *                       type: integer
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
spacesRoutes.get('/:id/tree', async (req: AuthenticatedRequest, res) => {
  try {
    const { id: spaceId } = req.params;
    const { language = 'KO' } = req.query;

    // 공간 접근 권한 확인
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        user: { select: { id: true, loginid: true } },
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

    // 접근 권한 체크
    const canAccess =
      isSuperAdmin(req.user!.loginid) ||
      space.userId === req.userId ||
      space.team?.members.some(m => m.userId === req.userId);

    if (!canAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // 폴더 조회
    const folders = await prisma.folder.findMany({
      where: { spaceId },
      orderBy: [{ path: 'asc' }],
      select: {
        id: true,
        name: true,
        path: true,
        parentId: true,
      },
    });

    // 파일 조회 (삭제되지 않은 것만)
    const files = await prisma.file.findMany({
      where: {
        spaceId,
        deletedAt: null,
      },
      orderBy: [{ path: 'asc' }],
      select: {
        id: true,
        name: true,
        path: true,
        folderId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        versions: {
          where: { language: language as 'KO' | 'EN' | 'CN' },
          select: { id: true, language: true, updatedAt: true },
        },
      },
    });

    // 트리 구조 생성
    const tree = buildTree(folders, files);

    res.json({
      spaceId,
      type: space.type,
      tree,
      stats: {
        folderCount: folders.length,
        fileCount: files.length,
      },
    });
  } catch (error) {
    console.error('Get space tree error:', error);
    res.status(500).json({ error: 'Failed to get space tree' });
  }
});

/**
 * 폴더/파일을 트리 구조로 변환
 */
function buildTree(
  folders: Array<{ id: string; name: string; path: string; parentId: string | null }>,
  files: Array<{
    id: string;
    name: string;
    path: string;
    folderId: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    versions: Array<{ id: string; language: string; updatedAt: Date }>;
  }>
) {
  interface TreeNode {
    id: string;
    name: string;
    path: string;
    type: 'folder' | 'file';
    children?: TreeNode[];
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
    hasKO?: boolean;
    hasEN?: boolean;
    hasCN?: boolean;
  }

  // 폴더 맵 생성
  const folderMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  // 폴더 노드 생성
  for (const folder of folders) {
    const node: TreeNode = {
      id: folder.id,
      name: folder.name,
      path: folder.path,
      type: 'folder',
      children: [],
    };
    folderMap.set(folder.id, node);
  }

  // 폴더 계층 구조 생성
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!;
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children!.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  // 파일 노드 추가
  for (const file of files) {
    const fileNode: TreeNode = {
      id: file.id,
      name: file.name,
      path: file.path,
      type: 'file',
      createdBy: file.createdBy,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      hasKO: file.versions.some(v => v.language === 'KO'),
      hasEN: file.versions.some(v => v.language === 'EN'),
      hasCN: file.versions.some(v => v.language === 'CN'),
    };

    if (file.folderId) {
      const folder = folderMap.get(file.folderId);
      if (folder) {
        folder.children!.push(fileNode);
      }
    } else {
      rootNodes.push(fileNode);
    }
  }

  // 각 폴더 내부 정렬 (폴더 먼저, 그 다음 파일)
  function sortChildren(nodes: TreeNode[]): TreeNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  function sortTree(nodes: TreeNode[]): TreeNode[] {
    for (const node of nodes) {
      if (node.children) {
        node.children = sortTree(sortChildren(node.children));
      }
    }
    return sortChildren(nodes);
  }

  return sortTree(rootNodes);
}

/**
 * GET /spaces/:id/summary
 * 공간 요약 (홈 페이지용)
 */
spacesRoutes.get('/:id/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const { id: spaceId } = req.params;

    // 접근 권한 체크
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
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

    // 폴더 수
    const totalFolders = await prisma.folder.count({
      where: { spaceId },
    });

    // 파일 수
    const totalFiles = await prisma.file.count({
      where: { spaceId, deletedAt: null },
    });

    // 최근 파일 5개
    const recentFiles = await prisma.file.findMany({
      where: { spaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        path: true,
        updatedAt: true,
      },
    });

    // 이번 주 생성된 파일 수
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekCount = await prisma.file.count({
      where: {
        spaceId,
        deletedAt: null,
        createdAt: { gte: oneWeekAgo },
      },
    });

    res.json({
      totalFiles,
      totalFolders,
      recentFiles,
      thisWeekCount,
    });
  } catch (error) {
    console.error('Get space summary error:', error);
    res.status(500).json({ error: 'Failed to get space summary' });
  }
});
