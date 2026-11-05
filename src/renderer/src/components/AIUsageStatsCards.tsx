import React from 'react';
import { DollarSign, Zap, Clock, BarChart3, LucideIcon } from 'lucide-react';
import { Theme } from '../config/themes';

interface StatsData {
  totalCostUSD: number;
  totalCostBRL: number;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  successCount: number;
  errorCount: number;
  averageDurationMs: number;
}

interface AIUsageStatsCardsProps {
  stats: StatsData;
  theme: Theme;
}

interface MetricCardProps {
  title: string;
  val: string;
  detail: string;
  icon: LucideIcon;
  color: string;
  theme: Theme;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, val, detail, icon: Icon, color, theme }) => (
  <div 
    className="p-5 border rounded-2xl bg-white/[0.01] flex items-center justify-between border-white/5 hover:border-white/10 transition-all relative overflow-hidden group" 
    style={{ backgroundColor: theme.colors.bgPanel }}
  >
    <div 
      className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-[0.03] group-hover:scale-110 transition-transform" 
      style={{ backgroundColor: color }} 
    />
    <div className="flex flex-col gap-1 z-10">
      <span className="text-[9px] font-black uppercase tracking-wider opacity-60" style={{ color: theme.colors.textMuted }}>
        {title}
      </span>
      <span className="text-xl font-black tracking-tight" style={{ color: theme.colors.textMain }}>
        {val}
      </span>
      <span className="text-[10px] font-bold opacity-55 truncate max-w-[200px]" style={{ color: theme.colors.textMuted }}>
        {detail}
      </span>
    </div>
    <div className="p-3.5 rounded-xl z-10" style={{ backgroundColor: `${color}15`, color: color }}>
      <Icon size={20} />
    </div>
  </div>
);

export const AIUsageStatsCards: React.FC<AIUsageStatsCardsProps> = ({ stats, theme }) => {
  const cards = [
    { 
      title: 'Investimento em IA', 
      val: `$${stats.totalCostUSD.toFixed(3)}`, 
      detail: `Projeção: R$ ${stats.totalCostBRL.toFixed(2)}`, 
      icon: DollarSign, 
      color: theme.colors.primary 
    },
    { 
      title: 'Total de Tokens', 
      val: stats.totalTokens.toLocaleString('pt-BR'), 
      detail: `In: ${stats.inputTokens.toLocaleString('pt-BR')} | Out: ${stats.outputTokens.toLocaleString('pt-BR')}`, 
      icon: Zap, 
      color: '#f59e0b' 
    },
    { 
      title: 'Tempo Médio Resposta', 
      val: `${(stats.averageDurationMs / 1000).toFixed(2)}s`, 
      detail: `Baseado em ${stats.successCount} chamadas`, 
      icon: Clock, 
      color: '#10b981' 
    },
    { 
      title: 'Total de Requisições', 
      val: (stats.successCount + stats.errorCount).toString(), 
      detail: `Sucesso: ${stats.successCount} | Falha: ${stats.errorCount}`, 
      icon: BarChart3, 
      color: '#8b5cf6' 
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => (
        <MetricCard 
          key={i} 
          title={c.title} 
          val={c.val} 
          detail={c.detail} 
          icon={c.icon} 
          color={c.color} 
          theme={theme} 
        />
      ))}
    </div>
  );
};
