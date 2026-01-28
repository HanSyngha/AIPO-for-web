import { memo } from 'react';
import { TreeNode } from '../../stores/spaceStore';
import FolderNode from './FolderNode';
import FileNode from './FileNode';

interface NoteTreeProps {
  nodes: TreeNode[];
  level?: number;
}

function NoteTree({ nodes, level = 0 }: NoteTreeProps) {
  if (!nodes || nodes.length === 0) {
    return null;
  }

  // Sort nodes: folders first, then files, both alphabetically
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'ko');
  });

  return (
    <div className={level === 0 ? 'py-2' : ''}>
      {sortedNodes.map((node) => (
        <TreeNodeItem key={node.id} node={node} level={level} />
      ))}
    </div>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
}

const TreeNodeItem = memo(function TreeNodeItem({ node, level }: TreeNodeItemProps) {
  if (node.type === 'folder') {
    return <FolderNode node={node} level={level} />;
  }
  return <FileNode node={node} level={level} />;
});

export default memo(NoteTree);
