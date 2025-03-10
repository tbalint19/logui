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
  updateLines(lines)
}

setInterval(() => safeExec(read, { count: 1, seconds: 0 }), 1000)

export const GET = (req) => {
  const linesRead = req.url.searchParams.get('from')
  return json(lines().slice(linesRead ? +linesRead : 0))
}