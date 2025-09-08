import Constants from 'expo-constants';

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

  constructor() {
    this.isDebugMode = this.checkDebugMode();
  }

  private checkDebugMode(): boolean {
    // Check if we're in debug-preview mode
    const releaseChannel = Constants.expoConfig?.extra?.releaseChannel;
    const isDebugPreview = releaseChannel === 'debug-preview';
    
    // Also check for development mode
    const isDev = __DEV__;
    
    // If no release channel is set, default to production mode (no debug logging)
    // This ensures debug logging is only enabled when explicitly set to debug-preview
    return isDebugPreview || isDev;
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
}

// Create a singleton instance
const logger = new Logger();

export default logger;
