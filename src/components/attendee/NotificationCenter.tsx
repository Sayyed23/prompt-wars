'use client';

import React, { useState, useEffect } from 'react';
import { NotificationPreferences } from '../../types/alerts';
import { useEventSource } from '../../hooks/useEventSource';
import { Shield, Bell, Settings, History, AlertTriangle } from 'lucide-react';

interface NotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'congestion' | 'announcement' | 'wait_time';
}

/**
 * NotificationCenter Component (Task 15.7)
 * Handles attendee notification preferences, history, and rate-limiting visualization.
 */
export const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'preferences'>('history');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    congestions: true,
    announcements: true,
    waitTimes: true,
  });
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [quota, setQuota] = useState(3);

  // Load state from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));

    const savedHistory = localStorage.getItem('notification_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save preferences
  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  // Subscribe to density updates to generate local notifications
  const { data: densityData } = useEventSource('/api/realtime/density');

  useEffect(() => {
    if (!densityData || !preferences.congestions) return;

    // Logic to detect congestion and trigger notification
    const parsed = typeof densityData === 'string' ? JSON.parse(densityData) : densityData;
    const zones = parsed?.zones || [];
    const congestedZone = zones.find((z: any) => z.densityLevel === 'high' || z.densityLevel === 'critical');

    if (congestedZone && quota > 0) {
      const newId = `notif-${Date.now()}`;
      if (history.some(h => h.message.includes(congestedZone.name) && Date.now() - parseInt(h.id.split('-')[1]) < 60000)) return;

      const newNotif: NotificationHistoryItem = {
        id: newId,
        title: 'High Density Alert',
        message: `${congestedZone.name} is currently seeing high attendance. Consider alternative routes.`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'congestion',
      };

      const updatedHistory = [newNotif, ...history.slice(0, 19)];
      setHistory(updatedHistory);
      setQuota(prev => prev - 1);
      localStorage.setItem('notification_history', JSON.stringify(updatedHistory));

      // Trigger browser notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotif.title, { body: newNotif.message });
      }
    }
  }, [densityData, preferences.congestions, quota, history]);

  return (
    <div className="bg-[#0A0C10] border border-[#1A1D23] rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-auto h-[600px] flex flex-col font-mono text-xs">
      {/* Header */}
      <div className="bg-[#11141B] p-4 border-b border-[#1A1D23] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00F5FF]" />
          <span className="text-[#00F5FF] uppercase tracking-widest font-bold">Terminal / Notifications</span>
        </div>
        <div className="flex bg-[#1A1D23] rounded-md p-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded transition-colors ${activeTab === 'history' ? 'bg-[#00F5FF] text-black' : 'text-[#8E929B]'}`}
          >
            HISTORY
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-3 py-1 rounded transition-colors ${activeTab === 'preferences' ? 'bg-[#00F5FF] text-black' : 'text-[#8E929B]'}`}
          >
            CONFIG
          </button>
        </div>
      </div>

      {/* Quota Bar */}
      <div className="bg-[#11141B] px-4 py-2 border-b border-[#1A1D23] flex items-center justify-between">
        <span className="text-[#8E929B]">BURST QUOTA:</span>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-2 rounded-sm ${i <= quota ? 'bg-[#FF7A00]' : 'bg-[#1A1D23]'}`}
              title={i <= quota ? 'Available' : 'Charging...'}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'history' ? (
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#3F444E] py-20">
                <History className="w-12 h-12 mb-4 opacity-10" />
                <p>NO DATA LOGGED IN CURRENT SESSION</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="border-l-2 border-[#FF7A00] bg-[#11141B] p-3 rounded-r-lg group hover:bg-[#1A1D23] transition-all">
                  <div className="flex justify-between items-start mb-1 text-[10px]">
                    <span className="text-[#FF7A00] font-bold uppercase tracking-tighter">{item.type}</span>
                    <span className="text-[#3F444E]">{item.timestamp}</span>
                  </div>
                  <h3 className="text-white font-bold mb-1">{item.title}</h3>
                  <p className="text-[#8E929B] leading-relaxed italic line-clamp-2">"{item.message}"</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-[#11141B] rounded-lg border border-[#1A1D23]">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-[#00F5FF]" />
                <h3 className="text-white font-bold text-sm">ALERT SUBSCRIPTIONS</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { key: 'congestions', label: 'CROWD DENSITY SPIKES', desc: 'Notify when zone capacity > 80%' },
                  { key: 'announcements', label: 'SYSTEM ANNOUNCEMENTS', desc: 'Emergency and operational updates' },
                  { key: 'waitTimes', label: 'QUEUE FLUCTUATIONS', desc: 'Notify when wait times drop > 15m' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between group">
                    <div>
                      <div className="text-white font-medium">{pref.label}</div>
                      <div className="text-[#3F444E] text-[10px]">{pref.desc}</div>
                    </div>
                    <button
                      onClick={() => togglePreference(pref.key as keyof NotificationPreferences)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${preferences[pref.key as keyof NotificationPreferences] ? 'bg-[#00F5FF]' : 'bg-[#1A1D23]'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-black transition-all ${preferences[pref.key as keyof NotificationPreferences] ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#11141B] rounded-lg border border-[#1A1D23] opacity-50">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-[#3F444E]" />
                <h3 className="text-[#8E929B] font-bold text-sm">SECURITY CONTEXT</h3>
              </div>
              <p className="text-[#3F444E] text-[10px]">
                Your device ID is anonymized. No PII is stored. History is wiped after 24h of inactivity.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="bg-[#11141B] p-2 border-t border-[#1A1D23] flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[#3F444E]">SECURE_LINK_ON</span>
        </div>
        <span className="text-[#3F444E]">v1.4.2-CF</span>
      </div>
    </div>
  );
};
