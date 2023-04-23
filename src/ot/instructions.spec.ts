import { SimpleBuffer } from "./buffer"
import { Delete, Insert, Instruction } from "./instructions"

function testTwoInstructions(
  initialText: string,
  i1: Instruction,
  i2: Instruction
) {
  const buffer1 = new SimpleBuffer()
  buffer1.insert(0, initialText)
  const buffer2 = new SimpleBuffer()
  buffer2.insert(0, initialText)

  i1.applyTo(buffer1)
  i2.applyTo(buffer2)

  // at agent 1
  const transformedFor1 = i2.xform(i1, true)
  console.debug(
    `agent 1: transformed remote ${i2.toString()} to ${transformedFor1[0].toString()}`
  )
  transformedFor1[0].applyTo(buffer1)

  // at agent 2
  const transformedFor2 = i1.xform(i2, false)
  console.debug(
    `agent 2: transformed remote ${i1.toString()} to ${transformedFor2[0].toString()}`
  )
  transformedFor2[0].applyTo(buffer2)

  return {
    text1: buffer1.getText(),
    text2: buffer2.getText(),
  }
}

describe("instruction conflicts", () => {
  test("insert-insert at same position", () => {
    const { text1, text2 } = testTwoInstructions(
      "12345",
      new Insert(1, "b"),
      new Insert(1, "a")
    )

    expect(text1).toEqual("1ba2345")
    expect(text2).toEqual("1ba2345")
  })

  test.only("insert-insert at same position", () => {
    const { text1, text2 } = testTwoInstructions(
      "12345",
      new Insert(1, "b"),
      new Delete(2, 1)
    )

    expect(text1).toEqual("1b345")
    expect(text2).toEqual("1b345")
  })
})
