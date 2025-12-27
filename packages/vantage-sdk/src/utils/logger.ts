export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerConfig {
  level: LogLevel;
  format: 'pretty' | 'json';
  transport?: (entry: LogEntry) => void;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  data?: any;
  context?: any;
}

export class Logger {
  private config: LoggerConfig;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    silent: 4
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      format: config.format || 'pretty',
      transport: config.transport
    };
  }

  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  debug(message: string, data?: any, context?: any) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: any) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: any) {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: any, context?: any) {
    this.log('error', message, data, context);
  }

  private log(level: LogLevel, message: string, data?: any, context?: any) {
    if (this.levels[level] < this.levels[this.config.level]) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      data,
      context
    };

    if (this.config.transport) {
      this.config.transport(entry);
    } else {
      this.consoleTransport(entry);
    }
  }

  private consoleTransport(entry: LogEntry) {
    if (this.config.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const args: any[] = [entry.message];
      if (entry.data !== undefined) args.push(entry.data);
      if (entry.context !== undefined) args.push(entry.context);
      
      switch (entry.level) {
        case 'debug': console.debug(...args); break;
        case 'info': console.log(...args); break;
        case 'warn': console.warn(...args); break;
        case 'error': console.error(...args); break;
      }
    }
  }
}

export const logger = new Logger();

