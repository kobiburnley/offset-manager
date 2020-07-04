export interface Offset<T> {
  _id?: string | {}
  date: Date
  params: T
  totalPages: number
}

export interface PageExecution {
  _id?: string | {}
  page: number
  offsetId: string | {}
  date: Date

  status: "ready" | "started" | "done" | "failed" | "locked"
  executedAt: Date[]
  result: string | null
}
