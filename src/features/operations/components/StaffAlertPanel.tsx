'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertStatus, AlertPriority } from '@/shared/types/alerts';
import { useEventSource } from '@/shared/hooks/useEventSource';
import { CheckCircle2, AlertCircle, Clock, MapPin, Navigation, UserCheck } from 'lucide-react';

/**
 * StaffAlertPanel Component (Task 15.8)
 * Specialized interface for ground staff to manage assigned alerts and coordinate response.
 */
export const StaffAlertPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [staffId] = useState('STAFF_001'); // Mock persistent staff identity

  // Subscribe to real-time alerts
  const { data: alertStream } = useEventSource('/api/realtime/alerts');

  useEffect(() => {
    if (alertStream && typeof alertStream === 'string') {
      try {
        const payload = JSON.parse(alertStream as string);
        if (payload.type === 'alerts:snapshot') {
          setAlerts(payload.alerts);
        } else if (payload.type === 'alerts:new' || payload.type === 'alerts:update') {
          setAlerts(prev => {
            const filtered = prev.filter(a => a.id !== payload.alert.id);
            if (payload.alert.status === AlertStatus.RESOLVED) return filtered;
            return [payload.alert, ...filtered];
          });
        }
      } catch (e) {
        console.error('Error parsing alert stream:', e);
      }
    }
  }, [alertStream]);

  // Handle status update (Requirement 6.4)
  const updateStatus = async (alertId: string, status: AlertStatus) => {
    setIsUpdating(alertId);
    try {
      const res = await fetch(`/api/alerts/${alertId}/status` as string, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, staffIds: [staffId] }),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (e) {
      console.error('Status update error:', e);
    } finally {
      setIsUpdating(null);
    }
  };

  const priorityColors = {
    [AlertPriority.LOW]: 'text-blue-400 border-blue-400/20',
    [AlertPriority.MEDIUM]: 'text-yellow-400 border-yellow-400/20',
    [AlertPriority.HIGH]: 'text-orange-500 border-orange-500/20',
    [AlertPriority.CRITICAL]: 'text-red-500 border-red-500/20',
  };

  const assignedAlerts = alerts.filter(a => a.assignedStaffIds.includes(staffId) || a.status === AlertStatus.UNASSIGNED);

  return (
    <div className="glass-panel quantum-card-glow rounded-xl overflow-hidden shadow-2xl w-full h-full flex flex-col font-sans">
      {/* Header */}
      <div className="bg-stealth-100/50 p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/20">
            <UserCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Ground_Unit_Alpha</h2>
            <p className="text-stealth-400 text-[10px]">ID: {staffId} | STATUS: <span className="text-primary font-bold">ACTIVE</span></p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-2 px-2 py-1 bg-stealth-300/30 rounded-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-stealth-300 font-mono font-bold tracking-tighter uppercase">COMMS_LINK</span>
          </div>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {assignedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#3F444E] py-12">
            <CheckCircle2 className="w-12 h-12 mb-4 opacity-10" />
            <p className="tracking-widest">ALL SECTORS CLEAR</p>
          </div>
        ) : (
          assignedAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`bg-[#11141B] border rounded-lg overflow-hidden transition-all ${priorityColors[alert.priority]}`}
            >
              <div className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${priorityColors[alert.priority]}`}>
                    {alert.priority} PRIORITY
                  </span>
                  <span className="text-[#3F444E] text-[10px]">
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <h3 className="text-white font-bold text-sm mb-1 leading-tight">{alert.description}</h3>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center gap-1.5 text-stealth-300 text-[10px] font-bold">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{alert.locationName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-stealth-300 text-[10px] font-bold">
                    <Navigation className="w-3 h-3 text-primary" />
                    <span className="text-primary underline cursor-pointer hover:text-white transition-colors">ROUTE_TO_ZONE</span>
                  </div>
                </div>

                {/* Status Controls */}
                <div className="flex gap-2">
                  {alert.status === AlertStatus.UNASSIGNED && (
                    <button
                      onClick={() => updateStatus(alert.id, AlertStatus.ACKNOWLEDGED)}
                      disabled={!!isUpdating}
                      className="flex-1 bg-white hover:bg-white/90 text-black font-bold h-10 rounded text-[11px] transition-colors flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      ACKNOWLEDGE
                    </button>
                  )}
                  {alert.status === AlertStatus.ACKNOWLEDGED && (
                    <button
                      onClick={() => updateStatus(alert.id, AlertStatus.IN_PROGRESS)}
                      disabled={!!isUpdating}
                      className="flex-1 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-black font-bold h-10 rounded text-[11px] transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      SET IN-PROGRESS
                    </button>
                  )}
                  {alert.status === AlertStatus.IN_PROGRESS && (
                    <button
                      onClick={() => updateStatus(alert.id, AlertStatus.RESOLVED)}
                      disabled={!!isUpdating}
                      className="flex-1 bg-[#00F5FF] hover:bg-[#00F5FF]/90 text-black font-bold h-10 rounded text-[11px] transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      MARK RESOLVED
                    </button>
                  )}
                </div>
              </div>
              
              {/* Progress Indicator */}
              {alert.status !== AlertStatus.UNASSIGNED && (
                <div className="h-1 bg-[#1A1D23]">
                  <div 
                    className="h-full bg-current transition-all duration-1000"
                    style={{ 
                      width: alert.status === AlertStatus.ACKNOWLEDGED ? '33%' : 
                             alert.status === AlertStatus.IN_PROGRESS ? '66%' : '100%' 
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer / Location Sync */}
      <div className="bg-stealth-100/50 p-3 border-t border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-stealth-400 uppercase tracking-tighter">Geo_Pos_Lock:</span>
          <span className="text-primary font-mono tracking-widest">ZONE_NORTH_STAND_LOWER</span>
        </div>
      </div>
    </div>
  );
};
