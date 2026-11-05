export const formatName = (name: string): string => {
  if (!name) return 'Unknown'
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getAvatarColor = (name: string): string => {
  const colors = [
    '#6366f1',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#a855f7',
    '#ec4899',
    '#06b6d4',
    '#fb7185',
    '#34d399',
    '#f87171',
    '#818cf8'
  ]
  let hash = 0
  for (let i = 0; i < (name?.length || 0); i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash || 0) % colors.length]
}

export const getChartPalette = (): string[] => [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#fb7185',
  '#34d399',
  '#f87171',
  '#818cf8'
]

export interface TrelloCard {
  id: string
  name: string
  desc: string
  url: string
  shortUrl: string
  labels: { id: string; name: string; color: string }[]
  due: string | null
  members?: { id: string; fullName: string; username: string; avatarUrl: string }[]
}

export interface TrelloRankingMember {
  name: string
  avatar?: string
  done: number
  inProgress: number
  bugs: number
  total: number
  commits: number
  doneDelta?: number
  commitDelta?: number
}

export interface GitRankingMember {
  name: string
  count: number
}

export interface DashboardStats {
  topTrello: TrelloRankingMember[]
  topGit: GitRankingMember[]
  totalCards: number
  progressPercent: number
  bugRatio: string
  totalCommits: number
  progressDelta?: string
  commitDelta?: string
}

import { Theme } from '../config/themes'

export interface ProjectDashboardProps {
  onAddToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void
  onClose: () => void
  onOpenFile?: (path: string, focus?: boolean, forceReload?: boolean) => void | Promise<void>
  theme: Theme
  onStartSpecification?: (card: TrelloCard, pendingTask?: any) => void
}

export interface TrendTeamMember {
  name: string
  done?: number
  commits?: number
}

export interface TrendStats {
  progressPercent: number
  totalCommits: number
  teamStats?: TrendTeamMember[]
}

export function calculateDashboardStats(
  allCards: TrelloCard[],
  doneCards: TrelloCard[],
  doingCards: TrelloCard[],
  bugsCards: TrelloCard[],
  gitStats: Record<string, number>,
  trendStats: TrendStats | null
): DashboardStats {
  const memberData: Record<
    string,
    {
      name: string
      avatar?: string
      done: number
      inProgress: number
      bugs: number
      total: number
      commits: number
    }
  > = {}

  allCards.forEach((card) => {
    card.members?.forEach((m) => {
      if (!memberData[m.id]) {
        memberData[m.id] = {
          name: m.fullName,
          avatar: m.avatarUrl,
          done: 0,
          inProgress: 0,
          bugs: 0,
          total: 0,
          commits: 0
        }
      }
      memberData[m.id].total++
      if (doneCards.some((c) => c.id === card.id)) memberData[m.id].done++
      else if (doingCards.some((c) => c.id === card.id)) memberData[m.id].inProgress++
      else if (bugsCards.some((c) => c.id === card.id)) memberData[m.id].bugs++
    })
  })

  Object.values(memberData).forEach((member) => {
    const gitName = member.name.toLowerCase().trim()
    const firstName = gitName.split(' ')[0]
    Object.entries(gitStats).forEach(([author, count]) => {
      const authorLower = author.toLowerCase().trim()
      const authorFirst = authorLower.split(' ')[0]
      if (
        gitName === authorLower ||
        gitName.includes(authorLower) ||
        authorLower.includes(gitName) ||
        (firstName.length > 2 && firstName === authorFirst)
      ) {
        member.commits += count
      }
    })
  })

  // Consolidar Git Stats (Murilo, Nakero, etc)
  const consolidatedGit: Record<string, number> = {}
  Object.entries(gitStats).forEach(([name, count]) => {
    const lower = name.toLowerCase().trim()
    let key = lower

    // Heurística de Consolidação
    if (lower.includes('murilo') || lower.includes('nakero')) key = 'murilo'
    else if (lower.includes('wilkor')) key = 'wilkor'
    else if (lower.includes('lucas')) key = 'lucas'
    else if (lower.includes('felipe')) key = 'felipe'
    else if (lower.includes('layzan')) key = 'layzan'
    else if (lower.includes('alexandre')) key = 'alexandre'

    consolidatedGit[key] = (consolidatedGit[key] || 0) + count
  })

  return {
    topTrello: Object.values(memberData)
      .map((m) => {
        const past = trendStats?.teamStats?.find((p: TrendTeamMember) => p.name === m.name)
        return {
          ...m,
          doneDelta: past ? m.done - (past.done || 0) : undefined,
          commitDelta: past ? m.commits - (past.commits || 0) : undefined
        }
      })
      .sort((a, b) => b.done - a.done || b.done / (b.total || 1) - a.done / (a.total || 1)),
    topGit: Object.entries(consolidatedGit)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    totalCards: allCards.length,
    progressPercent:
      allCards.length > 0 ? Math.round((doneCards.length / allCards.length) * 100) : 0,
    bugRatio: allCards.length > 0 ? ((bugsCards.length / allCards.length) * 100).toFixed(1) : '0',
    totalCommits: Object.values(gitStats).reduce((a, b) => a + b, 0),
    progressDelta: trendStats
      ? (
          Math.round((doneCards.length / allCards.length) * 100) - trendStats.progressPercent
        ).toString()
      : undefined,
    commitDelta: trendStats
      ? (Object.values(gitStats).reduce((a, b) => a + b, 0) - trendStats.totalCommits).toString()
      : undefined
  }
}
