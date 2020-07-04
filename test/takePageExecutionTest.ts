import { OffsetManager } from "../src/service/offsetManager"
import { Params } from "./params"
import * as moment from "moment"
import { once } from "lodash"
import { delay, fromIO } from "fp-ts/lib/Task"
import { pipe } from "fp-ts/lib/function"
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

  takesFailedExecution = once(async () => {
    const { offsetManager } = this

    const pageExecution = (await this.take())!

    await offsetManager.failed({ pageExecution, error: "<html" })

    const otherPageExecution = await offsetManager.take({
      date: moment.utc(pageExecution!.date),
    })

    expect(otherPageExecution!._id).toEqual(pageExecution._id)
    expect(otherPageExecution!.status).toBe("locked")

    return otherPageExecution
  })

  notTakesFailedExecutionMaxAttempts = once(async () => {
    const { offsetManager } = this

    const pageExecution = (await this.takesFailedExecution())!

    const drain = offsetManager.maxAttempts - pageExecution.executedAt.length

    for (let i = 0; i < drain - 1; i++) {
      await delay(5)(fromIO(() => {}))()
      await offsetManager.failed({ pageExecution, error: "<html" })
    }

    const pageExecutionAfterFailures = await offsetManager.take({
      date: moment.utc(pageExecution!.date),
    })
    expect(pageExecutionAfterFailures!._id).toEqual(pageExecution._id)

    await offsetManager.failed({ pageExecution, error: "<html" })
    const pageExecutionAfterMaxAttempts = await offsetManager.take({
      date: moment.utc(pageExecution!.date),
    })
    expect(pageExecutionAfterMaxAttempts!._id).not.toEqual(pageExecution._id)
  })
}
