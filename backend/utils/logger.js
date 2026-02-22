const pino = require('pino');

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
    level: isDev ? 'debug' : 'info',
    transport: isDev ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
        },
    } : undefined,
    formatters: {
        level: (label) => ({ level: label }),
    },
});

module.exports = logger;
