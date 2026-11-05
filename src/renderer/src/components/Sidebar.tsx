import React from 'react'
import { motion } from 'framer-motion'
import {
  Folder,
  GitBranch,
  Puzzle,
  Wand2,
  Layout,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Archive,
  Users2,
  Shield,
  LucideIcon,
  BrainCircuit
} from 'lucide-react'
import wosLogo from './wos_logo.png'

export interface SidebarUser {
  id: string
  name?: string
  username?: string
  email?: string
  phoneNumber?: string
  profilePicture?: string
  crm?: string
  uf?: string
}

interface SidebarProps {
  user: SidebarUser | null
  activeSidebarTab: string
  setActiveSidebarTab: (tab: 'explorer' | 'git' | 'mcp' | 'artifacts' | 'planning') => void
  isExplorerOpen: boolean
  setIsExplorerOpen: (open: boolean) => void
  isPipelineOpen: boolean
  setIsPipelineOpen: (open: boolean) => void
  isProjectDashboardOpen: boolean
  setIsProjectDashboardOpen: (open: boolean) => void
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
  isAgentStudioOpen: boolean
  setIsAgentStudioOpen: (open: boolean) => void
  logout: () => void
  allowedTabs: string[]
  isMaster: boolean
  isAdminOpen: boolean
  setIsAdminOpen: (open: boolean) => void
  isWosManagerOpen: boolean
  setIsWosManagerOpen: (open: boolean) => void
}

const SidebarIcon: React.FC<{
  icon: LucideIcon
  active: boolean
  onClick: () => void
  label: string
  className?: string
}> = ({ icon: Icon, active, onClick, label, className }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-3 rounded-xl transition-all relative group ${
      active
        ? 'bg-primary/10 text-primary shadow-inner shadow-primary/5'
        : 'text-text-muted hover:bg-bg-panel hover:text-text-main'
    } ${className}`}
  >
    <Icon size={20} />
    {active && (
      <motion.div
        layoutId="active-indicator"
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
      />
    )}
    <span className="absolute left-full ml-4 px-2 py-1 bg-black text-[8px] font-black uppercase tracking-widest text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[9999] pointer-events-none">
      {label}
    </span>
  </button>
)

const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeSidebarTab,
  setActiveSidebarTab,
  isExplorerOpen,
  setIsExplorerOpen,
  isPipelineOpen,
  setIsPipelineOpen,
  isProjectDashboardOpen,
  setIsProjectDashboardOpen,
  isChatOpen,
  setIsChatOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isAgentStudioOpen,
  setIsAgentStudioOpen,
  logout,
  allowedTabs,
  isMaster,
  isAdminOpen,
  setIsAdminOpen,
  isWosManagerOpen,
  setIsWosManagerOpen
}) => {
  return (
    <aside className="w-16 bg-bg-sidebar flex flex-col items-center py-6 gap-6 z-30 shrink-0">
      <div className="flex flex-col items-center w-full">
        <div className="w-12 h-12 rounded-xl bg-transparent overflow-hidden flex items-center justify-center cursor-pointer mb-4 group">
          <img
            src={wosLogo}
            alt={user ? `${user.username || 'Wilkor'}'s wOs` : 'wOs Logo'}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="w-8 h-[1px] bg-white/10" />
      </div>

      {(isMaster || allowedTabs.includes('explorer')) && (
        <SidebarIcon
          icon={Folder}
          active={isExplorerOpen && activeSidebarTab === 'explorer'}
          onClick={() => {
            if (activeSidebarTab === 'explorer') setIsExplorerOpen(!isExplorerOpen)
            else {
              setActiveSidebarTab('explorer')
              setIsExplorerOpen(true)
            }
          }}
          label="Arquivos"
        />
      )}

      <div className="flex flex-col gap-2">
        {(isMaster || allowedTabs.includes('git')) && (
          <SidebarIcon
            icon={GitBranch}
            active={isExplorerOpen && activeSidebarTab === 'git'}
            onClick={() => {
              setActiveSidebarTab('git')
              setIsExplorerOpen(true)
            }}
            label="Git"
          />
        )}
        {(isMaster || allowedTabs.includes('mcp')) && (
          <SidebarIcon
            icon={Puzzle}
            active={isExplorerOpen && activeSidebarTab === 'mcp'}
            onClick={() => {
              setActiveSidebarTab('mcp')
              setIsExplorerOpen(true)
            }}
            label="MCP"
          />
        )}
        {(isMaster || allowedTabs.includes('artifacts')) && (
          <SidebarIcon
            icon={Archive}
            active={isExplorerOpen && activeSidebarTab === 'artifacts'}
            onClick={() => {
              setActiveSidebarTab('artifacts')
              setIsExplorerOpen(true)
            }}
            label="Artefatos"
          />
        )}
        {(isMaster || allowedTabs.includes('pipeline')) && (
          <SidebarIcon
            icon={Wand2}
            active={isPipelineOpen}
            onClick={() => setIsPipelineOpen(true)}
            label="Pipeline"
          />
        )}
        {(isMaster || allowedTabs.includes('dashboard')) && (
          <SidebarIcon
            icon={Layout}
            active={isProjectDashboardOpen}
            onClick={() => setIsProjectDashboardOpen(true)}
            label="Dashboard"
          />
        )}
        {(isMaster || allowedTabs.includes('agent_studio')) && (
          <SidebarIcon
            icon={Users2}
            active={isAgentStudioOpen}
            onClick={() => setIsAgentStudioOpen(true)}
            label="Agent Studio"
          />
        )}
      </div>

      {(isMaster || allowedTabs.includes('chat')) && (
        <SidebarIcon
          icon={MessageSquare}
          active={isChatOpen}
          onClick={() => setIsChatOpen(!isChatOpen)}
          label="Chat AI"
        />
      )}

      <div className="mt-auto flex flex-col gap-6 items-center">
        {isMaster && (
          <SidebarIcon
            icon={Shield}
            active={isAdminOpen}
            onClick={() => setIsAdminOpen(true)}
            label="Painel Admin"
            className="text-amber-500/70 hover:text-amber-500 hover:bg-amber-500/10"
          />
        )}
        <SidebarIcon
          icon={BrainCircuit}
          active={isWosManagerOpen}
          onClick={() => setIsWosManagerOpen(true)}
          label="Gerenciar WOS"
          className="text-purple-500/70 hover:text-purple-500 hover:bg-purple-500/10"
        />
        <SidebarIcon
          icon={SettingsIcon}
          active={isSettingsOpen}
          onClick={() => setIsSettingsOpen(true)}
          label="Configurações"
        />
        <SidebarIcon
          icon={LogOut}
          active={false}
          onClick={logout}
          label="Sair do Sistema"
          className="text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
        />
      </div>
    </aside>
  )
}

export default Sidebar
