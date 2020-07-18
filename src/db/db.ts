import { MongoClient, Collection, Db } from "mongodb"
import { Offset, PageExecution } from "../model/offset"

export interface DBParams {
  mongo: MongoClient
  dbName: string
  collections: {
    offsets: string
    executions: string
  }
}

export class DB<T> {
  mongo: MongoClient
  dbName: string
  collections: {
    offsets: string
    executions: string
  }

  group: Db
  offsets: Collection<Offset<T>>
  executions: Collection<PageExecution>

  constructor(params: DBParams) {
    this.mongo = params.mongo
    this.dbName = params.dbName
    this.collections = params.collections
    this.group = this.mongo.db(params.dbName)
    this.offsets = this.group.collection(params.collections.offsets)
    this.executions = this.group.collection(params.collections.executions)
  }
}
