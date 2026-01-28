import { memo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TreeNode, useSpaceStore } from '../../stores/spaceStore';
import { useSettingsStore } from '../../stores/settingsStore';
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

const languageLabels = {
  ko: { KO: '한국어', EN: '영어', CN: '중국어' },
  en: { KO: 'Korean', EN: 'English', CN: 'Chinese' },
  cn: { KO: '韩语', EN: '英语', CN: '中文' },
};

function FileNode({ node, level }: FileNodeProps) {
  const navigate = useNavigate();
  const { fileId } = useParams();
  const { setSelectedFileId } = useSpaceStore();
  const { language } = useSettingsStore();
  const [showMenu, setShowMenu] = useState(false);

  const paddingLeft = 12 + level * 16 + 14; // Extra padding for alignment
  const isSelected = fileId === node.id;

  const handleClick = () => {
    setSelectedFileId(node.id);
    navigate(`/note/${node.id}`);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
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
          className={`w-4.5 h-4.5 flex-shrink-0 ${
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

        {/* Menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary transition-all"
        >
          <EllipsisHorizontalIcon className="w-4 h-4 text-content-tertiary" />
        </button>
      </div>

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-full top-0 ml-1 z-50 w-52 bg-surface-primary rounded-xl border border-border-primary shadow-soft overflow-hidden animate-fadeIn">
            <div className="py-1">
              <button
                onClick={() => {
                  // TODO: Implement share
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                Share link
              </button>
              <button
                onClick={() => {
                  // TODO: Implement export
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export as Markdown
              </button>
            </div>

            {/* Language section */}
            {availableLanguages.length > 0 && (
              <div className="py-1 border-t border-border-primary">
                <div className="px-4 py-1.5 text-xs font-medium text-content-quaternary uppercase tracking-wider">
                  Available Languages
                </div>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setShowMenu(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary transition-colors"
                  >
                    <LanguageIcon className="w-4 h-4" />
                    {languageLabels[language][lang as 'KO' | 'EN' | 'CN']}
                  </button>
                ))}
              </div>
            )}

            <div className="py-1 border-t border-border-primary">
              <button
                onClick={() => {
                  // TODO: Implement delete
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Move to trash
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(FileNode);
