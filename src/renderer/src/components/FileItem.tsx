import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileIcon } from './FileIcon';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isModified?: boolean;
}

interface FileItemProps {
  node: FileNode;
  depth: number;
  activeTabPath: string | null;
  onFileClick: (path: string) => void;
  expandedPaths: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
  onContextMenuOpen: (x: number, y: number, node: FileNode) => void;
}

export const FileItem: React.FC<FileItemProps> = ({
  node,
  depth,
  activeTabPath,
  onFileClick,
  expandedPaths,
  onToggleExpand,
  onContextMenuOpen
}) => {
  const isActive = activeTabPath === node.path;
  const isDirectory = node.type === 'directory' || (node as any).isDirectory === true;
  const isOpen = expandedPaths[node.path] || false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      onToggleExpand(node.path);
    } else {
      onFileClick(node.path);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDirectory) {
      e.dataTransfer.setData('application/wos-file-path', node.path);
      e.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <div className="flex flex-col">
      <div
        draggable={!isDirectory}
        onDragStart={handleDragStart}
        className={`flex items-center gap-1.5 px-3 py-0.5 cursor-pointer transition-colors group relative border-l-2 ${
          isActive
            ? 'bg-[var(--primary-muted)] border-[var(--primary)] text-[var(--primary)] font-medium'
            : 'hover:bg-white/[0.03] border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={handleClick}
      >
        <div className="w-4 flex items-center justify-center shrink-0">
          {isDirectory ? (
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            />
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 overflow-hidden">
          <FileIcon
            fileName={node.name}
            size={14}
            isDirectory={isDirectory}
            isOpen={isOpen}
          />
          <span className="text-[12.5px] truncate">
            {node.name}
          </span>
          {node.isModified && (
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] opacity-60 shrink-0" />
          )}
        </div>

        <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              onContextMenuOpen(rect.left, rect.bottom + 4, node);
            }}
            className="p-0.5 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <MoreVertical size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isDirectory && isOpen && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {node.children
              .sort((a, b) => {
                const aDir = a.type === 'directory' || (a as any).isDirectory === true;
                const bDir = b.type === 'directory' || (b as any).isDirectory === true;
                if (aDir === bDir) return a.name.localeCompare(b.name);
                return aDir ? -1 : 1;
              })
              .map(child => (
                <FileItem
                  key={child.path}
                  node={child}
                  depth={depth + 1}
                  activeTabPath={activeTabPath}
                  onFileClick={onFileClick}
                  expandedPaths={expandedPaths}
                  onToggleExpand={onToggleExpand}
                  onContextMenuOpen={onContextMenuOpen}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
