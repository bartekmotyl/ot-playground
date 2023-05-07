import { State } from "./state"
import { Buffer, SimpleBuffer } from "./buffer"
import { Change } from "./instructions"
import { range } from "lodash"
import * as randomSeed from "random-seed"

describe("state", () => {
  test("dummy1", () => {
    const state1 = new State(123, "test1")
    const i1 = state1.localUpdate("aaa")
    const i2 = state1.localUpdate("ax")

    const buffer: Buffer = new SimpleBuffer()

    i1.forEach((i) => i.applyTo(buffer))
    expect(buffer.getText()).toEqual("aaa")

    i2.forEach((i) => i.applyTo(buffer))
    expect(buffer.getText()).toEqual("ax")
  })

  test("dummy1a", () => {
    const state1 = new State(123, "test1")
    state1.localUpdate("this is test")

    const instructions = state1.localUpdate("this was test")
    expect(instructions.length).toBe(1)
    const firstChange = instructions[0] as Change
    expect(firstChange.index).toBe(5)
    expect(firstChange.remove).toBe(1)
    expect(firstChange.text).toBe("wa")
  })

  test("dummy1b", () => {
    const state1 = new State(123, "test1")
    state1.localUpdate("this is a longer test")

    const instructions = state1.localUpdate("this was a bit short testing")

    expect(instructions.length).toBe(5)

    const buffer = new SimpleBuffer()
    buffer.insert(0, "this is a longer test")
    instructions.forEach((i) => i.applyTo(buffer))
    expect(buffer.getText()).toBe("this was a bit short testing")
  })

  test("dummy1c", () => {
    const state1 = new State(123, "test1")
    state1.localUpdate("this is a longer test")

    const instructions1 = state1.localUpdate("this was a bit short testing")
    const instructions2 = state1.localUpdate("this was never a short test")
    const instructions3 = state1.localUpdate(
      "this always was a nice test testing"
    )

    const buffer = new SimpleBuffer()
    buffer.insert(0, "this is a longer test")
    instructions1.forEach((i) => i.applyTo(buffer))
    instructions2.forEach((i) => i.applyTo(buffer))
    instructions3.forEach((i) => i.applyTo(buffer))

    expect(buffer.getText()).toBe("this always was a nice test testing")
  })

  test("dummy2", () => {
    const state1 = new State(123, "test1")
    const buffer: Buffer = new SimpleBuffer()
    let counter = 0
    state1.getMessageSubject().subscribe((msg) => {
      msg.operation.applyTo(buffer)
      counter += 1
    })
    state1.localUpdate("aaa")
    state1.localUpdate("ax")
    expect(counter).toEqual(2)
    expect(buffer.getText()).toEqual("ax")
  })
  test("dummy3", () => {
    const state1 = new State(123, "dummy3-test1")

    const state2 = new State(124, "dummy3-test2")

    state1.getMessageSubject().subscribe((msg) => state2.receive(msg))

    state1.localUpdate("aaa")
    state1.localUpdate("ax")

    state2.processReceived()

    expect(state2.getText()).toEqual("ax")
  })

  test("dummy4", () => {
    const state1 = new State(123, "dummy4-test1")
    const state2 = new State(124, "dummy4-test2")
    state1.getMessageSubject().subscribe((msg) => state2.receive(msg))
    state2.getMessageSubject().subscribe((msg) => state1.receive(msg))

    state1.localUpdate("11123444")
    state2.processReceived()
    expect(state2.getText()).toEqual(state1.getText())

    state1.localUpdate("111x444")
    state2.localUpdate("111y444")

    state1.processReceived()
    state2.processReceived()

    //expect(state1.getText()).toEqual("111xy444")

    expect(state2.getText()).toEqual(state1.getText())
  })

  test("random1", () => {
    const state1 = new State(123, "random1-test1")
    const state2 = new State(124, "random1-test2")
    state1.getMessageSubject().subscribe((msg) => state2.receive(msg))
    state2.getMessageSubject().subscribe((msg) => state1.receive(msg))

    const count = 10
    const random = randomSeed.create("seed1")

    range(count).forEach((_i) => {
      state1.localUpdate(randomModification(random, state1.getText()))
      state2.localUpdate(randomModification(random, state2.getText()))
    })

    state1.processReceived()
    state2.processReceived()

    expect(state2.getText()).toEqual(state1.getText())
    console.log(state2.getText())
  })

  test("random2", () => {
    const state1 = new State(123, "random1-test1")
    const state2 = new State(124, "random1-test2")
    state1.getMessageSubject().subscribe((msg) => state2.receive(msg))
    state2.getMessageSubject().subscribe((msg) => state1.receive(msg))

    const iterations = 100

    range(iterations).forEach((_iteration) => {
      const count = 30
      const random = randomSeed.create("hello")

      range(count).forEach((_i) => {
        state1.localUpdate(randomModification(random, state1.getText()))
        state2.localUpdate(randomModification(random, state2.getText()))
      })

      state1.processReceived()
      state2.processReceived()

      expect(state2.getText()).toEqual(state1.getText())
      console.log(state2.getText())
    })
  })
})

function randomText(random: randomSeed.RandomSeed, length: number): string {
  let result = ""
  const characters =
    "     ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const charactersLength = characters.length
  let counter = 0
  while (counter < length) {
    result += characters.charAt(random(charactersLength))
    counter += 1
  }
  return result
}

function randomChange(random: randomSeed.RandomSeed, oldText: string): Change {
  const text = random(2) > 0 ? randomText(random, random(30)) : ""
  const index = random(oldText.length)
  const remove = random(2) > 0 ? random(10) : 0
  return new Change(index, remove, text)
}

function randomModification(
  random: randomSeed.RandomSeed,
  text: string
): string {
  const buffer = new SimpleBuffer()
  buffer.insert(0, text)
  const change = randomChange(random, text)
  change.applyTo(buffer)
  return buffer.getText()
}
