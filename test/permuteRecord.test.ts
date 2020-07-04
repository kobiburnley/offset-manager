import { permuteRecord } from "../src/util/permuteRecord"

describe("permuteRecord", () => {
  it("permutes", () => {
    const date1 = new Date("2020-06-30")
    const date2 = new Date("2020-07-01")

    const permutations = permuteRecord({
      date: [date1, date2],
      rooms: [3, 4],
      propertyType: ["1", "2"],
    })

    expect(permutations).toEqual([
      { date: date1, rooms: 3, propertyType: "1" },
      { date: date1, rooms: 3, propertyType: "2" },
      { date: date1, rooms: 4, propertyType: "1" },
      { date: date1, rooms: 4, propertyType: "2" },
      { date: date2, rooms: 3, propertyType: "1" },
      { date: date2, rooms: 3, propertyType: "2" },
      { date: date2, rooms: 4, propertyType: "1" },
      { date: date2, rooms: 4, propertyType: "2" },
    ])
  })
})
