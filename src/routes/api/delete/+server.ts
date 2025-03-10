import { json } from "@sveltejs/kit"
import * as fs from "fs"
import { safeExec, logfile, reset } from "../../../common"

export const GET = async () => {
  const result = await safeExec(() => {
    console.log("runs")
    fs.writeFileSync(logfile(), "")
    reset()
  })

  return json(result)
}