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
  it(
    "does not take same page twice",
    world.takePageExecution.notTakesSamePageTwice
  )

  it("takes failed execution", world.takePageExecution.takesFailedExecution)
  it(
    "does not take faield execution max attempts",
    world.takePageExecution.notTakesFailedExecutionMaxAttempts
  )

  it("fill and take", world.takePageExecution.fillAndTake)
})

describe("createExecutionPages", () => {
  it("creates", world.createPageExecution.creates)
})

afterAll(container.dbStateManager.clear)
afterAll(container.dbStateManager.close)
