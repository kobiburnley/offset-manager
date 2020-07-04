import * as container from "./container"
import { World } from "./world"

const world = new World(container)

beforeAll(container.dbStateManager.clear)
beforeAll(container.dbStateManager.init)

describe("fillOffets", () => {
  it("fill offsets", world.fillOffsets.fill)
  it("fails adding same offet", world.fillOffsets.failsAddingSameOffest)
})

describe("takePageExecution", () => {
  it("take", world.takePageExecution.take)
  it("does not take same page twice", world.takePageExecution.notTakesSamePageTwice)
})

// afterAll(container.dbStateManager.clear)
afterAll(container.dbStateManager.close)
