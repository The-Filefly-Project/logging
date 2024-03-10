
import { test, expect } from 'vitest'
import Logger from '../src/index'

import url from 'url'
import path from 'path'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

test('File logging', () => {

    const logger = new Logger({
        loggingLevel: 'debug',
        maxLogFiles: 7,
        maxLogFileSize: "20MB",
        logFolder: path.join(__dirname, './logs/')
    })

    const scope = logger.getScope(import.meta.url)

    scope.critical('A critical incident!')
    scope.error('A really important error!')
    scope.warn(`Something's wrong...`)
    scope.notice('Worth noting.')
    scope.info('Informative!')
    scope.http(`Something's happening!`)
    scope.debug(`Diving deeper...`)

})