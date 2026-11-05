import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/api';

interface User {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  crm?: string;
  uf?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isApproved: boolean;
  allowedTabs: string[];
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('wOs_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [allowedTabs, setAllowedTabs] = useState<string[]>([]);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissions = async () => {
    if (localStorage.getItem('wOs_accessToken') && window.api?.auth?.getPermissions) {
      const res = await window.api.auth.getPermissions();
      if (res?.success && res.permissions) {
        setIsApproved(res.permissions.isApproved);
        setAllowedTabs(res.permissions.allowedTabs || []);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('wOs_accessToken');
      if (token) {
        try {
          const res = await authService.validateToken();
          if (res.status === 200) {
            const userData = res.data.user || res.data;
            
            // Recupera os dados salvos localmente no login (que contêm o email digitado e o id correto)
            const savedUserStr = localStorage.getItem('wOs_user');
            const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
            
            const masterId = '69fbc369036a60001cddd998';
            const masterEmail = 'wilkor.almeida@gmail.com';
            const userId = userData.id || userData._id || (savedUser ? savedUser.id : '');
            
            // Mescla os dados da validação com os dados locais salvos com fallbacks para o master
            const mergedUserData = {
              ...userData,
              id: userId,
              email: userData.email || (savedUser ? savedUser.email : '') || (userId === masterId ? masterEmail : ''),
              phoneNumber: userData.phoneNumber || (savedUser ? savedUser.phoneNumber : ''),
              profilePicture: userData.profilePicture || (savedUser ? savedUser.profilePicture : '')
            };

            setUser(mergedUserData);
            localStorage.setItem('wOs_user', JSON.stringify(mergedUserData));
            
            // Sincroniza usuário com Electron backend
            if (window.api?.auth?.setUser) {
              const authRes = await window.api.auth.setUser(mergedUserData);
              if (authRes?.success && authRes.permissions) {
                setIsApproved(authRes.permissions.isApproved);
                setAllowedTabs(authRes.permissions.allowedTabs || []);
              }
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('wOs_accessToken', accessToken);
    localStorage.setItem('wOs_refreshToken', refreshToken);
    localStorage.setItem('wOs_user', JSON.stringify(userData));
    localStorage.setItem('wOs_lastUser', JSON.stringify(userData));
    setUser(userData);
    
    // Sincroniza usuário com Electron backend e busca permissões
    if (window.api?.auth?.setUser) {
      const authRes = await window.api.auth.setUser(userData);
      if (authRes?.success && authRes.permissions) {
        setIsApproved(authRes.permissions.isApproved);
        setAllowedTabs(authRes.permissions.allowedTabs || []);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('wOs_accessToken');
    localStorage.removeItem('wOs_refreshToken');
    localStorage.removeItem('wOs_user');
    setUser(null);
    setIsApproved(false);
    setAllowedTabs([]);
    
    // Sincroniza logout com Electron backend
    if (window.api?.auth?.setUser) {
      window.api.auth.setUser(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        isApproved, 
        allowedTabs, 
        login, 
        logout,
        refreshPermissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
