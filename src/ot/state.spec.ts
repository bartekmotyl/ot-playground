import { State } from "./state"
import { Buffer, SimpleBuffer } from "./buffer"

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
    expect(counter).toEqual(3)
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
})
