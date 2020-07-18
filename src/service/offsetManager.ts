import * as moment from "moment"
import { ObjectId, PageExecution } from "../model/offset"
import { TimeUnit } from "../model/timeUnit"
import { OffsetManagerRepo } from "../repo/offsetManagerRepo"
import { permuteRecord, RecordTupleValues } from "../util/permuteRecord"

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
    offsetId,
    totalPages,
  }: {
    offsetId: ObjectId
    totalPages: number
  }) {
    const { repo } = this

    const offset = await repo.getOffsetById({ offsetId })

    if (offset == null) {
      throw new Error("No such offset")
    }

    const [, { upsertedCount }] = await Promise.all([
      repo.updateOffset({
        offset,
        values: {
          totalPages,
        },
      }),
      repo.createAllPageExecutions({ offset, totalPages }),
    ])

    const updatedOffset = await repo.getOffsetById({ offsetId })

    return {
      upsertedCount,
      offset: updatedOffset,
    }
  }

  async fill({ date }: { date: moment.Moment }) {
    const { propsValues, repo, timeUnit } = this

    const permutations = permuteRecord(propsValues)

    const offsetInsertions = await repo.saveMany({
      permutations,
      date: moment.utc(date).startOf(timeUnit).toDate(),
    })

    const offsetIds = Object.values(offsetInsertions.insertedIds)

    await repo.createFirstPageExecution({
      offsetIds,
    })

    return { offsetIds }
  }

  async takeAny() {
    const { repo, maxAttempts } = this

    const pageExecution = await repo.getFirstReady({
      maxAttempts,
    })

    const offset =
      pageExecution != null
        ? await repo.getOffsetById({ offsetId: pageExecution.offsetId })
        : null

    return {
      pageExecution,
      offset,
    }
  }

  async take({ date }: { date: moment.Moment }) {
    const { repo, timeUnit, maxAttempts } = this

    const pageExecution = await repo.getFirstReadyOn({
      date: moment.utc(date).startOf(timeUnit).toDate(),
      maxAttempts,
    })

    return pageExecution
  }

  async fillIfNoRecords({ date }: { date: moment.Moment }) {
    const { repo } = this

    const firstOffsetForDate = await repo.getFirstOffsetByDate({
      date: date.toDate(),
    })

    if (firstOffsetForDate == null) {
      await this.fill({ date })
    }

    return firstOffsetForDate
  }

  async fillAndTake({ date: rawDate }: { date: moment.Moment }) {
    const { repo, timeUnit } = this

    const date = moment.utc(rawDate).startOf(timeUnit)

    const firstOffsetForDate = await this.fillIfNoRecords({ date })

    const pageExecution = await this.take({ date })

    const offset =
      pageExecution != null
        ? await repo.getOffsetById({ offsetId: pageExecution.offsetId })
        : null

    return {
      pageExecution,
      didFill: firstOffsetForDate == null,
      offset,
    }
  }
}
