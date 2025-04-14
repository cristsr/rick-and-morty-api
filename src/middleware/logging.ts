 
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configurar el logger
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
 * Middleware para registrar información de las peticiones
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Captura el tiempo de inicio
  const start = process.hrtime();
  
  // Genera un ID único para la petición
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Información básica de la petición
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
  
  // Registra el inicio de la petición
  logger.info(`Request started: ${req.method} ${req.originalUrl}`, requestInfo);
  
  // Cuando la respuesta termine, registra la información final
  res.on('finish', () => {
    // Calcula el tiempo de respuesta
    const end = process.hrtime(start);
    const responseTime = (end[0] * 1000 + end[1] / 1000000).toFixed(2);
    
    // Información de la respuesta
    const responseInfo = {
      id: requestId,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
    
    // Registra el fin de la petición
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