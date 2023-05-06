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
  static tryParse(json: string): Change | undefined {
    const obj = JSON.parse(json)
    if (obj.instructionType === "change") {
      return new Change(obj.index, obj.remove, obj.text)
    }
    return undefined
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
      // right (removed part) does not overlap with left
      const offset = left.text.length - left.remove
      return [left, new Change(right.index + offset, right.remove, right.text)]
    } else if (left.index + left.remove >= right.index + right.remove) {
      // right (removed part) is fully "included" in the left (removed part)
      return [
        new Change(
          left.index,
          left.remove - right.remove + right.text.length,
          left.text + right.text
        ),
        new Change(left.index + left.text.length, 0, right.text),
      ]
    } else if (left.index + left.remove < right.index + right.remove) {
      // right (removed part) starts after left, but finishes after right

      return [
        new Change(left.index, right.index - left.index, left.text),
        new Change(
          left.index + left.text.length,
          right.index + right.remove - (left.index + left.remove),
          right.text
        ),
      ]
    }

    return [new Change(0, 999, "ERR-LEFT"), new Change(0, 999, "ERR-RIGHT")]
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
