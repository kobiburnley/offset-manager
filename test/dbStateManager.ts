import { DB } from "../src/db/db"
import { once } from "lodash"

export interface DBStateManagerParams {
  db: () => Promise<DB<any>>
}

export class DBStateManager {
  db: () => Promise<DB<unknown>>

  constructor(params: DBStateManagerParams) {
    this.db = params.db
  }

  init = once(async () => {
    const { executions, offsets, group } = await this.db()

    await Promise.all([
      group.createCollection(offsets.collectionName),
      group.createCollection(executions.collectionName),
    ])

    await offsets.createIndex(
      {
        date: 1,
        "params.city": 1,
        "params.rooms": 1,
        "params.propertyType": 1,
      },
      {
        unique: true,
      }
    )
  })

  clear = once(async () => {
    const { executions, offsets } = await this.db()
    try {
      await Promise.all([offsets.drop(), executions.drop()])
    } catch (e) {}
  })  
  
  close = once(async () => {
    const { mongo } = await this.db()

    await mongo.close()
  })
}
