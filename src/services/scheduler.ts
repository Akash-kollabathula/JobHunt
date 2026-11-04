import { useState, useEffect, useCallback, useRef } from 'react';
import { AutomationSettings } from '../types';

export const AUTOMATION_STORAGE_KEY = 'playwright_qa_automation_settings';

export const DEFAULT_AUTOMATION_SETTINGS: AutomationSettings = {
  enabled: true,
  scheduledTime: '09:00', // 9:00 AM IST
  timezone: 'Asia/Kolkata',
  autoSyncToSheet: true,
  lastRunDate: null,
  lastRunTimestamp: null,
  lastRunStatus: null,
  notifyOnCompletion: true,
};

/**
 * Loads automation settings from localStorage, or initializes with defaults.
 */
export function getAutomationSettings(): AutomationSettings {
  if (typeof window === 'undefined') return DEFAULT_AUTOMATION_SETTINGS;
  try {
    const raw = localStorage.getItem(AUTOMATION_STORAGE_KEY);
    if (!raw) {
      saveAutomationSettings(DEFAULT_AUTOMATION_SETTINGS);
      return DEFAULT_AUTOMATION_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUTOMATION_SETTINGS,
      ...parsed,
    };
  } catch (e) {
    console.error('Error reading automation settings from localStorage:', e);
    return DEFAULT_AUTOMATION_SETTINGS;
  }
}

/**
 * Saves automation settings to localStorage and notifies listeners.
 */
export function saveAutomationSettings(settings: AutomationSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUTOMATION_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent('automation_settings_updated', { detail: settings })
    );
  } catch (e) {
    console.error('Error saving automation settings to localStorage:', e);
  }
}

/**
 * Gets date & time details in Asia/Kolkata (IST).
 */
export function getIstDateTimeDetails(date = new Date()) {
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = istFormatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });

  const year = map.year || '2026';
  const month = map.month || '01';
  const day = map.day || '01';
  const hour = map.hour || '00';
  const minute = map.minute || '00';
  const second = map.second || '00';

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;

  // Human friendly IST string
  const displayFull = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date) + ' IST';

  const displayTime = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return {
    dateStr,
    timeStr,
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    second: parseInt(second, 10),
    displayFull,
    displayTime,
  };
}

/**
 * Calculates human-readable description and time until next scheduled run.
 */
export function getNextScheduledRunInfo(settings: AutomationSettings) {
  if (!settings.enabled) {
    return {
      label: 'Automation is currently paused',
      timeRemaining: 'Paused',
      isDue: false,
      nextRunFormatted: 'Paused',
    };
  }

  const currentIst = getIstDateTimeDetails();
  const [schedH, schedM] = settings.scheduledTime.split(':').map(Number);

  // Compare hours and minutes
  const currentMinutes = currentIst.hour * 60 + currentIst.minute;
  const targetMinutes = schedH * 60 + schedM;

  let isToday = false;
  let minutesLeft = 0;

  if (currentMinutes < targetMinutes) {
    // Scheduled time hasn't happened yet today
    isToday = true;
    minutesLeft = targetMinutes - currentMinutes;
  } else {
    // Scheduled time already passed today, next run is tomorrow
    isToday = false;
    minutesLeft = 24 * 60 - currentMinutes + targetMinutes;
  }

  const hoursRemaining = Math.floor(minutesLeft / 60);
  const minsRemaining = minutesLeft % 60;

  let timeRemainingStr = '';
  if (hoursRemaining > 0) {
    timeRemainingStr = `in ${hoursRemaining}h ${minsRemaining}m`;
  } else {
    timeRemainingStr = `in ${minsRemaining}m`;
  }

  // Format 12-hour label for scheduled time
  const dummyDate = new Date();
  dummyDate.setHours(schedH, schedM, 0, 0);
  const schedTimeFormatted = dummyDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const nextRunFormatted = `${isToday ? 'Today' : 'Tomorrow'} at ${schedTimeFormatted} IST`;

  return {
    label: nextRunFormatted,
    timeRemaining: timeRemainingStr,
    isDue: minutesLeft <= 0,
    nextRunFormatted,
  };
}

/**
 * React hook to poll the scheduler and execute automation at the scheduled time.
 */
export function useAutomationScheduler(
  onTriggerDailySync: (isAutomated: boolean) => Promise<{ success: boolean; message: string }>
) {
  const [settings, setSettings] = useState<AutomationSettings>(getAutomationSettings);
  const [nextRunInfo, setNextRunInfo] = useState(() => getNextScheduledRunInfo(settings));
  const isRunningRef = useRef(false);

  // Sync settings when storage changes
  useEffect(() => {
    const handleUpdate = () => {
      const updated = getAutomationSettings();
      setSettings(updated);
      setNextRunInfo(getNextScheduledRunInfo(updated));
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('automation_settings_updated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('automation_settings_updated', handleUpdate);
    };
  }, []);

  // Update countdown clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRunInfo(getNextScheduledRunInfo(settings));
    }, 10000);
    return () => clearInterval(timer);
  }, [settings]);

  // Main Background Poller (runs every 15 seconds)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Re-read directly from localStorage to ensure cross-tab sync
      const currentSettings = getAutomationSettings();
      if (!currentSettings.enabled) return;
      if (isRunningRef.current) return;

      const ist = getIstDateTimeDetails();

      // Check if current IST time matches scheduled time (HH:mm)
      // and hasn't already run today
      const isTimeMatch = ist.timeStr === currentSettings.scheduledTime;
      const alreadyRanToday = currentSettings.lastRunDate === ist.dateStr;

      if (isTimeMatch && !alreadyRanToday) {
        isRunningRef.current = true;
        try {
          // Mark as running
          const runningSettings: AutomationSettings = {
            ...currentSettings,
            lastRunDate: ist.dateStr,
            lastRunTimestamp: ist.displayFull,
            lastRunStatus: `Running scheduled ${currentSettings.scheduledTime} IST sync...`,
          };
          saveAutomationSettings(runningSettings);
          setSettings(runningSettings);

          // Execute trigger
          const result = await onTriggerDailySync(true);

          // Mark complete
          const completedSettings: AutomationSettings = {
            ...runningSettings,
            lastRunStatus: result.message || 'Completed successfully',
          };
          saveAutomationSettings(completedSettings);
          setSettings(completedSettings);
          setNextRunInfo(getNextScheduledRunInfo(completedSettings));
        } catch (err: any) {
          console.error('Automation scheduler execution error:', err);
          const failedSettings: AutomationSettings = {
            ...currentSettings,
            lastRunDate: ist.dateStr,
            lastRunTimestamp: ist.displayFull,
            lastRunStatus: `Failed: ${err.message || 'Unknown error'}`,
          };
          saveAutomationSettings(failedSettings);
          setSettings(failedSettings);
        } finally {
          isRunningRef.current = false;
        }
      }
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [onTriggerDailySync]);

  const updateSettings = useCallback((newSettings: Partial<AutomationSettings>) => {
    const merged = { ...getAutomationSettings(), ...newSettings };
    saveAutomationSettings(merged);
    setSettings(merged);
    setNextRunInfo(getNextScheduledRunInfo(merged));
  }, []);

  return {
    settings,
    nextRunInfo,
    updateSettings,
    refreshSettings: () => {
      const current = getAutomationSettings();
      setSettings(current);
      setNextRunInfo(getNextScheduledRunInfo(current));
    },
  };
}
