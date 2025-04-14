import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configure the logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      return `${timestamp} ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

/**
 * Middleware to log request information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Capture start time
  const start = process.hrtime();
  
  // Generate a unique ID for the request
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Basic request information
  const requestInfo = {
    id: requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' ? req.body : undefined,
    query: req.query,
    timestamp: new Date().toISOString()
  };
  
  // Log the request start
  logger.info(`Request started: ${req.method} ${req.originalUrl}`, requestInfo);
  
  // When the response finishes, log the final information
  res.on('finish', () => {
    // Calculate response time
    const end = process.hrtime(start);
    const responseTime = (end[0] * 1000 + end[1] / 1000000).toFixed(2);
    
    // Response information
    const responseInfo = {
      id: requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
    
    // Log the request end
    if (res.statusCode >= 400) {
      logger.error(`Request failed: ${req.method} ${req.originalUrl}`, {
        ...requestInfo,
        ...responseInfo
      });
    } else {
      logger.info(`Request completed: ${req.method} ${req.originalUrl}`, {
        ...requestInfo,
        ...responseInfo
      });
    }
  });
  
  next();
};

export default requestLogger;