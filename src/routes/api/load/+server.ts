import { json } from "@sveltejs/kit"
import { getLines, init } from "../../../common/reader"

let initCalled = false

export const GET = (req) => {
  if (!initCalled) {
    init()
    initCalled = true
  }
  const time = req.url.searchParams.get('from')
  return json(getLines().filter(log => !time || +(log.time) > +time))
}