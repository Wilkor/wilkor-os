import React from 'react';
import { Theme } from '../config/themes';

interface UserCostData {
  costUSD: number;
  tokens: number;
  email: string;
}

interface AIUsageChartsProps {
  stats: {
    totalCostUSD: number;
    modelCosts: [string, number][];
    taskCosts: [string, number][];
    userCosts: [string, UserCostData][];
  };
  theme: Theme;
  isMaster: boolean;
}

export const AIUsageCharts: React.FC<AIUsageChartsProps> = ({ stats, theme, isMaster }) => {
  return (
    <div className={`grid grid-cols-1 ${isMaster ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
      {/* Distribuição por Modelo */}
      <div 
        className="p-6 border rounded-2xl bg-white/[0.01] flex flex-col gap-4 border-white/5" 
        style={{ backgroundColor: theme.colors.bgPanel }}
      >
        <div>
          <h3 className="font-black text-xs uppercase tracking-wider">Custo por Modelo</h3>
          <span className="text-[9px] text-text-muted opacity-60">Proporção financeira consumida de cada API</span>
        </div>
        <div className="flex flex-col gap-3 flex-1 justify-center">
          {stats.modelCosts.length === 0 ? (
            <span className="text-xs text-text-muted opacity-50 py-10 text-center">Nenhum dado de modelo disponível</span>
          ) : (
            stats.modelCosts.map(([model, cost]) => {
              const percent = stats.totalCostUSD > 0 ? (cost / stats.totalCostUSD) * 100 : 0;
              return (
                <div key={model} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="uppercase tracking-wider text-primary" style={{ color: theme.colors.primary }}>
                      {model}
                    </span>
                    <span className="opacity-70">${cost.toFixed(4)} ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                      style={{ width: `${percent}%`, backgroundColor: theme.colors.primary }} 
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Distribuição por Tarefa */}
      <div 
        className="p-6 border rounded-2xl bg-white/[0.01] flex flex-col gap-4 border-white/5" 
        style={{ backgroundColor: theme.colors.bgPanel }}
      >
        <div>
          <h3 className="font-black text-xs uppercase tracking-wider">Custo por Tarefa</h3>
          <span className="text-[9px] text-text-muted opacity-60">Proporção financeira consumida de cada funcionalidade</span>
        </div>
        <div className="flex flex-col gap-3 flex-1 justify-center">
          {stats.taskCosts.length === 0 ? (
            <span className="text-xs text-text-muted opacity-50 py-10 text-center">Nenhum dado de tarefa disponível</span>
          ) : (
            stats.taskCosts.slice(0, 5).map(([task, cost]) => {
              const percent = stats.totalCostUSD > 0 ? (cost / stats.totalCostUSD) * 100 : 0;
              return (
                <div key={task} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="truncate pr-4 uppercase tracking-wider opacity-85">{task}</span>
                    <span className="opacity-70">${cost.toFixed(4)} ({percent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Distribuição por Usuário (apenas Master) */}
      {isMaster && (
        <div 
          className="p-6 border rounded-2xl bg-white/[0.01] flex flex-col gap-4 border-white/5" 
          style={{ backgroundColor: theme.colors.bgPanel }}
        >
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider">Custo por Usuário</h3>
            <span className="text-[9px] text-text-muted opacity-60">Proporção financeira segregada por pessoa</span>
          </div>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            {stats.userCosts.length === 0 ? (
              <span className="text-xs text-text-muted opacity-50 py-10 text-center">Nenhum dado de usuário disponível</span>
            ) : (
              stats.userCosts.slice(0, 5).map(([userKey, data]) => {
                const percent = stats.totalCostUSD > 0 ? (data.costUSD / stats.totalCostUSD) * 100 : 0;
                return (
                  <div key={userKey} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="truncate pr-4 uppercase tracking-wider text-amber-500">
                        {userKey}
                      </span>
                      <span className="opacity-70">${data.costUSD.toFixed(4)} ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full" 
                        style={{ width: `${percent}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
