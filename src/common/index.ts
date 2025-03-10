import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let _isBlocking = false

let _logfilename = "app"
let _lines: unknown[] = []

export const logdir = () => `${__dirname}/../../volume`
export const logfile = (name?: string) => `${__dirname}/../../volume/${name || _logfilename}.log`
export const selectLogfile = (name: string) => _logfilename = name

export const lines = () => _lines
export const updateLines = (data: unknown[]) => _lines = data
const resetLines = () => _lines = []

export const reset = () => {
  resetLines()
}

const isBlocking = () => _isBlocking
const block = () => _isBlocking = true
const unblock = () => _isBlocking = false

export const safeExec = (
  func: () => Promise<void> | void,
  options: { count: number, seconds: number } = { count: 20, seconds: 0.1 }
) => new Promise<{ done: boolean }>(resolve => {
  
  const sleep = (seconds: number) => new Promise<void>(resolve => setTimeout(resolve, seconds*1000))

  const attempt = async () => {
    if (isBlocking())
      return { done: false }

    block()
    try {
      await func()
      unblock()
      return { done: true }
    } catch (error) {
      unblock()
      return { done: false }
    }
  }

  const retry = async () => {
    const maxAttempts = options.count
    for (let count = 1; count <= maxAttempts; count++) {
      const { done } = await attempt()
      if (done)
        return { done: true }
      await sleep(options.seconds)
    }

    return { done: false }
  }

  retry().then(resolve)
})