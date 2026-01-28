import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { adminApi } from '../services/api';
import { showToast } from '../components/common/Toast';
import Modal from '../components/common/Modal';
import { StatusBadge } from '../components/common/Badge';
import {
  UserGroupIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  FolderIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const translations = {
  ko: {
    title: '관리자',
    teams: '팀 관리',
    stats: '통계',
    auditLogs: '감사 로그',
    users: '사용자',
    addAdmin: '관리자 추가',
    removeAdmin: '관리자 제거',
    loginId: '로그인 ID',
    cancel: '취소',
    add: '추가',
    remove: '제거',
    confirm: '확인',
    totalUsers: '전체 사용자',
    totalNotes: '전체 노트',
    totalTeams: '전체 팀',
    activeToday: '오늘 활성',
    noTeams: '팀이 없습니다',
    noLogs: '로그가 없습니다',
    noUsers: '사용자가 없습니다',
    search: '검색',
    action: '작업',
    user: '사용자',
    target: '대상',
    time: '시간',
    refactor: '구조 정리',
    refactorDesc: 'AI가 폴더 구조를 자동으로 정리합니다',
    refactorStart: '정리 시작',
    previous: '이전',
    next: '다음',
    adminAddSuccess: '관리자가 추가되었습니다',
    adminRemoveSuccess: '관리자가 제거되었습니다',
    teamName: '팀 이름',
    admins: '관리자',
    members: '멤버',
  },
  en: {
    title: 'Admin',
    teams: 'Team Management',
    stats: 'Statistics',
    auditLogs: 'Audit Logs',
    users: 'Users',
    addAdmin: 'Add Admin',
    removeAdmin: 'Remove Admin',
    loginId: 'Login ID',
    cancel: 'Cancel',
    add: 'Add',
    remove: 'Remove',
    confirm: 'Confirm',
    totalUsers: 'Total Users',
    totalNotes: 'Total Notes',
    totalTeams: 'Total Teams',
    activeToday: 'Active Today',
    noTeams: 'No teams',
    noLogs: 'No logs',
    noUsers: 'No users',
    search: 'Search',
    action: 'Action',
    user: 'User',
    target: 'Target',
    time: 'Time',
    refactor: 'Refactor Structure',
    refactorDesc: 'AI will automatically organize folder structure',
    refactorStart: 'Start Refactoring',
    previous: 'Previous',
    next: 'Next',
    adminAddSuccess: 'Admin added successfully',
    adminRemoveSuccess: 'Admin removed successfully',
    teamName: 'Team Name',
    admins: 'Admins',
    members: 'Members',
  },
  cn: {
    title: '管理员',
    teams: '团队管理',
    stats: '统计',
    auditLogs: '审计日志',
    users: '用户',
    addAdmin: '添加管理员',
    removeAdmin: '移除管理员',
    loginId: '登录 ID',
    cancel: '取消',
    add: '添加',
    remove: '移除',
    confirm: '确认',
    totalUsers: '总用户数',
    totalNotes: '总笔记数',
    totalTeams: '总团队数',
    activeToday: '今日活跃',
    noTeams: '暂无团队',
    noLogs: '暂无日志',
    noUsers: '暂无用户',
    search: '搜索',
    action: '操作',
    user: '用户',
    target: '目标',
    time: '时间',
    refactor: '整理结构',
    refactorDesc: 'AI 将自动整理文件夹结构',
    refactorStart: '开始整理',
    previous: '上一页',
    next: '下一页',
    adminAddSuccess: '管理员添加成功',
    adminRemoveSuccess: '管理员移除成功',
    teamName: '团队名称',
    admins: '管理员',
    members: '成员',
  },
};

type Tab = 'teams' | 'stats' | 'logs' | 'users';

interface Team {
  id: string;
  name: string;
  businessUnit: string;
  adminCount: number;
  memberCount: number;
  admins: Array<{ id: string; loginid: string; username: string }>;
}

interface Stats {
  totalUsers: number;
  totalNotes: number;
  totalTeams: number;
  activeToday: number;
  dailyStats: Array<{ date: string; users: number; notes: number }>;
}

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  username: string;
  targetId?: string;
  targetName?: string;
  createdAt: string;
}

