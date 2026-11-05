import { useState, useEffect, useCallback } from 'react';
import { THEMES } from '../config/themes';

export const useSettings = (addToast: (msg: string, type: any) => void) => {
  const [settings, setSettings] = useState<any>({});
  const [currentThemeId, setCurrentThemeId] = useState('wilkor-elite');
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'ai' | 'themes' | 'mcp' | 'advanced' | 'services'>('general');

  useEffect(() => {
    const loadSettings = async () => {
      if (window.api?.settings) {
        const s = await window.api.settings.get();
        setSettings(s || {});
        if (s?.theme) setCurrentThemeId(s.theme);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = useCallback(async (newSettings: any) => {
    if (window.api?.settings) {
      await window.api.settings.save(newSettings);
      setSettings(newSettings);
      addToast('Configurações salvas.', 'success');
    }
  }, [addToast]);

  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssKey = `--${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`;
      root.style.setProperty(cssKey, value);
    });
    root.setAttribute('data-theme', theme.id);
    root.classList.toggle('light', theme.type === 'light');
  }, [currentThemeId]);

  return {
    settings,
    setSettings,
    currentThemeId,
    setCurrentThemeId,
    activeSettingsTab,
    setActiveSettingsTab,
    saveSettings
  };
};
