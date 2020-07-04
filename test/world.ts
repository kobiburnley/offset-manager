import { FillOffsetsTest } from "./fillOffsetsTest"
import { OffsetManager } from "../src/service/offsetManager"
import { Params } from "./params"
import { TakePageExecutionTest } from './takePageExecutionTest'

export interface WorldParams {
  offsetManager: OffsetManager<Params>
}

export class World {
  offsetManager: OffsetManager<Params>

  fillOffsets: FillOffsetsTest
  takePageExecution: TakePageExecutionTest

  constructor(params: WorldParams) {
    this.offsetManager = params.offsetManager

    this.fillOffsets = new FillOffsetsTest(this)
    this.takePageExecution = new TakePageExecutionTest({
        ...this,
        fillOffsets: this.fillOffsets.fill
    })
  }
}
