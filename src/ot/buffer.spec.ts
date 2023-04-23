import { SimpleBuffer } from "./buffer"

describe("buffer", () => {
  test("should insert", () => {
    const buffer = new SimpleBuffer()
    buffer.insert(0, "a")
    buffer.insert(1, "b")
    buffer.insert(2, "c")
    expect(buffer.getText()).toEqual("abc")
  })
  test("should insert 2", () => {
    const buffer = new SimpleBuffer()
    buffer.insert(0, "a")
    buffer.insert(1, "b")
    buffer.insert(1, "c")
    expect(buffer.getText()).toEqual("acb")
  })
  test("should insert 3", () => {
    const buffer = new SimpleBuffer()
    buffer.insert(0, "aaaa")
    buffer.insert(0, "bbbb")
    expect(buffer.getText()).toEqual("bbbbaaaa")
  })

  test("should delete 1", () => {
    const buffer = new SimpleBuffer()
    buffer.insert(0, "abcd")
    buffer.delete(2, 1)
    expect(buffer.getText()).toEqual("abd")
  })
  test("should delete 2", () => {
    const buffer = new SimpleBuffer()
    buffer.insert(0, "abcdef")
    buffer.delete(1, 3)
    expect(buffer.getText()).toEqual("aef")
  })
})
