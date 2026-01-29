import { memo, useState, useRef, useEffect } from 'react';
import { TreeNode, useSpaceStore } from '../../stores/spaceStore';
import NoteTree from './NoteTree';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';

interface FolderNodeProps {
  node: TreeNode;
  level: number;
}

function FolderNode({ node, level }: FolderNodeProps) {
  const { expandedFolders, toggleFolder, expandFolder, collapseFolder } = useSpaceStore();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = 12 + level * 16;

  const openMenu = (anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    let left = rect.right + 4;
    const menuWidth = 192; // w-48 = 12rem = 192px
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
    toggleFolder(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openMenu(e.currentTarget as HTMLElement);
  };

  // 하위 폴더 ID 재귀 수집
  const getAllChildFolderIds = (n: TreeNode): string[] => {
    const ids: string[] = [];
    if (n.children) {
      for (const child of n.children) {
        if (child.type === 'folder') {
          ids.push(child.id);
          ids.push(...getAllChildFolderIds(child));
        }
      }
    }
    return ids;
  };

  const handleExpandAll = () => {
    setShowMenu(false);
    expandFolder(node.id);
    for (const id of getAllChildFolderIds(node)) {
      expandFolder(id);
    }
  };

  const handleCollapseAll = () => {
    setShowMenu(false);
    collapseFolder(node.id);
    for (const id of getAllChildFolderIds(node)) {
      collapseFolder(id);
    }
  };

  return (
    <div className="relative">
      <div
        className="group flex items-center gap-1 py-1.5 px-2 mx-2 rounded-lg cursor-pointer hover:bg-surface-secondary transition-colors"
        style={{ paddingLeft }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse icon */}
        <ChevronRightIcon
          className={`w-3.5 h-3.5 text-content-quaternary transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          } ${!hasChildren ? 'invisible' : ''}`}
        />

        {/* Folder icon */}
        {isExpanded ? (
          <FolderOpenIcon className="w-[18px] h-[18px] text-amber-500 flex-shrink-0" />
        ) : (
          <FolderIcon className="w-[18px] h-[18px] text-amber-500 flex-shrink-0" />
        )}

        {/* Folder name + child count */}
        <span className="flex-1 text-sm text-content-primary truncate ml-1.5">
          {node.name}
          {hasChildren && (
            <span className="ml-1 text-xs text-content-quaternary">
              ({node.children!.length})
            </span>
          )}
        </span>

        {/* Menu button */}
        <button
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

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="relative animate-slideDown">
          {/* Indent guide line */}
          <div
            className="absolute top-0 bottom-2 border-l border-border-secondary"
            style={{ left: `${paddingLeft + 7}px` }}
          />
          <NoteTree nodes={node.children!} level={level + 1} />
        </div>
      )}

      {/* Context menu — fixed position to escape overflow clipping */}
      {showMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] w-48 bg-surface-primary rounded-xl border border-border-primary shadow-lg overflow-hidden animate-fadeIn"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <div className="py-1">
            <button
              onClick={handleExpandAll}
              className="w-full px-4 py-2 text-sm text-left text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              모두 펼치기
            </button>
            <button
              onClick={handleCollapseAll}
              className="w-full px-4 py-2 text-sm text-left text-content-secondary hover:bg-surface-secondary transition-colors"
            >
              모두 접기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(FolderNode);
