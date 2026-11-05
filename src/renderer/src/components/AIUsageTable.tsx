import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Theme } from '../config/themes';

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

interface AIUsageTableProps {
  reports: AIUsageReport[];
  theme: Theme;
  isMaster: boolean;
}

export const AIUsageTable: React.FC<AIUsageTableProps> = ({ reports, theme, isMaster }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (_) {
      return 'Data Inválida';
    }
  };

  return (
    <div 
      className="flex-1 border rounded-2xl bg-white/[0.01] flex flex-col overflow-hidden border-white/5" 
      style={{ backgroundColor: theme.colors.bgPanel }}
    >
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-black text-xs uppercase tracking-wider">Histórico de Execuções</h3>
        <span className="text-[9px] font-bold px-2.5 py-1 bg-white/5 rounded-lg opacity-70">
          Exibindo {reports.length} registros
        </span>
      </div>

      <div className="flex-1 overflow-auto max-h-[400px] no-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[9px] font-black uppercase tracking-wider text-text-muted opacity-60">
              <th className="px-6 py-3">Timestamp</th>
              {isMaster && <th className="px-6 py-3">Usuário</th>}
              <th className="px-6 py-3">Tarefa / Escopo</th>
              <th className="px-6 py-3">Modelo</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Tokens (In / Out)</th>
              <th className="px-6 py-3 text-right">Tempo</th>
              <th className="px-6 py-3 text-right">Custo (USD)</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={isMaster ? 8 : 7} className="text-center py-10 text-xs text-text-muted opacity-50">
                  Nenhuma chamada de IA registrada no histórico.
                </td>
              </tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors text-[10px]">
                  <td className="px-6 py-3.5 opacity-60 whitespace-nowrap">{formatDate(r.timestamp)}</td>
                  {isMaster && (
                    <td className="px-6 py-3.5 font-bold text-amber-500 opacity-90 truncate max-w-[150px]" title={r.userEmail || r.userId}>
                      {r.userEmail || r.userId || 'Desconhecido'}
                    </td>
                  )}
                  <td className="px-6 py-3.5 font-bold uppercase tracking-tight">{r.taskName || 'Geral'}</td>
                  <td 
                    className="px-6 py-3.5 font-bold text-primary opacity-90 uppercase" 
                    style={{ color: theme.colors.primary }}
                  >
                    {r.modelId}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="inline-flex items-center justify-center">
                      {r.success ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <XCircle size={13} className="text-red-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold whitespace-nowrap">
                    {r.modelId.includes('dall-e') ? '-' : `${r.tokensInput.toLocaleString('pt-BR')} / ${r.tokensOutput.toLocaleString('pt-BR')}`}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold whitespace-nowrap">
                    {(r.durationMs / 1000).toFixed(2)}s
                  </td>
                  <td 
                    className="px-6 py-3.5 text-right font-black" 
                    style={{ color: theme.colors.primary }}
                  >
                    ${r.costUSD.toFixed(5)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
