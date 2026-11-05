import React from 'react';
import { Terminal, RotateCw, X, FileDown } from 'lucide-react';
import { Theme } from '../config/themes';

interface DashboardHeaderProps {
  theme: Theme;
  activeView: 'analytics' | 'kanban' | 'pull-requests' | 'tech-backlog' | 'ai-usage';
  setActiveView: (view: 'analytics' | 'kanban' | 'pull-requests' | 'tech-backlog' | 'ai-usage') => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  selectedBoard: string;
  setSelectedBoard: (boardId: string) => void;
  boards: any[];
  isLoading: boolean;
  loadAllData: () => void;
  handleBoardChange: (id: string) => void;
  onExportPDF: () => void;
  onClose: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  theme, activeView, setActiveView, timeRange, setTimeRange,
  selectedBoard, boards, isLoading, loadAllData, handleBoardChange, onExportPDF, onClose
}) => {
  return (
    <header className="px-10 py-6 border-b" style={{ borderColor: theme.colors.borderColor }}>
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="p-3 rounded-xl" style={{ backgroundColor: theme.colors.primaryMuted }}>
            <Terminal size={24} style={{ color: theme.colors.primary }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50" style={{ color: theme.colors.primary }}>Command Center</span>
            <span className="text-xl font-black tracking-tight">Dashboard</span>
          </div>
        </div>
        
        <nav className="flex items-center gap-3 p-1.5 rounded-2xl" style={{ backgroundColor: theme.colors.bgPanel }}>
          {['analytics', 'kanban', 'pull-requests', 'tech-backlog', 'ai-usage'].map((view) => (
            <button 
              key={view}
              onClick={() => setActiveView(view as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === view ? 'shadow-lg' : 'opacity-40 hover:opacity-100 hover:bg-white/5'}`}
              style={activeView === view ? { backgroundColor: theme.colors.primary, color: theme.colors.textInverse } : {}}
            >
              {view === 'pull-requests' ? 'PR Review' : view === 'tech-backlog' ? 'Tech Backlog' : view === 'ai-usage' ? 'Consumo de IA' : view}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
           <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: 'all', label: 'ALL' }
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => setTimeRange(p.id)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${timeRange === p.id ? 'bg-primary text-black' : 'opacity-40 hover:opacity-100'}`}
                >
                  {p.label}
                </button>
              ))}
           </div>

           <select value={selectedBoard} onChange={(e) => handleBoardChange(e.target.value)} className="bg-transparent text-[11px] font-black outline-none border rounded-xl px-4 py-2 uppercase tracking-wider" style={{ borderColor: theme.colors.borderColor }}>
             {boards.map(b => <option key={b.id} value={b.id} className="bg-black text-white">{b.name}</option>)}
           </select>

           <button onClick={() => loadAllData()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
              <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} /> {isLoading ? 'Sync' : 'Sync'}
           </button>

           <button onClick={onExportPDF} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-black transition-all disabled:opacity-20">
              <FileDown size={14} /> Report
           </button>

           <button onClick={onClose} className="p-2.5 hover:bg-white/5 rounded-xl transition-all opacity-40 hover:opacity-100"><X size={20} /></button>
        </div>
      </div>
    </header>
  );
};
