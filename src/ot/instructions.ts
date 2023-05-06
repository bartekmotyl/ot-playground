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
   * In case of lack of criteria to decide, please use isPrimary parameter which is expected
   * to have opposite value on "both sides".
   */
  xform(
    other: Instruction,
    isPrimary: boolean
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
    _isPrimary: boolean
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

  xform(
    other: Instruction,
    isPrimary: boolean
  ): [transformedThis: Instruction, transformedOther: Instruction] {
    if (other instanceof NoOp) {
      return [new NoOp(), new NoOp()]
    }
    if (other instanceof Change) {
      const left =
        this.index < other.index || (this.index === other.index && isPrimary)
          ? this
          : other
      const isThisLeft = this === left
      const right = isThisLeft ? other : this
      const result = Change.xformChangeOriented(left, right)

      if (isThisLeft) {
        return [result[0], result[1]]
      } else {
        return [result[1], result[0]]
      }
    }

    throw new Error("Unknown operation type")
  }

  static xformChangeOriented(
    left: Change,
    right: Change
  ): [transformedLeft: Instruction, transformedRight: Instruction] {
    if (left.index + left.remove <= right.index) {
      const offset = left.text.length - left.remove
      return [left, new Change(right.index + offset, right.remove, right.text)]
    }
    return [new Change(0, 999, "ERR-LEFT"), new Change(0, 999, "ERR-RIGHT")]
  }

  toString(): string {
    return `[change at ${this.index}: remove ${this.remove} replace by '${this.text}']`
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
    if (other instanceof Insert) {
      if (
        this.index < other.index ||
        (this.index === other.index && lastResort)
      ) {
        return [this, new Insert(other.index + this.text.length, other.text)]
      } else if (this.index > other.index) {
        return [new Insert(this.index + other.text.length, this.text), other]
      }
    } else if (other instanceof Delete) {
      // inserting text at an index after a deletion shifts the index to the right
      if (this.index >= other.index + other.length) {
        return [new Insert(this.index - other.length, this.text), other]
      } else if (this.index < other.index) {
        return [this, other]
      } else if (
        this.index >= other.index &&
        this.index < other.index + other.length
      ) {
        if (lastResort) {
          return [new Insert(other.index, this.text), new NoOp()]
        }
        return [new NoOp(), other]
      }
    } else if (other instanceof NoOp) {
      return [this, other]
    }
    throw new Error("Unsupported instruction type")
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
    if (other instanceof Insert) {
      // deleting text at an index before an insertion shifts the index to the right
      if (this.index >= other.index + other.text.length) {
        return [new Delete(this.index - other.text.length, this.length), other]
      } else if (this.index + this.length <= other.index) {
        return [this, other]
      } else if (
        this.index < other.index &&
        this.index + this.length > other.index
      ) {
        if (lastResort) {
          return [
            new Delete(this.index, other.index - this.index),
            new Insert(other.index, other.text),
          ]
        }
        return [new Insert(other.index + this.length, other.text), other]
      } else if (
        this.index >= other.index &&
        this.index + this.length <= other.index + other.text.length
      ) {
        return [new NoOp(), other]
      } else if (
        this.index >= other.index &&
        this.index < other.index + other.text.length &&
        this.index + this.length > other.index + other.text.length
      ) {
        if (lastResort) {
          return [
            new Delete(
              this.index,
              this.length - (other.index + other.text.length - this.index)
            ),
            new Insert(other.index, other.text),
          ]
        }
        return [
          new Insert(
            other.index +
              this.length -
              (other.index + other.text.length - this.index),
            other.text
          ),
          other,
        ]
      }
    } else if (other instanceof Delete) {
      // deleting text at an index before another deletion shifts the index to the right
      if (this.index >= other.index + other.length) {
        return [new Delete(this.index - other.length, this.length), other]
      } else if (this.index + this.length <= other.index) {
        return [this, other]
      } else if (
        this.index < other.index &&
        this.index + this.length > other.index
      ) {
        if (lastResort) {
          return [new Delete(this.index, other.index - this.index), new NoOp()]
        }
        return [new NoOp(), other]
      } else if (
        this.index >= other.index &&
        this.index + this.length <= other.index + other.length
      ) {
        return [new NoOp(), other]
      } else if (
        this.index >= other.index &&
        this.index < other.index + other.length &&
        this.index + this.length > other.index + other.length
      ) {
        if (lastResort) {
          return [
            new Delete(
              this.index,
              this.length - (other.index + other.length - this.index)
            ),
            new NoOp(),
          ]
        }
        return [new NoOp(), other]
      }
    } else if (other instanceof NoOp) {
      return [this, other]
    }
    throw new Error("Unsupported instruction type")
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
