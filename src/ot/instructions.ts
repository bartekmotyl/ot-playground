import { Buffer } from "./buffer"
import { Message } from "./state"

export interface Instruction {
  applyTo(buffer: Buffer): void
  instructionType: string
  toString(): string
}

export class Change implements Instruction {
  instructionType: string = "change"
  index: number
  remove: number
  text: string

  public constructor(index: number, remove: number, text: string) {
    this.index = index
    this.remove = remove
    this.text = text
  }

  applyTo(buffer: Buffer): void {
    buffer.delete(this.index, this.remove)
    buffer.insert(this.index, this.text)
  }

  static tryParse(json: string): Change | undefined {
    const obj = JSON.parse(json)
    if (obj.instructionType === "change") {
      return new Change(obj.index, obj.remove, obj.text)
    }
    return undefined
  }

  toString(): string {
    return `[change at ${this.index}: remove ${this.remove} replace by '${this.text}']`
  }
}

export function cloneOperation(oper: Instruction): Instruction {
  const operationJSON = JSON.stringify(oper)
  const factories: ((json: string) => Instruction | undefined)[] = [
    Change.tryParse,
  ]
  const clonedOperation = factories
    .map((f) => f(operationJSON))
    .filter((oper) => oper !== undefined)[0]!
  return clonedOperation
}

export function cloneMessage(message: Message): Message {
  const cloneMessage: Message = {
    myMessagesCount: message.myMessagesCount,
    otherMessagesCount: message.otherMessagesCount,
    operation: cloneOperation(message.operation),
    creatorId: message.creatorId,
  }
  return cloneMessage
}
