import { Buffer } from "./buffer"
import { Message } from "./state"

export interface Instruction {
  applyTo(buffer: Buffer): void
  /**
   * This function implement Operation Transformation. Each class implementing the Instruction
   * interface should implement this method in a way that supports conflicts with any of the other instruction types,
   * including same type.
   * The returned pair of instruction satisfies the following condition:
   * Applying instruction represented by 'this' followed by applying instruction returned as 'transformedOther'
   * yields the same result as applying instruction represented by 'other' followed by 'transformedThis'.
   * In case of lack of criteria to decide, please use lastResort parameter which is expected
   * to have opposite value on "both sides".
   */
  xform(
    other: Instruction,
    lastResort: boolean
  ): [transformedThis: Instruction, transformedOther: Instruction]
  instructionType: string
  toString(): string
}

export class NoOp implements Instruction {
  public instructionType: string = "noop"
  public applyTo(_buffer: Buffer) {
    // nothing to do
  }
  public xform(
    other: Instruction,
    _lastResort: boolean
  ): [Instruction, Instruction] {
    return [this, other]
  }
  public toString() {
    return "[noop]"
  }
  static tryParse(json: string): NoOp | undefined {
    const obj = JSON.parse(json)
    if (obj.instructionType === "noop") {
      return new NoOp()
    }
    return undefined
  }
}

export class Insert implements Instruction {
  instructionType: string = "insert"
  text: string
  index: number
  public constructor(index: number, text: string) {
    this.index = index
    this.text = text
  }

  static tryParse(json: string): Insert | undefined {
    const obj = JSON.parse(json)
    if (obj.instructionType === "insert") {
      return new Insert(obj.index, obj.text)
    }
    return undefined
  }

  public applyTo(buffer: Buffer) {
    buffer.insert(this.index, this.text)
  }
  public toString() {
    return `[insert at ${this.index} text "${this.text}"]`
  }
  public static concat(...inserts: Insert[]): Insert {
    let text = ""
    let index = Infinity
    for (const insert of inserts) {
      text += insert.text
      index = Math.min(index, insert.index)
    }
    return new Insert(index, text)
  }

  public xform(
    other: Instruction,
    lastResort: boolean
  ): [Instruction, Instruction] {
    if (other instanceof NoOp) {
      return [this, other]
    } else if (other instanceof Insert) {
      if (
        this.index < other.index ||
        (this.index === other.index && lastResort)
      ) {
        return [this, new Insert(other.index + this.text.length, other.text)]
      } else {
        return [new Insert(this.index + other.text.length, this.text), other]
      }
    } else if (other instanceof Delete) {
      if (this.index <= other.index) {
        return [this, new Delete(other.index + this.text.length, other.length)]
      } else if (this.index >= other.index + other.length) {
        return [new Insert(this.index - other.length, this.text), other]
      } else {
        // Unsupported operation
        throw new Error("Unsupported operation")
      }
    }
    // Unsupported operation
    throw new Error("Unsupported operation")
  }
}

export class Delete implements Instruction {
  instructionType: string = "delete"
  length: number
  index: number
  public constructor(index: number, length: number) {
    this.index = index
    this.length = length
  }

  static tryParse(json: string): Delete | undefined {
    const obj = JSON.parse(json)
    if (obj.instructionType === "delete") {
      return new Delete(obj.index, obj.length)
    }
    return undefined
  }

  public applyTo(buffer: Buffer) {
    buffer.delete(this.index, this.length)
  }
  public toString() {
    return `[delete at ${this.index}, "${this.length} characters"]`
  }

  public xform(
    other: Instruction,
    lastResort: boolean
  ): [Instruction, Instruction] {
    if (other instanceof NoOp) {
      return [this, other]
    } else if (other instanceof Insert) {
      if (other.index <= this.index) {
        return [new Delete(this.index + other.text.length, this.length), other]
      } else if (other.index >= this.index + this.length) {
        return [this, other]
      } else {
        throw new Error("Unsupported conflict")
      }
    } else if (other instanceof Delete) {
      if (other.index > this.index) {
        return [new Delete(this.index, this.length), other]
      } else if (other.index + other.length < this.index) {
        return [this, other]
      } else {
        const start = Math.min(this.index, other.index)
        const end = Math.max(
          this.index + this.length,
          other.index + other.length
        )
        return [new Delete(start, end - start), new NoOp()]
      }
    } else {
      if (lastResort) {
        return [other, this]
      } else {
        throw new Error("Unsupported instruction")
      }
    }
  }
}

export function cloneOperation(oper: Instruction): Instruction {
  const operationJSON = JSON.stringify(oper)
  const factories: ((json: string) => Instruction | undefined)[] = [
    NoOp.tryParse,
    Insert.tryParse,
    Delete.tryParse,
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
