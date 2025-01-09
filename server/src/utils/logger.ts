import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, json } = winston.format;

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'combined-%DATE%.log',
    dirname: 'logs',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '7d',
  });

export const logger = winston.createLogger({
    level: "info",
    format: combine(timestamp(), json()),
    transports: [fileRotateTransport],
})