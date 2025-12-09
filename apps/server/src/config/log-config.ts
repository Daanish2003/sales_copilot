import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import {
	createLogger,
	format,
	transports,
	type Logger as WinstonLogger,
} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import type Transport from "winston-transport";
import { z } from "zod";

const LoggerConfigSchema = z.object({
	service: z.string().default("app"),

	level: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),

	nodeEnv: z
		.enum(["development", "production", "staging", "test"])
		.default("development"),

	logDir: z.string().default("logs"),

	maxSize: z.string().default("20m"),
	maxFiles: z.string().default("30d"),
	datePattern: z.string().default("YYYY-MM-DD"),

	betterStackToken: z.string().optional(),
	betterStackHost: z.string().optional(),

	sampleRate: z.number().min(0).max(1).default(1.0),

	enableConsole: z.boolean().default(true),

	enableFileLogging: z.boolean().default(true),

	enableBetterStack: z.boolean().default(true),

	redactFields: z
		.array(z.string())
		.default([
			"password",
			"token",
			"secret",
			"authorization",
			"cookie",
			"apiKey",
			"apikey",
			"accessToken",
			"refreshToken",
			"creditCard",
			"ssn",
			"socialSecurityNumber",
		]),
});

export type LoggerConfig = z.infer<typeof LoggerConfigSchema>;

const logLevels = {
	trace: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	fatal: 5,
};

const logColors = {
	trace: "gray",
	debug: "blue",
	info: "green",
	warn: "yellow",
	error: "red",
	fatal: "magenta",
};

function redactSensitiveData(
	obj: unknown,
	redactFields: string[],
	depth = 0,
	maxDepth = 10,
): unknown {
	if (depth > maxDepth) {
		return "[Max Depth Reached]";
	}

	if (obj === null || obj === undefined) {
		return obj;
	}

	if (
		typeof obj === "string" ||
		typeof obj === "number" ||
		typeof obj === "boolean"
	) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) =>
			redactSensitiveData(item, redactFields, depth + 1, maxDepth),
		);
	}

	if (typeof obj === "object") {
		const redacted: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(obj)) {
			const keyLower = key.toLowerCase();
			const shouldRedact = redactFields.some((field) =>
				keyLower.includes(field.toLowerCase()),
			);

			if (shouldRedact) {
				redacted[key] = "[REDACTED]";
			} else {
				redacted[key] = redactSensitiveData(
					value,
					redactFields,
					depth + 1,
					maxDepth,
				);
			}
		}

		return redacted;
	}

	return obj;
}

const createSamplingFormat = (sampleRate: number) => {
	return format((info) => {
		if (info.level === "error" || info.level === "fatal") {
			return info;
		}

		if (Math.random() > sampleRate) {
			return false;
		}

		return info;
	})();
};

const correlationIdFormat = format((info) => {
	return info;
})();

const createSafeJsonFormat = (redactFields: string[]) => {
	return format.combine(
		format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
		format.errors({ stack: true }),
		format((info) => {
			if (info.metadata && typeof info.metadata === "object") {
				info.metadata = redactSensitiveData(
					info.metadata,
					redactFields,
				) as Record<string, unknown>;
			}

			if (typeof info.message === "object" && info.message !== null) {
				info.message = redactSensitiveData(info.message, redactFields);
			}

			return info;
		})(),
		format.json(),
	);
};

const createConsoleTransport = (config: LoggerConfig): Transport => {
	if (!config.enableConsole) {
		return new transports.Console({ silent: true });
	}

	if (config.nodeEnv === "development") {
		return new transports.Console({
			format: format.combine(
				format.colorize({ colors: logColors }),
				format.timestamp({ format: "HH:mm:ss.SSS" }),
				format.printf((info) => {
					const { timestamp, level, message, service, correlationId, ...meta } =
						info;
					const metaStr =
						Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : "";
					const correlationStr = correlationId ? `[${correlationId}]` : "";
					return `${timestamp} ${level} ${correlationStr} [${service}] ${message} ${metaStr}`;
				}),
			),
		});
	}

	return new transports.Console({
		format: createSafeJsonFormat(config.redactFields),
	});
};

const createInfoFileTransport = (config: LoggerConfig): Transport | null => {
	if (!config.enableFileLogging) {
		return null;
	}

	const infoFilter = format((info) => {
		return info.level === "info" ||
			info.level === "debug" ||
			info.level === "trace"
			? info
			: false;
	})();

	return new DailyRotateFile({
		filename: `${config.logDir}/info-%DATE%.log`,
		datePattern: config.datePattern,
		zippedArchive: true,
		maxSize: config.maxSize,
		maxFiles: config.maxFiles,
		level: "trace",
		format: format.combine(
			infoFilter,
			createSafeJsonFormat(config.redactFields),
		),
		createSymlink: true,
		symlinkName: "info-current.log",
	});
};

const createErrorFileTransport = (config: LoggerConfig): Transport | null => {
	if (!config.enableFileLogging) {
		return null;
	}

	const errorFilter = format((info) => {
		return info.level === "error" || info.level === "fatal" ? info : false;
	})();

	return new DailyRotateFile({
		filename: `${config.logDir}/error-%DATE%.log`,
		datePattern: config.datePattern,
		zippedArchive: true,
		maxSize: config.maxSize,
		maxFiles: config.maxFiles,
		level: "error",
		format: format.combine(
			errorFilter,
			createSafeJsonFormat(config.redactFields),
		),
		createSymlink: true,
		symlinkName: "error-current.log",
	});
};

