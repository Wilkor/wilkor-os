import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Loader2, GitPullRequest, Search, Activity, Info, AlertTriangle, RefreshCw } from 'lucide-react';
import { Theme } from '../config/themes';
import { PRCard } from './PRCard';
import { computePRQuality } from './PRInsights';
import { DashboardCache, CACHE_TTL } from '../utils/DashboardCache';

interface PRReviewViewProps {
  repoPaths: string[];
  theme: Theme;
  onOpenFile?: (path: string, analysis?: any) => void;
}

export const PRReviewView: React.FC<PRReviewViewProps> = ({ repoPaths, theme, onOpenFile }) => {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DECLINED' | 'MERGED'>('OPEN');
  const [agents, setAgents] = useState<any[]>([]);

  const fetchAgents = useCallback(async () => {
    const cacheKey = 'pr_agents_list';
    const cached = DashboardCache.get<any[]>(cacheKey);
    if (cached) { setAgents(cached); return; }
    try {
      const res = await (window as any).api.agents.list();
      if (res?.success) {
        setAgents(res.agents || []);
        DashboardCache.set(cacheKey, res.agents || [], CACHE_TTL.AGENTS);
      }
    } catch (err) {
      console.error('Erro ao buscar agentes:', err);
    }
  }, []);

  const fetchPRs = useCallback(async (forceRefresh = false) => {
    const cacheKey = `pull_requests_${repoPaths.join(',')}`;
    if (!forceRefresh) {
      const cached = DashboardCache.get<any[]>(cacheKey);
      if (cached) {
        setPrs(cached);
        setHasFetched(true);
        return;
      }
    } else {
      DashboardCache.invalidate(cacheKey);
    }
    setLoading(true);
    try {
      const result = await (window as any).api.pipeline.getPullRequests([...repoPaths]);
      if (result.success) {
        setPrs(result.prs);
        DashboardCache.set(cacheKey, result.prs, CACHE_TTL.PULL_REQUESTS);
        if (result.apiErrors) setApiErrors(result.apiErrors);
        else setApiErrors([]);
      }
    } catch (err) {
      console.error('Erro ao buscar PRs:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [repoPaths]);

  useEffect(() => {
    fetchAgents();
    fetchPRs(false);
  }, [fetchAgents, fetchPRs]);

  const filteredPRs = prs.filter(pr => {
    const matchesSearch = pr.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.repo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.author?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' ||
      (pr.status && pr.status.toUpperCase() === statusFilter) ||
      (!pr.status && statusFilter === 'OPEN'); // Fallback para branches locais sem status
      
    return matchesSearch && matchesStatus;
  });

  const avgQuality = filteredPRs.length > 0 
    ? Math.round(filteredPRs.reduce((acc, pr) => acc + computePRQuality(pr).score, 0) / filteredPRs.length) 
    : 100;

  const systemHealth = apiErrors.length > 0 ? 'Degraded' : (filteredPRs.some(p => computePRQuality(p).score < 40) ? 'Warning' : 'Optimal');

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[60vh] transition-colors duration-500" style={{ backgroundColor: theme.colors.bgApp }}>
        <div className="p-10 rounded-2xl border shadow-sm" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
          <Loader2 className="animate-spin" size={40} style={{ color: theme.colors.primary }} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: theme.colors.primary }}>Syncing Cluster...</p>
      </div>
    );
  }

  if (!hasFetched) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[60vh]" style={{ backgroundColor: theme.colors.bgApp }}>
        <button
          onClick={() => fetchPRs(false)}
          className="px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-[1.02] transition-all shadow-lg"
          style={{ backgroundColor: theme.colors.primary, color: '#000' }}
        >
          <GitPullRequest size={14} /> Carregar Pull Requests
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 space-y-8 max-w-[1400px] mx-auto"
    >
      {/* SaaS Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between p-6 rounded-xl border shadow-sm" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
              <GitPullRequest size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.colors.textMain }}>
                PR Intelligence
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-medium" style={{ color: theme.colors.textMuted }}>Command & Control Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Botão de refresh manual */}
            <button
              onClick={() => fetchPRs(true)}
              disabled={loading}
              title="Forçar atualização dos PRs"
              className="p-2 rounded-lg border hover:scale-105 transition-all disabled:opacity-40"
              style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor, color: theme.colors.textMuted }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: theme.colors.textMuted }} />
              <input 
                type="text"
                placeholder="Search PRs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border text-[12px] font-medium outline-none w-[180px] transition-all shadow-sm focus:w-[220px]"
                style={{ 
                  backgroundColor: theme.colors.bgApp, 
                  borderColor: theme.colors.borderColor,
                  color: theme.colors.textMain
                }}
              />
            </div>

            {/* Status Tabs Filter */}
            <div className="flex items-center gap-0.5 p-1 rounded-lg border shadow-sm" style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor }}>
              {(['ALL', 'OPEN', 'DECLINED', 'MERGED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className="px-2.5 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: statusFilter === status ? theme.colors.primary : 'transparent',
                    color: statusFilter === status ? '#ffffff' : theme.colors.textMuted
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg border shadow-sm" style={{ backgroundColor: theme.colors.bgApp, borderColor: theme.colors.borderColor }}>
                <ShieldCheck size={16} style={{ color: theme.colors.primary }} />
                <span className="text-base font-bold" style={{ color: theme.colors.textMain }}>{filteredPRs.length}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{statusFilter === 'ALL' ? 'Active' : statusFilter}</span>
            </div>
          </div>
        </div>

        {/* Compact Analytic KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'System Health', value: systemHealth, icon: ShieldCheck, accent: systemHealth === 'Optimal' ? '#10b981' : systemHealth === 'Warning' ? '#f59e0b' : '#ef4444' },
            { label: 'Avg Quality', value: `${avgQuality}%`, icon: Zap, accent: theme.colors.primary },
            { label: 'Risk Scan', value: 'Secured', icon: Activity, accent: '#6366f1' },
            { label: 'Queue', value: filteredPRs.length.toString(), icon: Info, accent: theme.colors.textMuted }
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-xl border shadow-sm flex items-center justify-between" style={{ backgroundColor: theme.colors.bgPanel, borderColor: theme.colors.borderColor }}>
              <div className="flex flex-col gap-0.5">
                 <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{stat.label}</span>
                 <span className="text-base font-bold tracking-tight" style={{ color: theme.colors.textMain }}>{stat.value}</span>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.accent}15` }}>
                 <stat.icon size={14} style={{ color: stat.accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {apiErrors.length > 0 && (
        <div className="p-4 rounded-xl border bg-rose-500/5 shadow-sm space-y-3" style={{ borderColor: '#ef444420' }}>
          <div className="flex items-center gap-2.5 text-rose-500">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Sync Issues ({apiErrors.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {apiErrors.map((err, idx) => (
              <p key={idx} className="text-[10px] font-mono p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5" style={{ color: theme.colors.textMuted }}>{err}</p>
            ))}
          </div>
        </div>
      )}

      {/* Main PR List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 px-1">
           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
           <h3 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.colors.textMuted }}>Deployment Queue</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredPRs.length > 0 ? filteredPRs.map((pr, i) => (
            <PRCard 
              key={i} 
              pr={pr} 
              index={i} 
              theme={theme} 
              onOpenFile={onOpenFile} 
              agents={agents}
            />
          )) : (
            <div className="py-24 rounded-2xl border-2 border-dashed flex flex-col items-center gap-5" style={{ borderColor: theme.colors.borderColor, backgroundColor: `${theme.colors.bgPanel}50` }}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center opacity-20" style={{ backgroundColor: theme.colors.bgApp }}>
                <Search size={32} style={{ color: theme.colors.textMuted }} />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: theme.colors.textMuted }}>No Active Transmissions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
