import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImagePreviewOverlayProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewOverlay: React.FC<ImagePreviewOverlayProps> = ({ imageUrl, onClose }) => {
  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative max-w-full max-h-full rounded-3xl overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <img src={imageUrl} alt="Full Preview" className="w-auto h-auto max-w-full max-h-[90vh] object-contain" />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-md border border-white/10"
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
