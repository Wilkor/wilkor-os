import React from 'react';
import { 
  FileCode, 
  FileJson, 
  FileType, 
  File as FileIconDefault, 
  Image as ImageIcon,
  Wind,
  Folder,
  FolderOpen
} from 'lucide-react';

interface FileIconProps {
  fileName: string;
  size?: number;
  className?: string;
  isDirectory?: boolean;
  isOpen?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({ 
  fileName, 
  size = 16, 
  className = "", 
  isDirectory = false,
  isOpen = false
}) => {
  if (isDirectory) {
    return isOpen 
      ? <FolderOpen size={size} className={`text-yellow-500/80 ${className}`} /> 
      : <Folder size={size} className={`text-yellow-500/80 ${className}`} />;
  }

  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'tsx':
    case 'jsx':
      return <FileCode size={size} className={`text-blue-400 ${className}`} />;
    case 'ts':
    case 'js':
      return <FileCode size={size} className={`text-yellow-400 ${className}`} />;
    case 'json':
      return <FileJson size={size} className={`text-orange-400 ${className}`} />;
    case 'css':
      return <Wind size={size} className={`text-blue-300 ${className}`} />;
    case 'md':
      return <FileType size={size} className={`text-blue-500 ${className}`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
      return <ImageIcon size={size} className={`text-purple-400 ${className}`} />;
    case 'html':
      return <FileCode size={size} className={`text-orange-500 ${className}`} />;
    default:
      return <FileIconDefault size={size} className={`text-[var(--text-muted)] opacity-60 ${className}`} />;
  }
};

