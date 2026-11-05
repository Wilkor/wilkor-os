import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Layout, DatabaseZap } from 'lucide-react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend, ArcElement, PointElement, LineElement
} from 'chart.js'
import { exportDashboardToPDF } from '../utils/dashboardExportUtils'
import { exportAIUsageToPDF } from '../utils/aiUsageExportUtils'
import {
  getTrelloRankingData, getGitRankingData, getPipelineChartData
} from '../utils/dashboardChartUtils'
import { TrelloCard, DashboardStats, ProjectDashboardProps, TrendStats } from './DashboardUtils'
import { AnalyticsView } from './AnalyticsView'
import { KanbanView } from './KanbanView'
import { PRReviewView } from './PRReviewView'
import { DashboardHeader } from './DashboardHeader'
import { TechBacklogView } from './spec-pipeline/TechBacklogView'
import { AIUsageView } from './AIUsageView'
import { useDashboardData } from '../hooks/useDashboardData'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend)

export interface TrelloBoard {
  id: string
  name: string
}

export interface WindowWithPipeline {
  api: {
    pipeline: {
      getGitStats: (repoPaths: string[], since: string, forceRefresh: boolean) =>
        Promise<{ success: boolean; stats: Record<string, number> }>
      getTrelloBoards: () => Promise<{ success: boolean; boards: TrelloBoard[] }>
      getTrelloLists: (boardId: string) =>
        Promise<{ success: boolean; lists: { id: string; name: string }[] }>
      getTrelloCards: (listId: string) => Promise<{ success: boolean; cards: TrelloCard[] }>
    }
    analytics: {
      getTrend: (boardId: string) => Promise<{ success: boolean; oldStats: TrendStats | null }>
      saveSnapshot: (boardId: string, stats: DashboardStats) =>
        Promise<{ success: boolean; message?: string } | void>
    }
  }
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  onAddToast, onClose, onOpenFile, theme, onStartSpecification
}) => {
  const [activeView, setActiveView] = useState<'analytics' | 'kanban' | 'pull-requests' | 'tech-backlog' | 'ai-usage'>('analytics')
  const [hasLoaded, setHasLoaded] = useState(false)
  const [repoPaths, setRepoPaths] = useState<string[]>([])

  useEffect(() => {
    window.api.workspace.getRoots().then((roots: string[]) => {
      setRepoPaths(roots || [])
    })
  }, [])

  const {
    boards, selectedBoard, isLoading, timeRange, setTimeRange, stats,
    discoveryCards, backlogCards, despriorizadoCards, prioritizedCards,
    todoCards, doingCards, doneCards, bugsCards,
    loadAllData, handleBoardChange
  } = useDashboardData({ onAddToast })

  // Salva snapshot no MongoDB para histórico futuro
  useEffect(() => {
    if (!isLoading && selectedBoard && stats.totalCards > 0) {
      const saveSnapshot = async (): Promise<void> => {
        try {
          const result = await (window as unknown as WindowWithPipeline).api.analytics.saveSnapshot(
            selectedBoard, stats
          )
          if (result && typeof result === 'object' && 'message' in result) {
            console.log(`ℹ️ [wOs] ${result.message}`)
          }
        } catch (e) { console.error('❌ [wOs] Erro ao gravar snapshot:', e) }
      }
      const timer = setTimeout(saveSnapshot, 2000)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [isLoading, selectedBoard, stats.totalCards])

  const trelloRankingData = useMemo(() => getTrelloRankingData(stats), [stats])
  const gitRankingData = useMemo(() => getGitRankingData(stats), [stats])
  const pipelineChartData = useMemo(
    () => getPipelineChartData(discoveryCards, backlogCards, todoCards, doingCards, doneCards, bugsCards),
    [discoveryCards, backlogCards, todoCards, doingCards, doneCards, bugsCards]
  )

  return (
    <div
      className="w-full h-full flex flex-col select-none overflow-hidden"
      style={{ backgroundColor: theme.colors.bgApp, color: theme.colors.textMain }}
    >
      <DashboardHeader
        theme={theme}
        activeView={activeView}
        setActiveView={setActiveView}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        selectedBoard={selectedBoard}
        setSelectedBoard={(id) => handleBoardChange(id)}
        boards={boards}
        isLoading={isLoading}
        loadAllData={() => loadAllData(undefined, true)}
        handleBoardChange={handleBoardChange}
        onExportPDF={() => {
          if (activeView === 'ai-usage') {
            exportAIUsageToPDF('dashboard-content', theme, onAddToast, () => {})
          } else {
            exportDashboardToPDF(
              'dashboard-content', selectedBoard, boards, stats,
              discoveryCards.length, backlogCards.length, todoCards.length,
              doingCards.length, doneCards.length, bugsCards.length,
              theme, onAddToast, () => {}
            )
          }
        }}
        onClose={onClose}
      />

      <main id="dashboard-content" className="flex-1 overflow-y-auto relative no-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-50 bg-black/20 backdrop-blur-sm"
            >
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-sm font-black uppercase tracking-widest opacity-60">
                Sincronizando Ecossistema...
              </p>
            </motion.div>
          ) : null}

          {!hasLoaded && activeView !== 'ai-usage' && activeView !== 'tech-backlog' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="max-w-md p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center">
                <div className="p-4 bg-primary/10 rounded-2xl mb-4 text-primary">
                  <Layout size={40} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-wider mb-2">
                  Painel de Controle
                </h3>
                <p className="text-xs text-text-muted mb-6 leading-relaxed">
                  Escolha o período desejado no cabeçalho e clique no botão abaixo para carregar as
                  métricas de Git, Bitbucket e Kanban do Trello.
                </p>
                <button
                  onClick={() => { loadAllData(undefined, false); setHasLoaded(true) }}
                  className="px-5 py-2.5 bg-primary text-black rounded-xl font-black uppercase text-[10px] tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)] flex items-center gap-2"
                >
                  <DatabaseZap size={12} />
                  Carregar
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {activeView === 'analytics' && (
                <AnalyticsView
                  stats={stats}
                  theme={theme}
                  doneCardsCount={doneCards.length}
                  bugsCardsCount={bugsCards.length}
                  trelloRankingData={trelloRankingData}
                  gitRankingData={gitRankingData}
                  pipelineChartData={pipelineChartData}
                  chartOptions={{
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }}
                />
              )}
              {activeView === 'kanban' && (
                <KanbanView
                  discoveryCards={discoveryCards}
                  backlogCards={backlogCards}
                  despriorizadoCards={despriorizadoCards}
                  prioritizedCards={prioritizedCards}
                  todoCards={todoCards}
                  doingCards={doingCards}
                  doneCards={doneCards}
                  bugsCards={bugsCards}
                  theme={theme}
                  onOpenFile={onOpenFile}
                  onStartSpecification={(card) => onStartSpecification && onStartSpecification(card)}
                />
              )}
              {activeView === 'pull-requests' && (
                <PRReviewView repoPaths={repoPaths} theme={theme} onOpenFile={onOpenFile} />
              )}
              {activeView === 'tech-backlog' && (
                <TechBacklogView theme={theme} onStartSpecification={onStartSpecification || (() => {})} />
              )}
              {activeView === 'ai-usage' && (
                <AIUsageView theme={theme} onAddToast={onAddToast} />
              )}
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default ProjectDashboard
