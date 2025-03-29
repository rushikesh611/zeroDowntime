import winston from "winston";
import "winston-daily-rotate-file";
import { v4 as uuidv4 } from 'uuid';
import { LogVaultTransport } from "./logvaultTransportUtil";

const { combine, timestamp, json, ms } = winston.format;

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: 'combined-%DATE%.log',
  dirname: 'logs',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '7d',
});

export const logVaultTransport = new LogVaultTransport({
  batchSize: 100,
  flushInterval: 5000,
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json(), ms(),),
  // transports: [fileRotateTransport],
  transports: [fileRotateTransport, logVaultTransport],
})

export const requestLogger = (req: any, res: any, next: any) => {
  req.requestId = uuidv4();
  logger.info('InStart', { requestId: req.requestId })

  res.on('finish', () => {
    logger.info('InEnd', { requestId: req.requestId })
  })

  next()
}