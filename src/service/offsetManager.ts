import { OffsetManagerRepo } from "../repo/offsetManagerRepo"
import { TimeUnit } from "../model/timeUnit"
import * as moment from "moment"
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

  // async start(props: T) {
    // const { propsValues, repo, timeUnit } = this

    // const now = moment.utc().toDate()

    // const job = await repo.getJob({
    //   now,
    //   props,
    // })

    // await repo.updateJob(job.id, {
    //   status: "started",
    // })

    // return job.id
  // }


  async fill({ date }: { date: moment.Moment }) {
    const { propsValues, repo, timeUnit } = this

    const permutations = permuteRecord(propsValues)

    const offsetInsertions = await repo.saveMany({
      permutations,
      date: date.startOf(timeUnit).toDate(),
    })

    await repo.createFirstPageExecutions({
      offsetIds: Object.values(offsetInsertions.insertedIds)
    })

    return offsetInsertions
  }

  async take({ date }: { date: moment.Moment }) {
    const { repo, timeUnit, maxAttempts } = this

    const pageExecution = await repo.getFirstReadyOn({
      date: date.startOf(timeUnit).toDate(),
      maxAttempts
    })

    return pageExecution
  }
}
