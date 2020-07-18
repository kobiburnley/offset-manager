import { DB } from "../src/db/db"

export interface DBStateManagerParams {
  db: () => Promise<DB<any>>
}

export class DBStateManager {
  db: () => Promise<DB<unknown>>

  constructor(params: DBStateManagerParams) {
    this.db = params.db
  }

  init = async () => {
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
  }

  clear = async () => {
    const { executions, offsets, group } = await this.db()
    try {
      await Promise.all([
        group.dropCollection(offsets.collectionName),
        group.dropCollection(executions.collectionName)
      ])
    } catch (e) {
      console.info("DBStateManager.clear(): nothing dropped")
    }
  }
  
  clearAndClose = async () => {
    await this.clear()
    await this.close()
  }
  
  close = async () => {
    const { mongo } = await this.db()

    await mongo.close()
  }
}