const createWarnFileTransport = (config: LoggerConfig): Transport | null => {
	if (!config.enableFileLogging) {
		return null;
	}

	const warnFilter = format((info) => {
		return info.level === "warn" ? info : false;
	})();

	return new DailyRotateFile({
		filename: `${config.logDir}/warn-%DATE%.log`,
		datePattern: config.datePattern,
		zippedArchive: true,
		maxSize: config.maxSize,
		maxFiles: config.maxFiles,
		level: "warn",
		format: format.combine(
			warnFilter,
			createSafeJsonFormat(config.redactFields),
		),
		createSymlink: true,
		symlinkName: "warn-current.log",
	});
};

const createBetterStackTransport = (config: LoggerConfig): Transport | null => {
	if (!config.enableBetterStack || !config.betterStackToken) {
		return null;
	}

	try {
		const logtail = new Logtail(config.betterStackToken, {
			...(config.betterStackHost && { endpoint: config.betterStackHost }),
		});

		return new LogtailTransport(logtail, {
			level: config.level,
			format: createSafeJsonFormat(config.redactFields),
		});
	} catch (error) {
		if (config.nodeEnv === "development") {
			console.warn("⚠️  Failed to initialize Better Stack logging:", error);
		}
		return null;
	}
};

export function createProductionLogger(
	userConfig: Partial<LoggerConfig> = {},
): WinstonLogger {
	const config = LoggerConfigSchema.parse({
		nodeEnv: process.env.NODE_ENV || "development",
		level: process.env.LOG_LEVEL || userConfig.level,
		service: userConfig.service,
		betterStackToken:
			process.env.BETTER_STACK_TOKEN || userConfig.betterStackToken,
		betterStackHost:
			process.env.BETTER_STACK_HOST || userConfig.betterStackHost,
		sampleRate: userConfig.sampleRate
			? Number(userConfig.sampleRate)
			: process.env.LOG_SAMPLE_RATE
				? Number(process.env.LOG_SAMPLE_RATE)
				: 1.0,
		...userConfig,
	});

	const loggerTransports: Transport[] = [];

	loggerTransports.push(createConsoleTransport(config));

	const infoTransport = createInfoFileTransport(config);
	if (infoTransport) { loggerTransports.push(infoTransport); }

	const warnTransport = createWarnFileTransport(config);
	if (warnTransport) { loggerTransports.push(warnTransport); }

	const errorTransport = createErrorFileTransport(config);
	if (errorTransport) { loggerTransports.push(errorTransport); }

	const betterStackTransport = createBetterStackTransport(config);
	if (betterStackTransport) { loggerTransports.push(betterStackTransport); }

	const logger = createLogger({
		levels: logLevels,
		level: config.level,
		defaultMeta: {
			service: config.service,
			environment: config.nodeEnv,
		},
		format: format.combine(
			correlationIdFormat,
			createSamplingFormat(config.sampleRate),
			createSafeJsonFormat(config.redactFields),
		),
		transports: loggerTransports,
		exceptionHandlers: [
			new transports.Console({
				format: createSafeJsonFormat(config.redactFields),
			}),
			...(errorTransport ? [errorTransport] : []),
		],
		rejectionHandlers: [
			new transports.Console({
				format: createSafeJsonFormat(config.redactFields),
			}),
			...(errorTransport ? [errorTransport] : []),
		],
		exitOnError: config.nodeEnv === "production",
	});

	return logger;
}

let defaultLoggerInstance: WinstonLogger | null = null;

export function getLogger(service?: string): WinstonLogger {
	if (!defaultLoggerInstance) {
		defaultLoggerInstance = createProductionLogger({
			service: service || process.env.SERVICE_NAME || "app",
		});
	}
	return defaultLoggerInstance;
}

export function createLoggerForService(
	service: string,
	config?: Partial<LoggerConfig>,
): WinstonLogger {
	return createProductionLogger({
		service,
		...config,
	});
}

export interface EnhancedLogger extends WinstonLogger {
	withCorrelationId(correlationId: string): EnhancedLogger;

	business(event: string, metadata?: Record<string, unknown>): void;

	performance(
		metric: string,
		duration: number,
		metadata?: Record<string, unknown>,
	): void;
}

export function createEnhancedLogger(
	logger: WinstonLogger,
	defaultCorrelationId?: string,
): EnhancedLogger {
	const enhanced = logger as EnhancedLogger;

	enhanced.withCorrelationId = (correlationId: string): EnhancedLogger => {
		const childLogger = logger.child({ correlationId }) as EnhancedLogger;
		childLogger.withCorrelationId = enhanced.withCorrelationId;
		childLogger.business = enhanced.business;
		childLogger.performance = enhanced.performance;
		return childLogger;
	};

	enhanced.business = (event: string, metadata?: Record<string, unknown>): void => {
		logger.info(event, {
			type: "business_event",
			...metadata,
			...(defaultCorrelationId ? { correlationId: defaultCorrelationId } : {}),
		});
	};

	enhanced.performance = (
		metric: string,
		duration: number,
		metadata?: Record<string, unknown>,
	):void => {
		logger.info(metric, {
			type: "performance",
			duration_ms: duration,
			...metadata,
			...(defaultCorrelationId ? { correlationId: defaultCorrelationId } : {}),
		});
	};

	if (defaultCorrelationId) {
		return enhanced.withCorrelationId(defaultCorrelationId);
	}

	return enhanced;
}

export default {
	createLogger: createProductionLogger,
	createLoggerForService,
	getLogger,
	createEnhancedLogger,
};

export type { Logger as WinstonLogger } from "winston";