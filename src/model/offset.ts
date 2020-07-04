export interface ObjectId {
  toString(): string
}
export interface Offset<T> {
  _id?: ObjectId
  date: Date
  params: T
  totalPages: number
}

export interface PageExecution {
  _id?: ObjectId
  page: number
  offsetId: ObjectId
  date: Date

  status: "ready" | "started" | "done" | "failed" | "locked"
  executedAt: Date[]
  result: string | null
}
