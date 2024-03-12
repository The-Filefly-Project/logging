
// Imports ====================================================================

import path from 'node:path'
import url from 'url'
import c from 'chalk'
import winston from 'winston'
import 'winston-daily-rotate-file'

// Types ======================================================================

interface LogConfig {
    /** Logging level applied to the console and log files. */
    loggingLevel: LogLevel
    /** Maximum size of the individual log files. */
    maxLogFileSize: string | number
    /** Maximum number of log files to keel a backlog of. */
    maxLogFiles: number
    /** Where to store the log files. */
    logFolder: string
}

// Exports ====================================================================

export default class Logger {

    private labels: Record<string, string> = {
        critical:   'CRIT',
        error:      'ERRO',
        warn:       'WARN',
        notice:     'NOTE',
        info:       'INFO',
        http:       'HTTP',
        debug:      'DEBG',
    }

    private labelsColored: Record<string, string> = {
        critical:   c.redBright  ('CRIT'),
        error:      c.red        ('ERRO'),
        warn:       c.yellow     ('WARN'),
        notice:     c.green      ('NOTE'),
        info:       c.blue       ('INFO'),
        http:       c.cyan       ('HTTP'),
        debug:      c.whiteBright('DEBG'),
    }

    private isCritical(level: string) {
        if (level === 'critical') return true
        if (level === 'error') return true
        return false
    }

    private formats = {
        console: winston.format.printf(x => {
            return `${c.grey(x.timestamp)} ${this.labelsColored[x.level]} ${c.grey("["+x["0"]+"]")} ${this.isCritical(x.level) ? c.red(x.message) : x.message}`
        }),
        file: winston.format.printf(x => {
            return `${x.timestamp} ${this.labels[x.level]} [${x["0"]}] ${x.message}`.replace(/\x1B\[\d+m/g, '')
        })
    }

    private winston: winston.Logger

    constructor(config: LogConfig) {

        this.winston = winston.createLogger({
            levels: {
                critical:   0,
                error:      1,
                warn:       2,
                notice:     3,
                info:       4,
                http:       5,
                debug:      6,
            },
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: this.formats.console,
                    level: config.loggingLevel
                }),
                new winston.transports.DailyRotateFile({
                    auditFile:      path.join(config.logFolder, "/logs/audit.json"),
                    filename:       path.join(config.logFolder, "/logs/%DATE%.log"),
                    datePattern:    'YYYY-MM-DD',
                    format:         this.formats.file,
                    level:          config.loggingLevel,
                    maxSize:        config.maxLogFileSize,
                    maxFiles:       config.maxLogFiles
                })
            ]
        })

    }

    public getScope(scope: string | url.URL) {
        const filePath = path.basename(url.fileURLToPath(scope))
        return {
            // @ts-ignore
            critical:   (...message: string[]) => this.winston.critical(message.join(', '), [filePath]),
            error:      (...message: string[]) => this.winston.error(message.join(', '), [filePath]),
            warn:       (...message: string[]) => this.winston.warn(message.join(', '), [filePath]),
            // @ts-ignore
            notice:     (...message: string[]) => this.winston.notice(message.join(', '), [filePath]),
            info:       (...message: string[]) => this.winston.info(message.join(', '), [filePath]),
            http:       (...message: string[]) => this.winston.http(message.join(', '), [filePath]),
            debug:      (...message: string[]) => this.winston.debug(message.join(', '), [filePath])
        } satisfies Record<LogLevel, any>
    }
}