import React from 'react';
import { motion } from 'framer-motion';

export const WosPixelLogo: React.FC = () => {
  // Matrizes 5x7 representando as letras "w" (minúsculo), "O" (maiúsculo), "s" (minúsculo)
  const letterW = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0]
  ];

  const letterO = [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ];

  const letterS = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0]
  ];

  const letters = [
    { matrix: letterW, id: 'w' },
    { matrix: letterO, id: 'O' },
    { matrix: letterS, id: 's' }
  ];

  // Retorna a cor exata HSL com base na letra e posição Y para replicar o logo oficial
  const getPixelStyle = (letterId: string, y: number) => {
    if (letterId === 'w') {
      // Ciano / Verde Piscina bem neon e constante
      return {
        hue: 178,
        saturation: 90,
        lightness: 50
      };
    } else if (letterId === 'O') {
      // Degradê do Azul Piscina/Ciano claro no topo para o Azul Escuro/Royal na base
      const ratio = y / 6;
      const hue = Math.round(186 + ratio * 26); // 186 a 212
      return {
        hue,
        saturation: 92,
        lightness: 54
      };
    } else {
      // Degradê de Roxo para Lilás/Rosa Violeta neon (linhas 2 a 6)
      const ratio = (y - 2) / 4;
      const hue = Math.round(258 + ratio * 32); // 258 a 290
      return {
        hue,
        saturation: 88,
        lightness: 60
      };
    }
  };

  return (
    <div className="flex justify-center items-center gap-5 mb-8 select-none">
      {letters.map((letter, letterIndex) => (
        <div 
          key={letter.id}
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: 'repeat(5, 10px)',
            gridTemplateRows: 'repeat(7, 10px)',
          }}
        >
          {letter.matrix.flatMap((row, y) =>
            row.map((active, x) => {
              if (!active) {
                return <div key={`${y}-${x}`} className="w-[10px] h-[10px]" />;
              }

              const { hue, saturation, lightness } = getPixelStyle(letter.id, y);
              const animationDelay = (y * 5 + x + letterIndex * 8) * 0.006;

              return (
                <motion.div
                  key={`${y}-${x}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.85 }}
                  whileHover={{ 
                    scale: 1.35, 
                    opacity: 1,
                    boxShadow: `0 0 12px hsl(${hue}, ${saturation}%, ${lightness + 8}%)`,
                    transition: { duration: 0.1 }
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 15,
                    delay: animationDelay,
                  }}
                  className="w-[10px] h-[10px] rounded-[2px]"
                  style={{
                    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                    boxShadow: `0 0 5px hsl(${hue}, ${saturation}%, ${lightness}%, 0.4)`,
                    cursor: 'pointer',
                  }}
                />
              );
            })
          )}
        </div>
      ))}
    </div>
  );
};
