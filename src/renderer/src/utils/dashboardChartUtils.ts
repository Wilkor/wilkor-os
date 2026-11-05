import { formatName } from '../components/DashboardUtils';

export const getTrelloRankingData = (stats: any) => ({
  labels: stats.topTrello.slice(0, 8).map((m: any) => formatName(m.name.split(' ')[0])),
  datasets: [
    { 
      label: 'Assigned', 
      data: stats.topTrello.slice(0, 8).map((m: any) => m.total), 
      backgroundColor: 'rgba(148, 163, 184, 0.4)', 
      borderColor: '#94a3b8', 
      borderWidth: 1.5, 
      borderRadius: 4, 
      barThickness: 10 
    },
    { 
      label: 'Done', 
      data: stats.topTrello.slice(0, 8).map((m: any) => m.done), 
      backgroundColor: 'rgba(16, 185, 129, 0.7)', 
      borderColor: '#10b981', 
      borderWidth: 2, 
      borderRadius: 4, 
      barThickness: 10 
    }
  ]
});

export const getGitRankingData = (stats: any) => ({
  labels: stats.topGit.slice(0, 8).map((m: any) => formatName(m.name)),
  datasets: [{ label: 'Commits', data: stats.topGit.slice(0, 8).map((m: any) => m.count), backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7', borderWidth: 2, borderRadius: 12, barThickness: 24 }]
});

export const getPipelineChartData = (
  discoveryCards: any[],
  backlogCards: any[],
  todoCards: any[],
  doingCards: any[],
  doneCards: any[],
  bugsCards: any[]
) => ({
  labels: ['Discovery', 'Backlog', 'Todo', 'Doing', 'Done', 'Bugs'],
  datasets: [{ label: 'Volume', data: [discoveryCards.length, backlogCards.length, todoCards.length, doingCards.length, doneCards.length, bugsCards.length], backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: '#6366f1', borderWidth: 2, fill: true, tension: 0.4 }]
});
