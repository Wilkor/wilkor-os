import { useState, useEffect } from 'react';
import { Shield, X, Check, Save, User } from 'lucide-react';

interface UserPerm {
  userId: string;
  email: string;
  isApproved: boolean;
  allowedTabs: string[];
}

interface AdminPanelProps {
  onClose: () => void;
  onAddToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AVAILABLE_FEATURES = [
  { id: 'explorer', label: 'Arquivos' },
  { id: 'git', label: 'Git' },
  { id: 'mcp', label: 'MCP' },
  { id: 'artifacts', label: 'Artefatos' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'agent_studio', label: 'Agent Studio' },
  { id: 'chat', label: 'Chat AI' },
];

export default function AdminPanel({ onClose, onAddToast }: AdminPanelProps) {
  const [users, setUsers] = useState<UserPerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (window.api?.auth?.adminGetUsers) {
        const res = await window.api.auth.adminGetUsers();
        if (res?.success && res.users) {
          setUsers(res.users);
        } else {
          onAddToast(res?.error || 'Erro ao carregar usuários.', 'error');
        }
      }
    } catch (err: any) {
      onAddToast(err.message || 'Erro ao buscar usuários do MongoDB.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.userId === userId) {
        const nextApproved = !u.isApproved;
        // Se aprovar, podemos dar algumas abas padrão, se reprovar mantemos ou limpamos
        const defaultTabs = nextApproved ? ['explorer', 'chat'] : [];
        return { 
          ...u, 
          isApproved: nextApproved,
          allowedTabs: u.allowedTabs.length === 0 ? defaultTabs : u.allowedTabs
        };
      }
      return u;
    }));
  };

  const handleToggleFeature = (userId: string, featureId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.userId === userId) {
        const hasFeature = u.allowedTabs.includes(featureId);
        const newFeatures = hasFeature 
          ? u.allowedTabs.filter(f => f !== featureId)
          : [...u.allowedTabs, featureId];
        return { ...u, allowedTabs: newFeatures };
      }
      return u;
    }));
  };

  const handleSaveUser = async (user: UserPerm) => {
    setSavingId(user.userId);
    try {
      if (window.api?.auth?.adminSaveUserPermissions) {
        const res = await window.api.auth.adminSaveUserPermissions(user.userId, {
          isApproved: user.isApproved,
          allowedTabs: user.allowedTabs
        });
        if (res?.success) {
          onAddToast(`Permissões de ${user.email} salvas com sucesso!`, 'success');
        } else {
          onAddToast(res?.error || 'Erro ao salvar permissões.', 'error');
        }
      }
    } catch (err: any) {
      onAddToast(err.message || 'Falha ao salvar no banco de dados.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050508] text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">Painel Administrativo</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Controle de Acesso & Permissões</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl w-full mx-auto">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
            <p className="text-xs text-white/40">Carregando usuários cadastrados...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-white/40">Nenhum usuário cadastrado no wOs até o momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {users.map(user => {
              const isMaster = user.email === 'wilkor.almeida@gmail.com' || user.userId === '69fbc369036a60001cddd998';
              return (
                <div 
                  key={user.userId}
                  className="bg-white/[0.01] border border-white/5 hover:border-white/10 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg shadow-black/20"
                >
                  {/* User Profile Info */}
                  <div className="flex items-start gap-4 min-w-[250px]">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/50 shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate max-w-[200px]">{user.email}</span>
                        {isMaster && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-wider">
                            Master
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 font-mono select-all">ID: {user.userId}</span>
                    </div>
                  </div>

                  {/* Approval Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">Status:</span>
                    <button
                      onClick={() => !isMaster && handleToggleApproval(user.userId)}
                      disabled={isMaster}
                      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all duration-300 ${
                        user.isApproved 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                      } ${isMaster ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {user.isApproved ? (
                        <>
                          <Check size={14} />
                          <span>Aprovado</span>
                        </>
                      ) : (
                        <>
                          <X size={14} />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Features Permissions Grid */}
                  <div className="flex-1">
                    <p className="text-[10px] uppercase text-white/30 tracking-wider mb-2">Abas do Sidebar:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AVAILABLE_FEATURES.map(feat => {
                        const isAllowed = user.allowedTabs.includes(feat.id);
                        return (
                          <button
                            key={feat.id}
                            disabled={isMaster || !user.isApproved}
                            onClick={() => handleToggleFeature(user.userId, feat.id)}
                            className={`px-3 py-2 rounded-xl text-left border text-[11px] font-medium transition-all duration-300 ${
                              isAllowed
                                ? 'bg-primary/10 border-primary/20 text-primary font-bold shadow-inner'
                                : 'bg-transparent border-white/5 text-white/40 hover:border-white/10 hover:text-white/60'
                            } ${(isMaster || !user.isApproved) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{feat.label}</span>
                              {isAllowed && <Check size={12} className="text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end shrink-0">
                    <button
                      onClick={() => handleSaveUser(user)}
                      disabled={isMaster || savingId === user.userId}
                      className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all duration-300 shadow-md ${
                        isMaster 
                          ? 'bg-transparent border-white/5 text-white/20 cursor-not-allowed'
                          : 'bg-primary border-primary hover:brightness-110 text-white cursor-pointer active:scale-95'
                      }`}
                    >
                      {savingId === user.userId ? (
                        <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Salvar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
