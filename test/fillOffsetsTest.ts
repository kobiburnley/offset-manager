import { OffsetManager } from "../src/service/offsetManager"
import { Params } from "./params"
import * as moment from "moment"
import { once } from "lodash"

export interface FillOffsetsTestParams {
  offsetManager: OffsetManager<Params>
}

export class FillOffsetsTest {
  offsetManager: OffsetManager<Params>

  constructor(params: FillOffsetsTestParams) {
    this.offsetManager = params.offsetManager
  }

  fill = once(async () => {
    const { offsetManager } = this

    const { offsetIds } = await offsetManager.fill({
      date: moment.utc(),
    })

    expect(offsetIds.length).toBe(10)

    return {offsetIds}
  })

  failsAddingSameOffest = once(async () => {
    const { offsetManager } = this

    await this.fill()

    await expect(
      offsetManager.fill({
        date: moment.utc(),
      })
    ).rejects.toThrowError(/duplicate key error collection/)
  })
}
