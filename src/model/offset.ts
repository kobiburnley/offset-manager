export interface ObjectId {
  toString(): string
}
export interface Offset<T> {
  _id?: string | ObjectId
  date: Date
  params: T
  totalPages: number
}

export interface PageExecution {
  _id?: string | ObjectId
  page: number
  offsetId: string | ObjectId
  date: Date

  status: "ready" | "started" | "done" | "failed" | "locked"
  executedAt: Date[]
  result: string | null
}
