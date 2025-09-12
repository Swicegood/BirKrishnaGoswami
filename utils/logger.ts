import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  source?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private isDebugMode: boolean = false;
  private persistentLogs: LogEntry[] = [];
  private maxPersistentLogs: number = 500;
  private storageKey = '@debug_logs';
  private isInitialized = false;

  constructor() {
    this.isDebugMode = this.checkDebugMode();
    this.initializePersistentLogs();
  }

  private checkDebugMode(): boolean {
    try {
      // Check if we're in debug-preview mode (EAS debug-preview builds)
      const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
      const debugEnabled = Constants.expoConfig?.extra?.debugEnabled;
      
      // Convert string "true"/"false" to boolean, or check release channel
      const isDebugMode = debugEnabled === 'true' || debugEnabled === true || releaseChannel === 'debug-preview';
      
      // Debug logging to help troubleshoot
      console.log('Logger Debug Info:', {
        releaseChannel,
        debugEnabled,
        isDebugMode,
        expoConfig: Constants.expoConfig?.extra,
        finalResult: isDebugMode
      });
      
      // TEMPORARY: Force enable debug mode for testing
      const forceDebugMode = true;
      console.log('FORCE DEBUG MODE:', forceDebugMode);
      
      // Enable debug logging ONLY in debug-preview builds
      // This ensures debug logging is only available in your custom EAS debug-preview builds
      return forceDebugMode;
    } catch (error) {
      console.error('Error in checkDebugMode:', error);
      // Fallback: return true for testing
      return true;
    }
  }

  private async initializePersistentLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem(this.storageKey);
      if (storedLogs) {
        this.persistentLogs = JSON.parse(storedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        console.log(`Loaded ${this.persistentLogs.length} persistent logs from storage`);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error loading persistent logs:', error);
      this.isInitialized = true;
    }
  }

  private async savePersistentLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.persistentLogs));
    } catch (error) {
      console.error('Error saving persistent logs:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addLog(level: LogEntry['level'], message: string, data?: any, source?: string): void {
    if (!this.isDebugMode) {
      return; // Don't log anything if not in debug mode
    }

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    this.logs.unshift(logEntry); // Add to beginning for newest first

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Add to persistent logs for important events (errors, warnings, and critical info)
    if (level === 'error' || level === 'warn' || (level === 'info' && this.isCriticalLog(message, source))) {
      this.persistentLogs.unshift(logEntry);
      
      // Keep only the most recent persistent logs
      if (this.persistentLogs.length > this.maxPersistentLogs) {
        this.persistentLogs = this.persistentLogs.slice(0, this.maxPersistentLogs);
      }
      
      // Save to storage asynchronously
      this.savePersistentLogs();
    }

    // Also log to console for development
    if (__DEV__) {
      const logMessage = `[${logEntry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}`;
      switch (level) {
        case 'error':
          console.error(logMessage, data);
          break;
        case 'warn':
          console.warn(logMessage, data);
          break;
        case 'debug':
          console.debug(logMessage, data);
          break;
        default:
          console.log(logMessage, data);
      }
    }
  }

  private isCriticalLog(message: string, source?: string): boolean {
    const criticalKeywords = [
      'loading', 'error', 'failed', 'timeout', 'crash', 'hang', 'stuck',
      'initialization', 'trackplayer', 'audioscreen', 'playlist'
    ];
    
    const criticalSources = ['useTrackPlayer', 'AudioScreen'];
    
    const messageLower = message.toLowerCase();
    const sourceLower = source?.toLowerCase() || '';
    
    return criticalKeywords.some(keyword => messageLower.includes(keyword)) ||
           criticalSources.some(criticalSource => sourceLower.includes(criticalSource));
  }

  info(message: string, data?: any, source?: string): void {
    this.addLog('info', message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.addLog('warn', message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.addLog('error', message, data, source);
  }

  debug(message: string, data?: any, source?: string): void {
    this.addLog('debug', message, data, source);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  isDebugEnabled(): boolean {
    return this.isDebugMode;
  }

  getLogCount(): number {
    return this.logs.length;
  }

  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  getPersistentLogs(): LogEntry[] {
    return this.persistentLogs;
  }

  async clearPersistentLogs(): Promise<void> {
    this.persistentLogs = [];
    await AsyncStorage.removeItem(this.storageKey);
  }

  async getAllLogs(): Promise<LogEntry[]> {
    // Wait for initialization if not ready
    while (!this.isInitialized) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Combine in-memory and persistent logs, removing duplicates
    const allLogs = [...this.logs];
    this.persistentLogs.forEach(persistentLog => {
      if (!allLogs.find(log => log.id === persistentLog.id)) {
        allLogs.push(persistentLog);
      }
    });
    
    // Sort by timestamp (newest first)
    return allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Create a singleton instance
const logger = new Logger();

export default logger;
