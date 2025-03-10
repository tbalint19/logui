import { json } from "@sveltejs/kit"
import { reset, safeExec } from "../../../common"

export const GET = async () => {

  const result = await safeExec(() => {
    reset()
  })

  return json(result)
}