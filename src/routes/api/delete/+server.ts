import { json } from "@sveltejs/kit"
import { reset } from "../../../common/reader"

export const GET = async () => {
  const result = await reset()

  return json(result)
}