import React from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, GitCommit, ShieldAlert, ClipboardList, Terminal, BarChart3 } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Theme } from '../config/themes';
import { DashboardStats, getAvatarColor, formatName } from './DashboardUtils';

interface AnalyticsViewProps {
  stats: DashboardStats;
  doneCardsCount: number;
  bugsCardsCount: number;
  trelloRankingData: any;
  gitRankingData: any;
  pipelineChartData: any;
  chartOptions: any;
  theme: Theme;
}

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  stats, doneCardsCount, bugsCardsCount, trelloRankingData, gitRankingData, pipelineChartData, chartOptions, theme 
}) => {
  return (
    <motion.div 
      key="analytics"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="px-8 py-6 space-y-6 max-w-[1600px] mx-auto h-full overflow-y-auto custom-scrollbar flex flex-col"
    >
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-4 gap-4 flex-none">
          <KPIBlock 
            label="Board Health" 
            value={`${stats.progressPercent}%`} 
            trend={stats.progressDelta ? `${Number(stats.progressDelta) >= 0 ? '+' : ''}${stats.progressDelta}% vs last week` : "Calculating trend..."} 
            icon={Activity} 
            theme={theme}
            explanation="Overall completion progress"
            accentColor="#10b981"
          />
          <KPIBlock 
            label="Tasks Completed" 
            value={doneCardsCount.toString()} 
            trend="Active Cycle" 
            icon={CheckCircle} 
            theme={theme}
            explanation="Total items in 'Done' columns"
            accentColor="#1a73e8"
          />
          <KPIBlock 
            label="Total Commits" 
            value={stats.totalCommits.toString()} 
            trend={stats.commitDelta ? `${Number(stats.commitDelta) >= 0 ? '+' : ''}${stats.commitDelta} integrations` : "Syncing pulse..."} 
            icon={GitCommit} 
            theme={theme}
            explanation="Commits across all branches"
            accentColor="#6366f1"
          />
          <KPIBlock 
            label="Active Defects" 
            value={bugsCardsCount.toString()} 
            trend="Priority 1" 
            icon={ShieldAlert} 
            theme={theme}
            explanation="Unresolved bug reports"
            accentColor="#f59e0b"
          />
      </div>

      {/* Row 2: SaaS Grid Layout */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 pb-6">
          
          {/* Main Dashboard Area (9/12) */}
          <div className="col-span-9 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 h-[320px]">
                  <ChartContainer title="Task Distribution" icon={ClipboardList} theme={theme} subtitle="Total workload by team member">
                      <div className="h-[220px] w-full mt-2">
                          <Bar 
                              data={{
                                  ...trelloRankingData,
                                  datasets: trelloRankingData.datasets.map((ds: any) => {
                                      const isDone = ds.label === 'Done';
                                      return {
                                          ...ds,
                                          backgroundColor: isDone ? '#1a73e8' : (theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : '#e8eaed'),
                                          borderColor: 'transparent',
                                          borderWidth: 0,
                                          borderRadius: 4,
                                          barPercentage: 0.6,
                                          categoryPercentage: 0.7,
                                      };
                                  })
                              }} 
                              plugins={[{
                                id: 'percentageLabel',
                                afterDatasetsDraw(chart) {
                                  const { ctx, data } = chart;
                                  ctx.save();
                                  const doneDataset = data.datasets.find(ds => ds.label === 'Done');
                                  const assignedDataset = data.datasets.find(ds => ds.label === 'Assigned');
                                  if (doneDataset && assignedDataset && doneDataset.data && assignedDataset.data) {
                                    const meta = chart.getDatasetMeta(chart.data.datasets.indexOf(doneDataset));
                                    doneDataset.data.forEach((value: any, i: number) => {
                                      const total = assignedDataset.data[i] as number;
                                      const percentage = total > 0 ? Math.round(((value as number) / total) * 100) : 0;
                                      const bar = meta.data[i];
                                      if (bar) {
                                        ctx.font = 'bold 10px Inter, sans-serif';
                                        ctx.fillStyle = theme.colors.textMain;
                                        ctx.textAlign = 'left';
                                        ctx.textBaseline = 'middle';
                                        // @ts-ignore
                                        ctx.fillText(`${percentage}%`, bar.x + 8, bar.y);
                                      }
                                    });
                                  }
                                  ctx.restore();
                                }
                              }]}
                              options={{
                                ...chartOptions,
                                indexAxis: 'y',
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: 'bottom',
                                    labels: { boxWidth: 10, usePointStyle: true, color: theme.colors.textMuted, font: { size: 10, weight: '500' } }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: (context: any) => {
                                        const label = context.dataset.label || '';
                                        const value = context.parsed.x || 0;
                                        if (label === 'Done') {
                                          const assignedValue = context.chart.data.datasets[0].data[context.dataIndex];
                                          const pct = assignedValue > 0 ? Math.round((value / assignedValue) * 100) : 0;
                                          return `${label}: ${value} (${pct}%)`;
                                        }
                                        return `${label}: ${value}`;
                                      }
                                    }
                                  }
                                },
                                scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: theme.colors.textMain, font: { size: 11, weight: 'bold' } } } }
                              }} 
                          />
                      </div>
                  </ChartContainer>

                  <ChartContainer title="Development Activity" icon={Terminal} theme={theme} subtitle="Commit frequency distribution">
                      <div className="h-[220px] w-full mt-2">
                          <Bar 
                              data={{
                                  ...gitRankingData,
                                  datasets: [{
                                      ...gitRankingData.datasets[0],
                                      backgroundColor: '#6366f1',
                                      borderColor: 'transparent',
                                      borderWidth: 0,
                                      borderRadius: 4,
                                      barPercentage: 0.5,
                                  }]
                              }} 
                              options={{
                                ...chartOptions,
                                indexAxis: 'y',
                                scales: { x: { display: false }, y: { grid: { display: false }, ticks: { color: theme.colors.textMain, font: { size: 11, weight: 'bold' } } } }
                              }} 
                          />
                      </div>
                  </ChartContainer>
              </div>

              <ChartContainer title="Workflow Pipeline" icon={BarChart3} theme={theme} subtitle="Current state of all project items">
                  <div className="h-[260px] w-full mt-2 flex flex-col items-center justify-center relative">
                      {(() => {
                          const data = pipelineChartData.datasets[0].data;
                          const todo = data[2] || 0;
                          const doing = data[3] || 0;
                          const done = data[4] || 0;
                          const bugs = data[5] || 0;
                          const totalActive = todo + doing + done + bugs;
                          const score = totalActive > 0 ? Math.round(((done * 100) + (doing * 50)) / totalActive) : 0;
                          
                          let statusLabel = "Neutral";
                          let statusColor = theme.colors.textMuted;
                          
                          if (score >= 85) { statusLabel = "Excellent"; statusColor = "#10b981"; }
                          else if (score >= 60) { statusLabel = "Good"; statusColor = "#3b82f6"; }
                          else if (score >= 30) { statusLabel = "Warning"; statusColor = "#eab308"; }
                          else if (totalActive > 0) { statusLabel = "Critical"; statusColor = "#f43f5e"; }

                          return (
                              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
                                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mb-[-4px]" style={{ color: theme.colors.textMuted }}>Score</span>
                                  <span className="text-5xl font-black tracking-tight" style={{ color: statusColor }}>
                                    {score}
                                  </span>
                                  <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                                    {statusLabel}
                                  </span>
                              </div>
                          );
                      })()}
                      <div className="w-full h-full">
                        <Doughnut 
                            data={{
                                ...pipelineChartData,
                                datasets: [{
                                    ...pipelineChartData.datasets[0],
                                    backgroundColor: [
                                      '#10b981', // Discovery
                                      '#3b82f6', // Backlog
                                      '#84cc16', // Todo
                                      '#eab308', // Doing
                                      '#f43f5e', // Done
                                      '#06b6d4', // Bugs
                                    ],
                                    borderWidth: 0,
                                    borderRadius: 10,
                                    spacing: 4,
                                    cutout: '76%',
                                    hoverOffset: 20
                                }]
                            }} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                layout: {
                                  padding: {
                                    top: 10,
                                    bottom: 10,
                                    left: 20,
                                    right: 20
                                  }
                                },
                                plugins: { 
                                    legend: { 
                                        display: true, 
                                        position: 'bottom',
                                        labels: {
                                            padding: 20,
                                            boxWidth: 6,
                                            boxHeight: 6,
                                            usePointStyle: true,
                                            pointStyle: 'circle',
                                            color: theme.colors.textMuted,
                                            font: { size: 10, weight: 600 }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: theme.colors.bgPanel,
                                        titleColor: theme.colors.textMain,
                                        bodyColor: theme.colors.textMuted,
                                        borderColor: theme.colors.borderColor,
                                        borderWidth: 1,
                                        padding: 12,
                                        cornerRadius: 12,
                                        displayColors: true,
                                        usePointStyle: true,
                                        callbacks: {
                                            label: (context: any) => ` ${context.label}: ${context.parsed} cards`
                                        }
                                    }
                                }
                            }} 
                        />
                      </div>
                  </div>
              </ChartContainer>
          </div>

          {/* Sidebar Area (3/12) */}
          <div className="col-span-3 flex flex-col gap-4">
              <ChartContainer title="Top Performers" icon={Activity} theme={theme}>
                  <div className="mt-4 space-y-2">
                      {stats.topTrello.slice(0, 5).map((member, i) => (
                          <motion.div 
                            key={i} 
                            variants={itemVariants}
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: getAvatarColor(member.name) }}>
                                  {member.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: theme.colors.textMain }}>{member.name}</p>
                                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                    {member.done} cards completed
                                    {member.doneDelta !== undefined && member.doneDelta !== 0 && (
                                      <span className={`ml-1.5 font-bold ${member.doneDelta > 0 ? 'text-green-500' : 'text-red-400'}`}>
                                        {member.doneDelta > 0 ? `+${member.doneDelta}` : member.doneDelta}
                                      </span>
                                    )}
                                  </p>
                              </div>
                              <div className="text-right">
                                  <p className="text-xs font-bold" style={{ color: theme.colors.primary }}>{Math.round((member.done / (member.total || 1)) * 100)}%</p>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              </ChartContainer>

              <ChartContainer title="Live Feed" icon={Activity} theme={theme}>
                  <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar max-h-[300px]">
                      {stats.topGit.slice(0, 8).map((act, i) => (
                          <motion.div 
                            key={i} 
                            variants={itemVariants}
                            className="flex gap-3 items-start"
                          >
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-none" />
                              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                                <span className="font-bold" style={{ color: theme.colors.textMain }}>{formatName(act.name)}</span> pushed {act.count} commits
                              </p>
                          </motion.div>
                      ))}
                  </div>
              </ChartContainer>
          </div>
      </div>
    </motion.div>
  );
};

