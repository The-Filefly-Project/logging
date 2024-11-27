// Imports ========================================================================================

import path     from 'node:path'
import url      from 'node:url'
import c        from 'chalk'
import winston  from 'winston'
import 'winston-daily-rotate-file'

// Types ==========================================================================================

type LogLevel = 'crit' | 'error' | 'warn' | 'notice' | 'info' | 'http' | 'debug'

export interface LoggerInit {
    /** Folder in which to store log files. */
    where: string
    /** Determines what level logs will be pushed into the console. */
    consoleLogLevel: LogLevel
    /** Determines what level logs will be pushed into individual log files. */
    fileLogLevel: LogLevel
    /** Determines the max size of a log file. Accepts a `number` (number of bytes) and a `string` (file size, eg. `10MB`)*/
    maxLogFileSize: number | string
    /** Determines the max number of log files kept track of. This can be a number of files or number of days. If using days, add 'd' as the suffix. */
    maxLogFileCount: number | string
    /** Project root. */
    dirname: string,
    /** Stack depth used for getting the file and line number where crits and errors originated. */
    stackDepth: number
}

// Module =========================================================================================

export default class LoggerInstance {

    // Internal winston instance
    private static declare winston: winston.Logger
    private static declare config: LoggerInit

    // Log labels used inside files.
    public static levels: Record<string, string> = {
        crit:   'CRIT',
        error:  'ERRO',
        warn:   'WARN',
        notice: 'NOTE',
        info:   'INFO',
        http:   'HTTP',
        debug:  'DEBG'
    }

    // Log labels used in the terminal.
    private static levelsColored: Record<string, string> = {
        crit:   c.red('CRIT'),
        error:  c.red('ERRO'),
        warn:   c.yellow('WARN'), 
        notice: c.cyan('NOTE'),
        info:   c.white('INFO'),
        http:   c.blue('HTTP'),
        debug:  c.magenta('DEBG')
    }

    private static criticalLevels: Record<string, true> = {
        crit: true, 
        error: true
    }

    private static formats = {
        console: winston.format.printf(x => {
            return `${c.grey(x.timestamp)} ${this.levelsColored[x.level]} ${c.grey(`[${x[0]}${x[1] ? `:${x[1]}` : ''}]`)} ${this.criticalLevels[x.level] ? c.red(x.message) : x.message}`
        }),
        file: winston.format.printf(x => {
            return `${x.timestamp} ${this.levels[x.level]} [${x[0]}${x[1] ? `:${x[1]}` : ''}] ${x.message}`.replace(/\x1B\[\d+m/g, '')
        })
    }

    public static async init(init: LoggerInit): Promise<Error | null> {
        try {

            this.config = init

            this.winston = winston.createLogger({
                levels: {
                    crit:   0,
                    error:  1,
                    warn:   2,
                    notice: 3,
                    info:   4,
                    http:   5,
                    debug:  6 
                },
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json()
                ),
                transports: [
                    new winston.transports.Console({
                        format: this.formats.console,
                        level: init.consoleLogLevel
                    }),
                    new winston.transports.DailyRotateFile({
                        filename:       path.join(init.where, "%DATE%.log"),
                        auditFile:      path.join(init.where, "audit.json"),
                        datePattern:    'YYYY-MM-DD',
                        format:         this.formats.file,
                        level:          init.fileLogLevel,
                        maxSize:        init.maxLogFileSize,
                        maxFiles:       init.maxLogFileCount,
                        zippedArchive:  true,
                        createSymlink:  true,
                        symlinkName:    'latest.log'
                    })
                ]
            })
            
            return null

        } 
        catch (error) {
            return error as Error
        }
    }


    public static getScope(scope: string) {

        const relativeScope =  url.fileURLToPath(scope)
            .replace(this.config.dirname, '')
            .replace(/\\|\//g, '/')

        const mapMessage = (message: (string|object)[]) => message.map(x => {
            if (x instanceof Error) return `${x.message} \n${x.stack}`
            if (typeof x === 'object') return JSON.stringify(x)
            return x
        }).join(' ')

        return {
            crit:   (...message: (string|object|Error)[]) => this.winston.crit  (mapMessage(message), [relativeScope, this.getLogLineNumber()]),
            error:  (...message: (string|object|Error)[]) => this.winston.error (mapMessage(message), [relativeScope, this.getLogLineNumber()]),
            warn:   (...message: (string|object|Error)[]) => this.winston.warn  (mapMessage(message), [relativeScope]),
            notice: (...message: (string|object|Error)[]) => this.winston.notice(mapMessage(message), [relativeScope]),
            info:   (...message: (string|object|Error)[]) => this.winston.info  (mapMessage(message), [relativeScope]),
            http:   (...message: (string|object|Error)[]) => this.winston.http  (mapMessage(message), [relativeScope]),
            debug:  (...message: (string|object|Error)[]) => this.winston.debug (mapMessage(message), [relativeScope]),
        }

    }

    /**
     * Returns the line number at which the crit/error was made.
     * This is only done for error logs due to performance issues caused by
     * gathering and parsing the error stack trace.
     */
    private static getLogLineNumber() {

        const stack = new Error().stack
        const lines = stack!.split('\n')
        const line = lines[this.config.stackDepth]

        // Catch possible parsing errors
        if (!line) return undefined

        const cols = line.split(':')
        if (cols.length < 3) return undefined

        const lineNumber = cols[cols.length-2]
        const colNumber = cols[cols.length-1]
        return `${lineNumber}${colNumber ? `:${colNumber}` : ''}`


    }

}