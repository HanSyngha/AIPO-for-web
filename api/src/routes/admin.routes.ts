/**
 * Admin Routes
 *
 * 관리자 전용 엔드포인트
 */

import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticateToken, AuthenticatedRequest, loadUserId, requireSuperAdmin, requireTeamAdminOrHigher, isSuperAdmin } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(authenticateToken);
adminRoutes.use(loadUserId);

/**
 * GET /admin/teams
 * 팀 목록 조회 (Super Admin: 전체, Team Admin: 본인 팀)
 */
adminRoutes.get('/teams', requireTeamAdminOrHigher, async (req: AuthenticatedRequest, res) => {
  try {
    let where = {};

    if (!req.isSuperAdmin && req.teamAdminTeamIds) {
      where = { id: { in: req.teamAdminTeamIds } };
    }

    const teams = await prisma.team.findMany({
      where,
      include: {
        _count: {
          select: {
            members: true,
            admins: true,
          },
        },
        space: {
          include: {
            _count: {
              select: {
                files: true,
                folders: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        displayName: team.displayName,
        businessUnit: team.businessUnit,
        memberCount: team._count.members,
        adminCount: team._count.admins,
        spaceId: team.space?.id,
        fileCount: team.space?._count.files || 0,
        folderCount: team.space?._count.folders || 0,
        createdAt: team.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to get teams' });
  }
});

/**
 * POST /admin/teams/:id/admins
 * 팀 관리자 지정 (Super Admin 전용)
 */
adminRoutes.post('/teams/:id/admins', requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId } = req.params;
    const { loginid } = req.body;

    if (!loginid) {
      res.status(400).json({ error: 'loginid is required' });
      return;
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // 대상 사용자 조회
    const targetUser = await prisma.user.findUnique({
      where: { loginid },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 이미 관리자인지 확인
    const existingAdmin = await prisma.teamAdmin.findUnique({
      where: {
        userId_teamId: {
          userId: targetUser.id,
          teamId,
        },
      },
    });

    if (existingAdmin) {
      res.status(400).json({ error: 'User is already a team admin' });
      return;
    }

    // 관리자 지정
    const admin = await prisma.teamAdmin.create({
      data: {
        userId: targetUser.id,
        teamId,
        grantedBy: req.user!.loginid,
      },
      include: {
        user: {
          select: { id: true, loginid: true, username: true },
        },
      },
    });

    res.status(201).json({
      admin: {
        id: admin.id,
        user: admin.user,
        grantedAt: admin.grantedAt,
        grantedBy: admin.grantedBy,
      },
      message: `${targetUser.username}님이 팀 관리자로 지정되었습니다.`,
    });
  } catch (error) {
    console.error('Add team admin error:', error);
    res.status(500).json({ error: 'Failed to add team admin' });
  }
});

/**
 * DELETE /admin/teams/:id/admins/:userId
 * 팀 관리자 해제 (Super Admin 전용)
 */
adminRoutes.delete('/teams/:id/admins/:userId', requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: teamId, userId } = req.params;

    const admin = await prisma.teamAdmin.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      include: {
        user: { select: { username: true } },
      },
    });

    if (!admin) {
      res.status(404).json({ error: 'Team admin not found' });
      return;
    }

    await prisma.teamAdmin.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    res.json({
      success: true,
      message: `${admin.user.username}님의 팀 관리자 권한이 해제되었습니다.`,
    });
  } catch (error) {
    console.error('Remove team admin error:', error);
    res.status(500).json({ error: 'Failed to remove team admin' });
  }
});

/**
 * GET /admin/stats
 * 전체 통계 (Super Admin: 전체, Team Admin: 본인 팀)
 */
adminRoutes.get('/stats', requireTeamAdminOrHigher, async (req: AuthenticatedRequest, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - Number(days));

    let spaceFilter = {};
    if (!req.isSuperAdmin && req.teamAdminTeamIds) {
      const spaces = await prisma.space.findMany({
        where: { teamId: { in: req.teamAdminTeamIds } },
        select: { id: true },
      });
      spaceFilter = { spaceId: { in: spaces.map(s => s.id) } };
    }

    // 총 사용자 수
    const totalUsers = await prisma.user.count();

    // 총 팀 수
    const totalTeams = await prisma.team.count();

    // 총 파일 수
    const totalFiles = await prisma.file.count({
      where: {
        ...spaceFilter,
        deletedAt: null,
      },
    });

    // 총 폴더 수
    const totalFolders = await prisma.folder.count({
      where: spaceFilter,
    });

    // 기간 내 요청 수
    const requestStats = await prisma.request.groupBy({
      by: ['type', 'status'],
      where: {
        ...spaceFilter,
        createdAt: { gte: since },
      },
      _count: true,
    });

    // 기간 내 일별 요청 수
    const dailyRequests = await prisma.request.groupBy({
      by: ['createdAt'],
      where: {
        ...spaceFilter,
        createdAt: { gte: since },
      },
      _count: true,
    });

    res.json({
      overview: {
        totalUsers,
        totalTeams,
        totalFiles,
        totalFolders,
      },
      requests: {
        byTypeAndStatus: requestStats,
        daily: dailyRequests,
      },
      period: {
        days: Number(days),
        since: since.toISOString(),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /admin/audit-logs
 * 감사 로그 조회
 */
adminRoutes.get('/audit-logs', requireTeamAdminOrHigher, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 50, action, spaceId, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};

    // Team Admin은 본인 팀만 조회 가능
    if (!req.isSuperAdmin && req.teamAdminTeamIds) {
      const spaces = await prisma.space.findMany({
        where: { teamId: { in: req.teamAdminTeamIds } },
        select: { id: true },
      });
      where.spaceId = { in: spaces.map(s => s.id) };
    }

    if (action) where.action = action;
    if (spaceId) where.spaceId = spaceId;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { loginid: true, username: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

/**
 * GET /admin/users
 * 사용자 목록 (Super Admin 전용)
 */
adminRoutes.get('/users', requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let where: any = {};
    if (search) {
      where.OR = [
        { loginid: { contains: search as string } },
        { username: { contains: search as string } },
        { deptname: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          teamMemberships: {
            include: {
              team: { select: { name: true, displayName: true } },
            },
          },
          teamAdmins: {
            include: {
              team: { select: { name: true } },
            },
          },
        },
        orderBy: { lastActive: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(user => ({
        id: user.id,
        loginid: user.loginid,
        username: user.username,
        deptname: user.deptname,
        businessUnit: user.businessUnit,
        teams: user.teamMemberships.map(tm => tm.team),
        isTeamAdmin: user.teamAdmins.length > 0,
        teamAdminOf: user.teamAdmins.map(ta => ta.team.name),
        isSuperAdmin: isSuperAdmin(user.loginid),
        createdAt: user.createdAt,
        lastActive: user.lastActive,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});
