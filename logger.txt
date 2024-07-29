
// import { createLogger, format, transports } from 'winston';
// import 'winston-daily-rotate-file';
// import { Loggly } from 'winston-loggly-bulk';

// // Create a new Winston logger instance with file and console transports
// const logger = createLogger({
//   level: 'info',
//   format: format.combine(
//     format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//     format.errors({ stack: true }),  // Ensure stack trace is included in logs
//     format.json() // Use JSON format for file and external transport
//   ),
//   transports: [
//     // Human-readable format for console output
//     new transports.Console({
//       format: format.combine(
//         format.colorize(),
//         format.printf(({ timestamp, level, message, stack }) => {
//           return `${timestamp} ${level}: ${stack || message}`;
//         })
//       ),
//     }),
//     // JSON format for file transport
//     new transports.DailyRotateFile({
//       filename: 'logs/application-%DATE%.log',
//       datePattern: 'YYYY-MM-DD',
//       maxFiles: '14d', // Keep logs for the last 14 days
//       format: format.combine(
//         format.timestamp(),
//         format.json()
//       )
//     }),
//     new Loggly({
//       token: '205bb2d5-4171-406b-b151-b41eb6328479',
//       subdomain: 'beeptracking',
//       tags: ['Winston-NodeJS'],
//       json: true
//     })
//   ],
// });

// // Export the logger
// export default logger;
