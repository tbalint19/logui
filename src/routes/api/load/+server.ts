import { json } from "@sveltejs/kit"
import * as fs from "fs/promises"
import { logfile, lines, updateLines, safeExec } from "../../../common"

const read = async () => {
  const file = await fs.open(logfile())
  const lines: unknown[] = []
  for await (const line of file.readLines())
    try {
      lines.push(JSON.parse(line))
    } catch (error) {
      lines.push({ level: "trace", msg: "invalid log"})
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
    const previousLog = lines[index-1] as any
    if (!log.time || +log.time <= previousLog.time)
      log.time = previousLog.time + 1
    ordered.push(log)
  }
  updateLines(ordered)
}

setInterval(() => safeExec(read, { count: 1, seconds: 0 }), 1000)

export const GET = (req) => {
  const linesRead = req.url.searchParams.get('from')
  return json(lines().slice(linesRead ? +linesRead : 0))
}