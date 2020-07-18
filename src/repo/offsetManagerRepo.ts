import { Collection, WithId } from "mongodb"
import { ObjectId, Offset, PageExecution } from "../model/offset"
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

  async getFirstOffsetByDate({ date }: { date: Date }) {
    const db = await this.db()

    return db.offsets.findOne({
      date,
    })
  }

  async getFirstReady({
    maxAttempts,
  }: {
    maxAttempts: number
  }) {
    const { db } = this
    const { executions } = await db()

    const { value } = await executions.findOneAndUpdate(
      {
        $or: [
          { status: "ready" },
          {
            status: "failed",
            [`executedAt.${maxAttempts - 1}`]: { $exists: false },
          },
        ],
      },
      {
        $set: {
          status: "locked",
        },
      },
      {
        sort: {
          date: 1,
          page: 1,
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

  async getFirstReadyOn({
    date,
    maxAttempts,
  }: {
    date: Date
    maxAttempts: number
  }) {
    const { db } = this
    const { executions } = await db()

    const { value } = await executions.findOneAndUpdate(
      {
        date,
        $or: [
          { status: "ready" },
          {
            status: "failed",
            [`executedAt.${maxAttempts - 1}`]: { $exists: false },
          },
        ],
      },
      {
        $set: {
          status: "locked",
        },
      },
      {
        sort: {
          date: 1,
          page: 1,
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

  async createFirstPageExecution({ offsetIds }: { offsetIds: ObjectId[] }) {
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

  async createAllPageExecutions({
    offset,
    totalPages,
  }: {
    offset: Offset<T>
    totalPages: number
  }) {
    const db = await this.db()

    const { upsertedCount } = await db.executions.bulkWrite(
      new Array(totalPages).fill(null).map((_, index) => ({
        updateOne: {
          filter: {
            offsetId: offset._id,
            date: offset.date,
            page: index + 1,
          },
          update: {
            $setOnInsert: {
              status: "ready",
              result: null,
              executedAt: [],
            },
          },
          upsert: true,
        },
      }))
    )

    return {
      upsertedCount,
    }
  }

  async getOffsetById({ offsetId }: { offsetId: ObjectId }) {
    const db = await this.db()

    return await db.offsets.findOne({ _id: offsetId })
  }

  async updateOffset({
    offset,
    values,
  }: {
    offset: Offset<T>
    values: Partial<Offset<T>>
  }) {
    const db = await this.db()

    const { modifiedCount } = await db.offsets.updateOne(
      {
        _id: offset._id,
      },
      {
        $set: {
          totalPages: values.totalPages,
        },
      }
    )

    return { modifiedCount }
  }

  async updatePageExecution({
    pageExecution,
    values,
  }: {
    pageExecution: PageExecution
    values: Partial<PageExecution>
  }) {
    const db = await this.db()

    const { modifiedCount } = await db.executions.updateOne(
      {
        _id: pageExecution._id,
      },
      {
        $set: {
          status: values.status,
          result: values.result,
        },
        ...(values.executedAt
          ? {
              $addToSet: {
                executedAt: { $each: values.executedAt },
              },
            }
          : {}),
      }
    )

    return { modifiedCount }
  }
}
