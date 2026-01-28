import { memo, useState } from 'react';
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
  const { expandedFolders, toggleFolder } = useSpaceStore();
  const [showMenu, setShowMenu] = useState(false);

  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = 12 + level * 16;

  const handleClick = () => {
    toggleFolder(node.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
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
          <FolderOpenIcon className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
        ) : (
          <FolderIcon className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
        )}

        {/* Folder name */}
        <span className="flex-1 text-sm text-content-primary truncate ml-1.5">
          {node.name}
        </span>

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

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="animate-slideDown">
          <NoteTree nodes={node.children!} level={level + 1} />
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute left-full top-0 ml-1 z-50 w-48 bg-surface-primary rounded-xl border border-border-primary shadow-soft overflow-hidden animate-fadeIn">
            <div className="py-1">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                Open all
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-content-secondary hover:bg-surface-secondary transition-colors"
              >
                Collapse all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(FolderNode);
