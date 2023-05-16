import { SimpleBuffer } from "./buffer"
import { Change, Instruction } from "./instructions"
import { xform } from "./xform"

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
  const transformedFor1 = xform(i2, i1, true)
  console.debug(
    `agent 1: transformed remote ${i2.toString()} to ${transformedFor1[0].toString()}`
  )
  transformedFor1[0].applyTo(buffer1)

  // at agent 2
  const transformedFor2 = xform(i1, i2, false)
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
      new Change(1, 0, "b"),
      new Change(1, 0, "a")
    )

    expect(text1).toEqual("1ab2345")
    expect(text2).toEqual("1ab2345")
  })

  test("insert-insert at same position", () => {
    const { text1, text2 } = testTwoInstructions(
      "12345",
      new Change(1, 0, "b"),
      new Change(2, 1, "")
    )

    expect(text1).toEqual("1b245")
    expect(text2).toEqual("1b245")
  })
})