interface User {
  id: string;
  loginid: string;
  username: string;
  deptname: string;
  lastActive: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { language } = useSettingsStore();
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<Tab>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newAdminLoginId, setNewAdminLoginId] = useState('');

  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState('');

  const isSuperAdmin = user?.isSuperAdmin;
  const isTeamAdmin = user?.isTeamAdmin;

  useEffect(() => {
    if (!isSuperAdmin && !isTeamAdmin) {
      navigate('/home');
      return;
    }
    loadData();
  }, [activeTab, logsPage, usersPage, usersSearch]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (activeTab) {
        case 'teams':
          const teamsRes = await adminApi.getTeams();
          setTeams(teamsRes.data.teams || []);
          break;
        case 'stats':
          const statsRes = await adminApi.getStats(30);
          setStats(statsRes.data);
          break;
        case 'logs':
          const logsRes = await adminApi.getAuditLogs({ page: logsPage, limit: 20 });
          setLogs(logsRes.data.logs || []);
          setLogsTotal(logsRes.data.total || 0);
          break;
        case 'users':
          const usersRes = await adminApi.getUsers({
            page: usersPage,
            limit: 20,
            search: usersSearch || undefined,
          });
          setUsers(usersRes.data.users || []);
          setUsersTotal(usersRes.data.total || 0);
          break;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedTeam || !newAdminLoginId.trim()) return;

    try {
      await adminApi.addTeamAdmin(selectedTeam.id, newAdminLoginId.trim());
      showToast.success(t.adminAddSuccess);
      setShowAddAdminModal(false);
      setNewAdminLoginId('');
      setSelectedTeam(null);
      loadData();
    } catch (error) {
      console.error('Failed to add admin:', error);
    }
  };

  const handleRemoveAdmin = async (teamId: string, userId: string) => {
    try {
      await adminApi.removeTeamAdmin(teamId, userId);
      showToast.success(t.adminRemoveSuccess);
      loadData();
    } catch (error) {
      console.error('Failed to remove admin:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (language === 'ko') {
      return date.toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (language === 'en') {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof UserGroupIcon }> = [
    { id: 'teams', label: t.teams, icon: UserGroupIcon },
    { id: 'stats', label: t.stats, icon: ChartBarIcon },
    { id: 'logs', label: t.auditLogs, icon: ClipboardDocumentListIcon },
    { id: 'users', label: t.users, icon: UsersIcon },
  ];

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="card p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-lg" />
            ))}
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'teams':
        return (
          <div className="space-y-4">
            {teams.length > 0 ? (
              teams.map((team) => (
                <div key={team.id} className="card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-content-primary">{team.name}</h3>
                      <p className="text-sm text-content-tertiary">{team.businessUnit}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-content-secondary">
                      <span>{t.members}: {team.memberCount}</span>
                      <span>{t.admins}: {team.adminCount}</span>
                    </div>
                  </div>

                  {/* Admins list */}
                  <div className="border-t border-border-primary pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-content-secondary">{t.admins}</span>
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddAdminModal(true);
                        }}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        <PlusIcon className="w-3 h-3" />
                        {t.addAdmin}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {team.admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary rounded-lg text-sm"
                        >
                          <span className="text-content-primary">{admin.username}</span>
                          <span className="text-content-quaternary">({admin.loginid})</span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRemoveAdmin(team.id, admin.id)}
                              className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-12 text-center">
                <p className="text-content-tertiary">{t.noTeams}</p>
              </div>
            )}
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-content-primary">
                      {stats?.totalUsers || 0}
                    </p>
                    <p className="text-xs text-content-tertiary">{t.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <DocumentTextIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-content-primary">
                      {stats?.totalNotes || 0}
                    </p>
                    <p className="text-xs text-content-tertiary">{t.totalNotes}</p>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-content-primary">
                      {stats?.totalTeams || 0}
                    </p>
                    <p className="text-xs text-content-tertiary">{t.totalTeams}</p>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-content-primary">
                      {stats?.activeToday || 0}
                    </p>
                    <p className="text-xs text-content-tertiary">{t.activeToday}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart placeholder */}
            <div className="card p-6">
              <h3 className="font-semibold text-content-primary mb-4">Daily Activity (30 days)</h3>
              <div className="h-64 flex items-end gap-1">
                {stats?.dailyStats?.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary-200 dark:bg-primary-800 rounded-t"
                      style={{
                        height: `${Math.max(4, (day.notes / Math.max(...stats.dailyStats.map((d) => d.notes), 1)) * 200)}px`,
                      }}
                      title={`${day.date}: ${day.notes} notes`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                      {t.action}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                      {t.user}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                      {t.target}
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                      {t.time}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-border-primary last:border-0">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-content-primary">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-content-secondary">{log.username}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-content-tertiary">
                            {log.targetName || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-content-quaternary">
                            {formatTime(log.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-content-tertiary">
                        {t.noLogs}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsTotal > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border-primary">
                <button
                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="btn-ghost text-sm disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  {t.previous}
                </button>
                <span className="text-sm text-content-secondary">
                  {logsPage} / {Math.ceil(logsTotal / 20)}
                </span>
                <button
                  onClick={() => setLogsPage((p) => p + 1)}
                  disabled={logsPage >= Math.ceil(logsTotal / 20)}
                  className="btn-ghost text-sm disabled:opacity-50"
                >
                  {t.next}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                }}
                placeholder={t.search}
                className="input w-full pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-content-tertiary" />
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-primary">
                      <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                        {t.user}
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                        {t.loginId}
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                        Department
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-content-secondary">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-border-primary last:border-0">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-content-primary">
                              {u.username}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-content-secondary">{u.loginid}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-content-tertiary">{u.deptname}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-content-quaternary">
                              {u.lastActive ? formatTime(u.lastActive) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-content-tertiary">
                          {t.noUsers}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersTotal > 20 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border-primary">
                  <button
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                    className="btn-ghost text-sm disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t.previous}
                  </button>
                  <span className="text-sm text-content-secondary">
                    {usersPage} / {Math.ceil(usersTotal / 20)}
                  </span>
                  <button
                    onClick={() => setUsersPage((p) => p + 1)}
                    disabled={usersPage >= Math.ceil(usersTotal / 20)}
                    className="btn-ghost text-sm disabled:opacity-50"
                  >
                    {t.next}
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-content-primary">{t.title}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-surface-primary text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-content-tertiary hover:text-content-secondary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}

      {/* Add Admin Modal */}
      <Modal
        isOpen={showAddAdminModal}
        onClose={() => {
          setShowAddAdminModal(false);
          setNewAdminLoginId('');
          setSelectedTeam(null);
        }}
        title={t.addAdmin}
        description={selectedTeam?.name}
      >
        <Modal.Body>
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1.5">
              {t.loginId}
            </label>
            <input
              type="text"
              value={newAdminLoginId}
              onChange={(e) => setNewAdminLoginId(e.target.value)}
              className="input w-full"
              placeholder="user@example.com"
              autoFocus
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => {
              setShowAddAdminModal(false);
              setNewAdminLoginId('');
              setSelectedTeam(null);
            }}
            className="btn-ghost"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleAddAdmin}
            disabled={!newAdminLoginId.trim()}
            className="btn-primary"
          >
            {t.add}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
