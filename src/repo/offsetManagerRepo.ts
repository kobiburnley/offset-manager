import { Collection, UpdateQuery, WithId } from "mongodb"
import { Offset, PageExecution } from "../model/offset"

interface DB<T> {
  offsets: Collection<Offset<T>>
  executions: Collection<PageExecution>
}

export interface OffsetManagerRepoParams<T> {
  db: () => Promise<DB<T>>
}

export class OffsetManagerRepo<T> {
  db: () => Promise<DB<T>>

  constructor(params: OffsetManagerRepoParams<T>) {
    this.db = params.db
  }

  async getFirstReadyOn({ date, maxAttempts }: { date: Date, maxAttempts: number }) {
    const { db } = this

    const { executions } = await db()

    const { value } = await executions.findOneAndUpdate(
      {
        date,
        $or: [
          { status: "ready" },
          { status: "failed", [`executedAt.${maxAttempts}`]: { $exists: false } },
        ],
      },
      {
        $set: {
          status: "locked",
        },
      }
    )

    if (value != null) {
      return executions.findOne({
        _id: value._id,
      })
    }

    return null
  }

  async saveMany({ date, permutations }: { date: Date; permutations: T[] }) {
    const db = await this.db()

    const { insertedIds, insertedCount } = await db.offsets.insertMany(
      permutations.map((permutation) => ({
        date,
        params: permutation,
        totalPages: 0,
      }))
    )

    return { insertedIds, insertedCount }
  }

  async createFirstPageExecutions({
    offsetIds,
  }: {
    offsetIds: (string | {})[]
  }) {
    const db = await this.db()

    const offsets = (await db.offsets
      .find({
        _id: {
          $in: offsetIds,
        },
      })
      .toArray()) as WithId<Offset<T>>[]

    await db.executions.insertMany(
      offsets.map((offset) => ({
        offsetId: offset._id,
        date: offset.date,
        page: 1,
        status: "ready",
        result: null,
        executedAt: [],
      }))
    )
  }

  // takeJob(params: {date: Date}) {}

  // getJob(params: {props: T, now: Date}): Promise<Offset<T>> { }

  // updateJob(id: string, values: Partial<Offset<T>>): Promise<Offset<T>> {}
}
