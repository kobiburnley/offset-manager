export type RecordTupleValues<T> = { [P in keyof T]: T[P][] }

export function permuteRecord<T>(mat: RecordTupleValues<T>): T[] {
  const keys = Object.keys(mat) as (keyof T)[]
  const { length } = keys
  const result = [] as T[]

  const queue = [{ level: 0, path: {} }]

  while (queue.length) {
    const { level, path } = queue.shift()! // eslint-disable-line @typescript-eslint/no-non-null-assertion

    const key = keys[level]

    if (level < length) {
      for (const child of mat[key]) {
        queue.push({ level: level + 1, path: { ...path, [key]: child } })
      }
    } else {
      result.push(path as T)
    }
  }

  return result
}
