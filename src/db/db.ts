import { MongoClient, Collection, Db } from "mongodb"
import { Offset, PageExecution } from "../model/offset"

export interface DBParams {
  mongo: MongoClient
  dbName: string
}

export class DB<T> {
  mongo: MongoClient
  dbName: string

  group: Db
  offsets: Collection<Offset<T>>
  executions: Collection<PageExecution>

  constructor(params: DBParams) {
    this.mongo = params.mongo
    this.dbName = params.dbName
    this.group = this.mongo.db(params.dbName)
    this.offsets = this.group.collection("offsets")
    this.executions = this.group.collection("executions")
  }
}
