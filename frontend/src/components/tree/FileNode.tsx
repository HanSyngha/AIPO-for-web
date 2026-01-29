import { memo, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TreeNode, useSpaceStore } from '../../stores/spaceStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { filesApi } from '../../services/api';
import {
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  LanguageIcon,
} from '@heroicons/react/24/outline';

interface FileNodeProps {
  node: TreeNode;
  level: number;
}

const translations = {
  ko: {
    share: '링크 공유',
    export: 'Markdown 내보내기',
    delete: '휴지통으로 이동',
    deleteFailed: '파일 삭제에 실패했습니다.',
    languages: '사용 가능한 언어',
    KO: '한국어', EN: '영어', CN: '중국어',
  },
  en: {
    share: 'Share link',
    export: 'Export as Markdown',
    delete: 'Move to trash',
    deleteFailed: 'Failed to move file to trash.',
    languages: 'Available Languages',
    KO: 'Korean', EN: 'English', CN: 'Chinese',
  },
  cn: {
    share: '分享链接',
    export: '导出为 Markdown',
    delete: '移至回收站',
    deleteFailed: '移至回收站失败。',
    languages: '可用语言',
    KO: '韩语', EN: '英语', CN: '中文',
  },
};

function FileNode({ node, level }: FileNodeProps) {
  const navigate = useNavigate();
  const { fileId } = useParams();
  const { setSelectedFileId, refresh } = useSpaceStore();
  const { user } = useAuthStore();
  const { language } = useSettingsStore();
  const t = translations[language];
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 권한 체크: Super Admin / Team Admin은 모든 파일, 일반 사용자는 본인 파일만
  const canDelete = user?.isSuperAdmin || user?.isTeamAdmin || node.createdBy === user?.loginid;

  const paddingLeft = 12 + level * 16 + 14; // Extra padding for alignment
  const isSelected = fileId === node.id;

  const openMenu = (anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    // 메뉴를 버튼 아래에 열되, 화면 밖으로 나가면 왼쪽으로 조정
    let left = rect.right + 4;
    const menuWidth = 208; // w-52 = 13rem = 208px
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - 4;
    }
    setMenuPos({ top: rect.top, left });
    setShowMenu(true);
  };

  // 메뉴 밖 클릭 시 닫기
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleClick = () => {
    setSelectedFileId(node.id);
    navigate(`/note/${node.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.currentTarget as HTMLElement);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      await filesApi.moveToTrash(node.id);
      if (isSelected) {
        setSelectedFileId(null);
        navigate('/');
      }
      refresh();
    } catch {
      alert(t.deleteFailed);
    }
  };

  // Language availability badges
  const availableLanguages = [];
  if (node.hasKO) availableLanguages.push('KO');
  if (node.hasEN) availableLanguages.push('EN');
  if (node.hasCN) availableLanguages.push('CN');

  return (
    <div className="relative">
      <div
        className={`group flex items-center gap-1.5 py-1.5 px-2 mx-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-primary-100 dark:bg-primary-900/30'
            : 'hover:bg-surface-secondary'
        }`}
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* File icon */}
        <DocumentTextIcon
          className={`w-[18px] h-[18px] flex-shrink-0 ${
            isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-content-tertiary'
          }`}
        />

        {/* File name */}
        <span
          className={`flex-1 text-sm truncate ${
            isSelected
              ? 'text-primary-700 dark:text-primary-300 font-medium'
              : 'text-content-primary'
          }`}
        >
          {node.name}
        </span>

        {/* Language badges */}
        {availableLanguages.length > 1 && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {availableLanguages.map((lang) => (
              <span
                key={lang}
                className={`text-[10px] font-medium px-1 py-0.5 rounded ${
                  lang === 'KO'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : lang === 'EN'
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                }`}
              >
                {lang}
              </span>
            ))}
          </div>
        )}

        {/* Trash button (hover) — visible directly without menu */}
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            title={t.delete}
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
          </button>
        )}

        {/* Menu button */}
        <button
          ref={menuBtnRef}
          onClick={(e) => {
            e.stopPropagation();
            if (showMenu) {
              setShowMenu(false);
            } else {
              openMenu(e.currentTarget);
            }
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary transition-all"
        >
          <EllipsisHorizontalIcon className="w-4 h-4 text-content-tertiary" />
        </button>
      </div>

      {/* Context menu — fixed position to escape overflow clipping */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-52 bg-surface-primary rounded-xl border border-border-primary shadow-lg overflow-hidden animate-fadeIn"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                // TODO: Implement share
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              {t.share}
            </button>
            <button
              onClick={() => {
                // TODO: Implement export
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t.export}
            </button>
          </div>

          {/* Language section */}
          {availableLanguages.length > 0 && (
            <div className="py-1 border-t border-border-primary">
              <div className="px-4 py-1.5 text-xs font-medium text-content-quaternary uppercase tracking-wider">
                {t.languages}
              </div>
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
                >
                  <LanguageIcon className="w-4 h-4" />
                  {t[lang as 'KO' | 'EN' | 'CN']}
                </button>
              ))}
            </div>
          )}

          {canDelete && (
            <div className="py-1 border-t border-border-primary">
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                {t.delete}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(FileNode);