const KPIBlock: React.FC<{ label: string, value: string, trend: string, icon: any, theme: Theme, explanation: string, accentColor?: string }> = ({ label, value, trend, icon: Icon, theme, explanation, accentColor }) => {
    return (
        <motion.div 
             variants={itemVariants}
             className="p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md" 
             style={{ 
               backgroundColor: theme.colors.bgPanel, 
               borderColor: theme.colors.borderColor 
             }}>
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${accentColor}10`, color: accentColor }}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.colors.textMuted }}>{label}</span>
            </div>
            <div className="space-y-0.5">
                <p className="text-2xl font-bold tracking-tight" style={{ color: theme.colors.textMain }}>{value}</p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-600">{trend}</span>
                    <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>• {explanation}</span>
                </div>
            </div>
        </motion.div>
    );
};

const ChartContainer: React.FC<{ title: string, icon: any, subtitle?: string, children: React.ReactNode, theme: Theme }> = ({ title, icon: Icon, subtitle, children, theme }) => (
    <motion.div 
         variants={itemVariants}
         className="border shadow-sm flex flex-col overflow-hidden rounded-2xl p-4" 
         style={{ 
           backgroundColor: theme.colors.bgPanel, 
           borderColor: theme.colors.borderColor 
         }}>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.bgApp }}>
                <Icon size={18} style={{ color: theme.colors.textMuted }} />
            </div>
            <div>
                <h3 className="text-sm font-bold leading-tight" style={{ color: theme.colors.textMain }}>{title}</h3>
                {subtitle && <p className="text-[10px] font-medium" style={{ color: theme.colors.textMuted }}>{subtitle}</p>}
            </div>
        </div>
        <div className="flex-1 relative">{children}</div>
    </motion.div>
);
