import { once } from "lodash"
import { ObjectId } from "../src/model/offset"
import { OffsetManager } from "../src/service/offsetManager"
import { Params } from "./params"

export interface CreatePageExecutionTestParams {
  offsetManager: OffsetManager<Params>
  fillOffsets: () => Promise<{ offsetIds: ObjectId[] }>
}

export class CreatePageExecutionTest {
  offsetManager: OffsetManager<Params>
  fillOffsets: () => Promise<{ offsetIds: ObjectId[] }>

  constructor(params: CreatePageExecutionTestParams) {
    this.offsetManager = params.offsetManager
    this.fillOffsets = params.fillOffsets
  }

  creates = once(async () => {
    const { offsetManager, fillOffsets } = this

    const {
      offsetIds: [offsetId],
    } = await fillOffsets()

    const {
      offset,
      upsertedCount
    } = await offsetManager.createExecutionPages({
      offsetId,
      totalPages: 8,
    })

    expect(offset!.totalPages).toBe(8)
    expect(upsertedCount).toBe(7)
  })
}
