import fs from 'fs/promises'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fileArg = process.argv[2] || './logs/app.log' /* '../Boilerplate/monorepo/executables/apis/admin-api/logs/app.log' */
const logPath = fileArg.split('/').slice(0, fileArg.split('/').length-1).join('/')
const fileSizeArg = +process.argv[3] || 100
const intervalArg = +process.argv[4] || 200

const file = fileArg //`${__dirname}/../${fileArg}`

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

const reader = () => {

  let _isBlocking = false
  const isBlocking = () => _isBlocking
  const block = () => _isBlocking = true
  const unblock = () => _isBlocking = false

  const safeExec = (
    func: () => Promise<void> | void,
    options: { count: number, ms: number } = { count: 8, ms: 100 }
  ) => new Promise<{ done: boolean }>(resolve => {

    const attempt = async () => {
      if (isBlocking())
        return { done: false }

      block()
      try {
        await func()
        unblock()
        return { done: true }
      } catch (error) {
        console.log(error)
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
        await wait(options.ms)
      }

      return { done: false }
    }

    retry().then(resolve)
  })

  let allLines: any[] = []

  const rotateLinesIfNeeded = async (lines: any[]) => {
    if (lines.length > fileSizeArg * 2) {
      await fs.writeFile(file, "")
      return { truncated: true, newFile: null }
    }
    if (lines.length < fileSizeArg)
      return { truncated: false, newFile: null }
    const path = `${logPath}`
    const archive = `${path}/archive_${new Date().getTime()}.log`
    fs.writeFile(file, "")
    fs.writeFile(archive, lines.slice(0, fileSizeArg * 2).join('\n'))
    return { truncated: false, newFile: archive }
  }

  const getArchives = async () => {
    //const directory = await fs.readdir(`${__dirname}/../${logPath}`)
    const directory = await fs.readdir(logPath)
    const archives = directory.filter(file => file.includes('archive_'))
    return archives
  }

  const read = async () => {
    const fileHandler = await fs.open(file)

    const _lines: string[] = []
    for await (const line of fileHandler.readLines())
      try {
        _lines.push(line)
      } catch (error) {
        _lines.push(JSON.stringify({ level: "trace", msg: "invalid log"}))
      }
      
    const { truncated, newFile } = await rotateLinesIfNeeded(_lines)
    await fileHandler.close()

    let lines: unknown[] = _lines.slice(0, fileSizeArg * 2).map(line => JSON.parse(line))
    if (truncated)
      lines.unshift({ level: "error", msg: "--- logs were truncated ---"})

    const archives = (await getArchives()).sort().slice(-4)
    for (const archive of archives) {
      const archiveSpecifier = archive.split("archive_")
      const newFileSpecifier = newFile?.split("archive_")
      const isDuplication = archiveSpecifier === newFileSpecifier
      if (isDuplication) continue
      const archiveHandler = await fs.open(`${logPath}/${archive}`)

      const _archivedLines: any[] = []
      for await (const line of archiveHandler.readLines())
        try {
          _archivedLines.push(JSON.parse(line))
        } catch (error) {
          _archivedLines.push({ level: "trace", msg: "invalid log"})
        }

      lines = [ ..._archivedLines, ...lines ]
      await archiveHandler.close()
    }
    
    const ordered: unknown[] = []
    for (let index = 0; index < lines.length; index++) {
      const log = lines[index] as any
      if (index === 0) {
        if (!log.time) {
          log.time = 0
        }
        ordered.push(log)
        continue
      }
      const previousLog = ordered[index-1] as any
      if (!log.time || +log.time <= previousLog.time)
        log.time = previousLog.time + 1
      ordered.push(log)
    }

    allLines = ordered
  }

  let executed = 0
  let skipped = 0

  const init = () => {
    setInterval(() => safeExec(read, { count: 1, ms: 0 }).then(res => {
      if (!res.done) {
        skipped++
      } else {
        executed++
      }
      //console.log({ skipped, executed, length: allLines.length })
    }), intervalArg)  
  }

  const reset = async () => {
    const archives = await getArchives()
    for (const archive of archives) {
      await fs.unlink(`${logPath}/${archive}`)
    }
    await fs.writeFile(file, "")
  }

  const getLines = () => {
    return allLines
  }

  return {
    init,
    getLines,
    reset: () => safeExec(reset, { count: 10, ms: 100 })
  }
}

const readerModule = reader()
export const { getLines, reset, init } = readerModule


