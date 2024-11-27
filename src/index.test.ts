import { expect, test, describe } from "vitest"
import LoggerInstance from "./index.js"
import path from 'node:path'
import url from 'node:url'

const filename = url.fileURLToPath(import.meta.url)
const dirname = url.fileURLToPath(new URL('.', import.meta.url))

test('init', async () => {

    await LoggerInstance.init({
        where: path.join(dirname, '../tests/'),
        consoleLogLevel: 'debug',
        fileLogLevel: 'debug',
        maxLogFileSize: 10_000_000,
        maxLogFileCount: 10,
        dirname: dirname,
        stackDepth: 3
    })

    const log = LoggerInstance.getScope(import.meta.url)
    
    log.crit('crit')
    log.error('error')
    log.warn('warn')
    log.notice('notice')
    log.info('info')
    log.http('http')
    log.debug('debug')


})