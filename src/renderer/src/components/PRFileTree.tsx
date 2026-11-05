import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import { Theme } from '../config/themes';

interface PRFileTreeProps {
  item: any;
  depth: number;
  selectedPath: string | null;
  setSelectedFile: (file: any) => void;
  theme: Theme;
}

export const PRFileTree: React.FC<PRFileTreeProps> = ({ 
  item, depth, selectedPath, setSelectedFile, theme 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (item.name === 'root') {
    return (
      <div className="space-y-0.5">
        {Object.values(item.children).map((child: any) => (
          <PRFileTree 
            key={child.name} 
            item={child} 
            depth={depth} 
            selectedPath={selectedPath} 
            setSelectedFile={setSelectedFile} 
            theme={theme} 
          />
        ))}
        {item.files.map((file: any) => (
          <PRFileItem 
            key={file.path} 
            file={file} 
            depth={depth} 
            selectedPath={selectedPath} 
            setSelectedFile={setSelectedFile} 
            theme={theme} 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left group"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {isExpanded ? <ChevronDown size={12} className="opacity-40" /> : <ChevronRight size={12} className="opacity-40" />}
        <Folder size={14} className="text-amber-500/70 group-hover:text-amber-500 transition-colors" />
        <span className="text-[10px] font-bold opacity-70 truncate" style={{ color: theme.colors.textMain }}>{item.name}</span>
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {Object.values(item.children).map((child: any) => (
              <PRFileTree 
                key={child.name} 
                item={child} 
                depth={depth + 1} 
                selectedPath={selectedPath} 
                setSelectedFile={setSelectedFile} 
                theme={theme} 
              />
            ))}
            {item.files.map((file: any) => (
              <PRFileItem 
                key={file.path} 
                file={file} 
                depth={depth + 1} 
                selectedPath={selectedPath} 
                setSelectedFile={setSelectedFile} 
                theme={theme} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface PRFileItemProps {
  file: any;
  depth: number;
  selectedPath: string | null;
  setSelectedFile: (file: any) => void;
  theme: Theme;
}

const PRFileItem: React.FC<PRFileItemProps> = ({ 
  file, depth, selectedPath, setSelectedFile, theme 
}) => {
  const fileName = file.path.split('/').pop();
  const isSelected = selectedPath === file.path;

  return (
    <button 
      onClick={() => setSelectedFile(file)}
      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 transition-all group ${isSelected ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
      style={{ paddingLeft: `${depth * 12 + 28}px` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <FileCode size={14} className={isSelected ? 'text-primary' : 'opacity-40'} />
        <span className={`text-[10px] font-mono truncate ${isSelected ? 'font-bold' : ''}`} style={{ color: isSelected ? theme.colors.primary : theme.colors.textMain }}>
          {fileName}
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[9px] flex-shrink-0">
        {file.additions > 0 && <span className="text-emerald-500">+{file.additions}</span>}
        {file.deletions > 0 && <span className="text-rose-500">-{file.deletions}</span>}
      </div>
    </button>
  );
};
