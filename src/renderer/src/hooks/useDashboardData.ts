/**
 * useDashboardData.ts
 * Hook customizado que centraliza toda a lógica de carregamento e cache
 * dos dados do Dashboard (Trello, Git, Trend). Isso mantém o
 * ProjectDashboard.tsx dentro do limite de 300 linhas.
 */
import { useState, useEffect, useMemo } from 'react'
import { DashboardCache, CACHE_TTL } from '../utils/DashboardCache'
import {
  TrelloCard,
  DashboardStats,
  calculateDashboardStats,
  TrendStats
} from '../components/DashboardUtils'
import { TrelloBoard, WindowWithPipeline } from '../components/ProjectDashboard'

interface UseDashboardDataOptions {
  onAddToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void
}

export function useDashboardData({ onAddToast }: UseDashboardDataOptions) {
  const [boards, setBoards] = useState<TrelloBoard[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [gitStats, setGitStats] = useState<Record<string, number>>({})
  const [timeRange, setTimeRange] = useState<string>('7d')
  const [trendStats, setTrendStats] = useState<TrendStats | null>(null)

  const [discoveryCards, setDiscoveryCards] = useState<TrelloCard[]>([])
  const [backlogCards, setBacklogCards] = useState<TrelloCard[]>([])
  const [despriorizadoCards, setDespriorizadoCards] = useState<TrelloCard[]>([])
  const [prioritizedCards, setPrioritizedCards] = useState<TrelloCard[]>([])
  const [todoCards, setTodoCards] = useState<TrelloCard[]>([])
  const [doingCards, setDoingCards] = useState<TrelloCard[]>([])
  const [doneCards, setDoneCards] = useState<TrelloCard[]>([])
  const [bugsCards, setBugsCards] = useState<TrelloCard[]>([])

  const allCards = useMemo(
    () => [...discoveryCards, ...backlogCards, ...despriorizadoCards,
           ...prioritizedCards, ...todoCards, ...doingCards, ...doneCards, ...bugsCards],
    [discoveryCards, backlogCards, despriorizadoCards, prioritizedCards,
     todoCards, doingCards, doneCards, bugsCards]
  )

  const stats = useMemo<DashboardStats>(
    () => calculateDashboardStats(allCards, doneCards, doingCards, bugsCards, gitStats, trendStats),
    [allCards, doneCards, doingCards, bugsCards, gitStats, trendStats]
  )

  const loadGitStats = async (forceRefresh = false): Promise<void> => {
    const sinceMap: Record<string, string> = {
      '7d': '7 days ago', '30d': '30 days ago', '90d': '90 days ago', all: ''
    }
    const cacheKey = `git_stats_${timeRange}`
    if (!forceRefresh) {
      const cached = DashboardCache.get<Record<string, number>>(cacheKey)
      if (cached) { setGitStats(cached); return }
    }
    const repoPaths = await (window as any).api.workspace.getRoots()
    const result = await (window as unknown as WindowWithPipeline).api.pipeline.getGitStats(
      repoPaths, sinceMap[timeRange] || '', forceRefresh
    )
    if (result.success) {
      setGitStats(result.stats)
      DashboardCache.set(cacheKey, result.stats, CACHE_TTL.GIT_STATS)
    }
  }

  const loadAllData = async (targetBoardId?: string, forceRefresh = false): Promise<void> => {
    if (forceRefresh) {
      DashboardCache.invalidatePrefix('trello_')
      DashboardCache.invalidatePrefix('git_stats_')
      DashboardCache.invalidatePrefix('trend_')
    }

    const boardCacheKey = 'trello_boards'
    const cachedBoards = DashboardCache.get<TrelloBoard[]>(boardCacheKey)

    if (!forceRefresh && cachedBoards) {
      const savedBoard = localStorage.getItem('wOs_lastTrelloBoard')
      const boardId = targetBoardId || selectedBoard || savedBoard || cachedBoards[0]?.id
      const cachedCards = DashboardCache.get<{
        discovery: TrelloCard[]; backlog: TrelloCard[]; despriorizado: TrelloCard[];
        prioritized: TrelloCard[]; todo: TrelloCard[]; doing: TrelloCard[];
        done: TrelloCard[]; bugs: TrelloCard[];
      }>(`trello_cards_${boardId}`)

      if (cachedCards) {
        setBoards(cachedBoards)
        if (boardId && boardId !== selectedBoard) setSelectedBoard(boardId)
        setDiscoveryCards(cachedCards.discovery)
        setBacklogCards(cachedCards.backlog)
        setDespriorizadoCards(cachedCards.despriorizado)
        setPrioritizedCards(cachedCards.prioritized)
        setTodoCards(cachedCards.todo)
        setDoingCards(cachedCards.doing)
        setDoneCards(cachedCards.done)
        setBugsCards(cachedCards.bugs)
        await loadGitStats(false)
        const cachedTrend = DashboardCache.get<TrendStats | null>(`trend_${boardId}`)
        if (cachedTrend !== null) setTrendStats(cachedTrend)
        return
      }
    }

    setIsLoading(true)
    setDiscoveryCards([]); setBacklogCards([]); setDespriorizadoCards([])
    setPrioritizedCards([]); setTodoCards([]); setDoingCards([])
    setDoneCards([]); setBugsCards([])

    try {
      const [boardRes] = await Promise.all([
        (window as unknown as WindowWithPipeline).api.pipeline.getTrelloBoards(),
        loadGitStats(forceRefresh)
      ])

      if (boardRes.success && boardRes.boards) {
        DashboardCache.set(boardCacheKey, boardRes.boards, CACHE_TTL.TRELLO_BOARDS)
        setBoards(boardRes.boards)
        const savedBoard = localStorage.getItem('wOs_lastTrelloBoard')
        const techBoard = boardRes.boards.find((b: TrelloBoard) => b.name.toLowerCase().includes('tech'))
        const boardId = targetBoardId || selectedBoard || savedBoard ||
          (techBoard ? techBoard.id : boardRes.boards[0]?.id)

        if (boardId) {
          if (boardId !== selectedBoard) setSelectedBoard(boardId)
          localStorage.setItem('wOs_lastTrelloBoard', boardId)

          const listRes = await (window as unknown as WindowWithPipeline).api.pipeline.getTrelloLists(boardId)
          if (listRes.success && listRes.lists) {
            const findList = (kw: string[]) =>
              listRes.lists.find((l: { id: string; name: string }) => kw.some(k => l.name.toLowerCase().includes(k)))

            const mapping = {
              discovery: findList(['discovery'])?.id || '',
              backlog: findList(['backlog'])?.id || '',
              despriorizado: findList(['despriorizado'])?.id || '',
              prioritized: findList(['prioritized'])?.id || '',
              todo: findList(['to do', 'a fazer'])?.id || '',
              doing: findList(['doing', 'fazendo', 'in progress', 'desenvolvimento'])?.id || '',
              done: findList(['done', 'concluído', 'finalizado', 'entregue', 'ready for prod', 'concluido', 'pronto'])?.id || '',
              bugs: findList(['bug', 'erro', 'bugs'])?.id || ''
            }

            const fetchSet = async (id: string, setter: (c: TrelloCard[]) => void): Promise<TrelloCard[]> => {
              if (!id) { setter([]); return [] }
              const res = await (window as unknown as WindowWithPipeline).api.pipeline.getTrelloCards(id)
              if (res.success) { setter(res.cards); return res.cards }
              return []
            }

            const [disc, back, desp, prio, todo, doing, done, bugs] = await Promise.all([
              fetchSet(mapping.discovery, setDiscoveryCards),
              fetchSet(mapping.backlog, setBacklogCards),
              fetchSet(mapping.despriorizado, setDespriorizadoCards),
              fetchSet(mapping.prioritized, setPrioritizedCards),
              fetchSet(mapping.todo, setTodoCards),
              fetchSet(mapping.doing, setDoingCards),
              fetchSet(mapping.done, setDoneCards),
              fetchSet(mapping.bugs, setBugsCards)
            ])

            DashboardCache.set(`trello_cards_${boardId}`,
              { discovery: disc, backlog: back, despriorizado: desp,
                prioritized: prio, todo, doing, done, bugs },
              CACHE_TTL.TRELLO_CARDS)

            const trendRes = await (window as unknown as WindowWithPipeline).api.analytics.getTrend(boardId)
            if (trendRes.success) {
              setTrendStats(trendRes.oldStats)
              DashboardCache.set(`trend_${boardId}`, trendRes.oldStats, CACHE_TTL.TREND_STATS)
            }
          }
        }
      }
    } catch (err: unknown) {
      onAddToast(
        `Erro ao carregar dashboard: ${err instanceof Error ? err.message : String(err)}`,
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Recarrega git stats ao mudar período (se já carregado)
  useEffect(() => {
    if (boards.length > 0) loadGitStats(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const handleBoardChange = (newBoardId: string): void => {
    setSelectedBoard(newBoardId)
    loadAllData(newBoardId, false)
  }

  return {
    boards, selectedBoard, isLoading, gitStats, timeRange, setTimeRange,
    trendStats, stats, allCards,
    discoveryCards, backlogCards, despriorizadoCards, prioritizedCards,
    todoCards, doingCards, doneCards, bugsCards,
    loadAllData, handleBoardChange
  }
}
