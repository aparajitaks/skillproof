const { createLogger, format, transports } = require("winston");

const { combine, timestamp, printf, colorize, errors, json } = format;

const isDev = process.env.NODE_ENV !== "production";

const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: "HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) => {
        return stack
            ? `${timestamp} [${level}]: ${message}\n${stack}`
            : `${timestamp} [${level}]: ${message}`;
    })
);

const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = createLogger({
    level: isDev ? "debug" : "info",
    format: isDev ? devFormat : prodFormat,
    transports: [new transports.Console()],
    exitOnError: false,
});

module.exports = logger;
