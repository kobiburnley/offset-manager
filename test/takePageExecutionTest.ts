import { OffsetManager } from "../src/service/offsetManager"
import { Params } from "./params"
import * as moment from "moment"
import { once } from "lodash"

export interface TakePageExecutionTestParams {
  offsetManager: OffsetManager<Params>
  fillOffsets: () => Promise<unknown>
}

export class TakePageExecutionTest {
  offsetManager: OffsetManager<Params>
  fillOffsets: () => Promise<unknown>

  constructor(params: TakePageExecutionTestParams) {
    this.offsetManager = params.offsetManager
    this.fillOffsets = params.fillOffsets
  }

  take = once(async () => {
    const { offsetManager, fillOffsets } = this

    await fillOffsets()

    const date = moment.utc()

    const pageExecution = await offsetManager.take({
      date,
    })

    expect(pageExecution!.status).toBe("locked")
    expect(pageExecution!.date).toEqual(
      date.startOf(offsetManager.timeUnit).toDate()
    )

    return pageExecution
  })

  notTakesSamePageTwice = once(async () => {
    const { offsetManager } = this

    const pageExecution = await this.take()

    const otherPageExecutions = await Promise.all(
      new Array(5).fill(null).map(async () => {
        const otherPageExecution = await offsetManager.take({
          date: moment.utc(pageExecution!.date),
        })

        expect(otherPageExecution!.status).toBe("locked")
        expect(otherPageExecution!._id).not.toEqual(pageExecution!._id)

        return otherPageExecution
      })
    )
    return otherPageExecutions
  })

  takesFailedExecution = once(async () => {})
  notTakesFailedExecutionMaxAttempts = once(async () => {})
}
