import React, { useState, useEffect, useMemo } from 'react';
import { Cpu, RefreshCw, Trash2, Users } from 'lucide-react';
import { Theme } from '../config/themes';
import { useAuth } from '../contexts/AuthContext';
import { AIUsageStatsCards } from './AIUsageStatsCards';
import { AIUsageCharts } from './AIUsageCharts';
import { AIUsageTable } from './AIUsageTable';

interface AIUsageViewProps {
  theme: Theme;
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface AIUsageReport {
  id: string;
  taskName: string;
  modelId: string;
  tokensInput: number;
  tokensOutput: number;
  costUSD: number;
  durationMs: number;
  timestamp: string;
  success: boolean;
  userId?: string;
  userEmail?: string;
}

export const AIUsageView: React.FC<AIUsageViewProps> = ({ theme, onAddToast }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AIUsageReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  const isMaster = user?.email === 'wilkor.almeida@gmail.com' || user?.id === '69fbc369036a60001cddd998';

  const fetchAIUsage = async () => {
    setIsLoading(true);
    try {
      if ((window as any).api?.analytics?.getAIUsage) {
        const res = await (window as any).api.analytics.getAIUsage();
        if (Array.isArray(res)) {
          setReports(res);
        }
      }
    } catch (err) {
      console.error('[AIUsageView] Erro ao buscar telemetria de IA:', err);
      onAddToast('Erro ao carregar telemetria de consumo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAIUsage();
  }, []);

  const handleClearUsage = async () => {
    const confirmMsg = isMaster 
      ? 'Deseja realmente limpar todo o histórico de consumo e custos de IA de TODOS os usuários? Esta ação não pode ser desfeita.'
      : 'Deseja realmente limpar seu histórico de consumo e custos de IA? Esta ação não pode ser desfeita.';
      
    if (!confirm(confirmMsg)) return;
    
    try {
      if ((window as any).api?.analytics?.clearAIUsage) {
        const res = await (window as any).api.analytics.clearAIUsage();
        if (res.success) {
          setReports([]);
          onAddToast('Histórico de telemetria resetado com sucesso!', 'success');
        } else {
          onAddToast(`Falha ao limpar histórico: ${res.error}`, 'error');
        }
      }
    } catch (err: any) {
      onAddToast(`Erro ao limpar: ${err.message}`, 'error');
    }
  };

  // Mapeia a lista de usuários únicos disponíveis (apenas para o master)
  const uniqueUsers = useMemo(() => {
    const usersSet = new Set<string>();
    reports.forEach((r) => {
      const displayUser = r.userEmail || r.userId;
      if (displayUser) {
        usersSet.add(displayUser);
      }
    });
    return Array.from(usersSet).sort();
  }, [reports]);

  // Filtra os relatórios com base no usuário selecionado
  const filteredReports = useMemo(() => {
    if (selectedUserFilter === 'all') return reports;
    return reports.filter(
      (r) => r.userEmail === selectedUserFilter || r.userId === selectedUserFilter
    );
  }, [reports, selectedUserFilter]);

  // Métricas calculadas baseadas nos dados filtrados
  const stats = useMemo(() => {
    let totalCostUSD = 0;
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let successCount = 0;
    let errorCount = 0;
    let totalDurationMs = 0;

    const modelCosts: Record<string, number> = {};
    const taskCosts: Record<string, number> = {};
    const userCosts: Record<string, { costUSD: number; tokens: number; email: string }> = {};

    filteredReports.forEach((r) => {
      totalCostUSD += r.costUSD || 0;
      totalTokens += (r.tokensInput || 0) + (r.tokensOutput || 0);
      inputTokens += r.tokensInput || 0;
      outputTokens += r.tokensOutput || 0;
      
      if (r.success) {
        successCount++;
        totalDurationMs += r.durationMs || 0;
      } else {
        errorCount++;
      }

      // Custos por modelo
      const model = r.modelId || 'desconhecido';
      modelCosts[model] = (modelCosts[model] || 0) + r.costUSD;

      // Custos por tarefa
      const task = r.taskName || 'Geral';
      taskCosts[task] = (taskCosts[task] || 0) + r.costUSD;

      // Custos por usuário (agregador)
      const uEmail = r.userEmail || 'Desconhecido';
      const uId = r.userId || 'Desconhecido';
      const userKey = uEmail !== 'Desconhecido' ? uEmail : uId;

      if (!userCosts[userKey]) {
        userCosts[userKey] = { costUSD: 0, tokens: 0, email: uEmail };
      }
      userCosts[userKey].costUSD += r.costUSD || 0;
      userCosts[userKey].tokens += (r.tokensInput || 0) + (r.tokensOutput || 0);
    });

    const averageDurationMs = successCount > 0 ? totalDurationMs / successCount : 0;
    const totalCostBRL = totalCostUSD * 5.0; // Projeção cambial de R$ 5,00

    return {
      totalCostUSD,
      totalCostBRL,
      totalTokens,
      inputTokens,
      outputTokens,
      successCount,
      errorCount,
      averageDurationMs,
      modelCosts: Object.entries(modelCosts).sort((a, b) => b[1] - a[1]),
      taskCosts: Object.entries(taskCosts).sort((a, b) => b[1] - a[1]),
      userCosts: Object.entries(userCosts).sort((a, b) => b[1].costUSD - a[1].costUSD)
    };
  }, [filteredReports]);

  return (
    <div 
      className="px-10 py-6 max-w-[1600px] mx-auto w-full h-full flex flex-col gap-6" 
      style={{ color: theme.colors.textMain }}
    >
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Cpu size={18} style={{ color: theme.colors.primary }} />
            Telemetria de Custos e Consumo de IA
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-60" style={{ color: theme.colors.textMuted }}>
            Métricas de tokens, tempo de resposta e projeção financeira em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Seletor de filtro por usuário (apenas para o usuário master) */}
          {isMaster && uniqueUsers.length > 0 && (
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/10 rounded-xl px-3 py-1.5" style={{ borderColor: theme.colors.borderColor }}>
              <Users size={14} className="text-amber-500" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-4"
              >
                <option value="all" className="bg-[#101014] text-white">Todos os Usuários</option>
                {uniqueUsers.map((userKey) => (
                  <option key={userKey} value={userKey} className="bg-[#101014] text-white">
                    {userKey}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchAIUsage}
            disabled={isLoading}
            className="p-2.5 rounded-xl border hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-40"
            style={{ borderColor: theme.colors.borderColor, backgroundColor: theme.colors.bgPanel }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          
          {reports.length > 0 && (
            <button
              onClick={handleClearUsage}
              className="p-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ backgroundColor: theme.colors.bgPanel }}
            >
              <Trash2 size={14} />
              Resetar Histórico
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <AIUsageStatsCards stats={stats} theme={theme} />

      {/* Gráficos de Proporção e Custos por Categoria */}
      <AIUsageCharts stats={stats} theme={theme} isMaster={isMaster && selectedUserFilter === 'all'} />

      {/* Histórico Detalhado */}
      <AIUsageTable reports={filteredReports} theme={theme} isMaster={isMaster} />
    </div>
  );
};
