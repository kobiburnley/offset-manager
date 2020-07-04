import { MongoClient } from "mongodb"
import { DB } from "../src/db/db"
import { OffsetManagerRepo } from "../src/repo/offsetManagerRepo"
import { OffsetManager } from "../src/service/offsetManager"
import { DBStateManager } from "./dbStateManager"
import { Params } from "./params"

export const mongo = MongoClient.connect("mongodb://localhost", {
  auth: {
    user: "root",
    password: "example",
  },
  useNewUrlParser: true,
})

const db = () =>
  mongo.then((mongo) => {
    return new DB<Params>({
      dbName: "test",
      mongo,
    })
  })

export const dbStateManager = new DBStateManager({
  db,
})

export const repo = new OffsetManagerRepo<Params>({
  db,
})

export const offsetManager = new OffsetManager<Params>({
  repo,
  timeUnit: "day",
  maxAttempts: 5,
  propsValues: {
    city: ["tel-aviv", "netanya", "rehovot", "haifa", "ashdod"],
    rooms: [3, 4],
    propertyType: [1],
  },
})
