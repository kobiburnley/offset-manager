import { OffsetManagerRepo } from "../repo/offsetManagerRepo"
import { TimeUnit } from "../model/timeUnit"
import * as moment from "moment"
import { permuteRecord, RecordTupleValues } from "../util/permuteRecord"
import { PageExecution, Offset } from "../model/offset"

export interface OffsetManagerParams<T> {
  propsValues: RecordTupleValues<T>
  repo: OffsetManagerRepo<T>
  timeUnit: TimeUnit
  maxAttempts: number
}

export class OffsetManager<T> {
  propsValues: RecordTupleValues<T>
  repo: OffsetManagerRepo<T>
  timeUnit: TimeUnit
  maxAttempts: number

  constructor(params: OffsetManagerParams<T>) {
    this.propsValues = params.propsValues
    this.repo = params.repo
    this.timeUnit = params.timeUnit
    this.maxAttempts = params.maxAttempts
  }

  async start({ pageExecution }: { pageExecution: PageExecution }) {
    const { repo } = this

    const result = await repo.updatePageExecution({
      pageExecution,
      values: {
        status: "started",
      },
    })

    return result
  }

  async done({
    pageExecution,
    result,
  }: {
    pageExecution: PageExecution
    result: string
  }) {
    const { repo } = this

    return await repo.updatePageExecution({
      pageExecution,
      values: {
        status: "done",
        result,
        executedAt: [new Date()],
      },
    })
  }

  async failed({
    pageExecution,
    error,
  }: {
    pageExecution: PageExecution
    error: string
  }) {
    const { repo } = this

    const result = await repo.updatePageExecution({
      pageExecution,
      values: {
        status: "failed",
        result: error,
        executedAt: [new Date()],
      },
    })

    return result
  }

  async createExecutionPages({
    offset,
    totalPages,
  }: {
    offset: Offset<T>
    totalPages: number
  }) {
    const { repo } = this

    await Promise.all([
      repo.updateOffset({offset, values: {
        totalPages
      }}),
      repo.createAllPageExecutions({ offset, totalPages })
    ])
  }

  async fill({ date }: { date: moment.Moment }) {
    const { propsValues, repo, timeUnit } = this

    const permutations = permuteRecord(propsValues)

    const offsetInsertions = await repo.saveMany({
      permutations,
      date: date.startOf(timeUnit).toDate(),
    })

    await repo.createFirstPageExecution({
      offsetIds: Object.values(offsetInsertions.insertedIds),
    })

    return offsetInsertions
  }

  async take({ date }: { date: moment.Moment }) {
    const { repo, timeUnit, maxAttempts } = this

    const pageExecution = await repo.getFirstReadyOn({
      date: date.startOf(timeUnit).toDate(),
      maxAttempts,
    })

    return pageExecution
  }
}
