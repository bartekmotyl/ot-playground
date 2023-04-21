import { count } from "rxjs"
import { Buffer } from "./buffer"
import { Message } from "./state"

export interface Instruction {
  applyTo(buffer: Buffer): void
  xform(
    other: Instruction,
    otherWins: boolean
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
    _otherWins: boolean
  ): [transformedThis: Instruction, transformedOther: Instruction] {
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
    otherWins: boolean
  ): [transformedThis: Instruction, transformedOther: Instruction] {
    console.debug(`xform: ${this.instructionType} vs ${other.instructionType}`)

    if (other instanceof Insert) {
      if (
        this.index < other.index ||
        (this.index === other.index && !otherWins)
      ) {
        // This insert happened before the other insert or at the same index
        // We need to adjust the index of the other insert by the length of our text
        const transformedOther = new Insert(
          other.index + this.text.length,
          other.text
        )
        return [cloneOperation(this), cloneOperation(transformedOther)]
      } else {
        // This insert happened after the other insert
        // We need to adjust our index by the length of the other text
        const transformedThis = new Insert(
          this.index + other.text.length,
          this.text
        )
        return [cloneOperation(transformedThis), cloneOperation(other)]
      }
    } else if (other instanceof Delete) {
      if (other.index + other.length <= this.index) {
        // The delete happened before our insertion point, so we don't need to adjust
        return [this, other]
      } else if (other.index >= this.index + this.text.length) {
        // The delete happened after our insertion point, so we don't need to adjust
        return [this, other]
      } else if (
        other.index <= this.index &&
        other.index + other.length >= this.index + this.text.length
      ) {
        // Our entire insertion is deleted, so we need to return null for our transformed insert operation
        return [new NoOp(), new Delete(this.index, this.text.length)]
      } else if (other.index <= this.index) {
        // The delete overlaps with the beginning of our insertion, so we need to adjust the index of our insertion
        const adjustedIndex = this.index - other.length
        const adjustedLength =
          this.text.length + this.index - (other.index + other.length)
        const transformedInsert = new Insert(
          adjustedIndex,
          this.text.substring(adjustedLength)
        )
        return [
          transformedInsert,
          new Delete(other.index, other.length + adjustedLength),
        ]
      } else if (other.index + other.length >= this.index + this.text.length) {
        // The delete overlaps with the end of our insertion, so we need to adjust the length of our insertion
        const adjustedLength = this.index - other.index
        const transformedInsert = new Insert(
          this.index,
          this.text.substring(0, adjustedLength)
        )
        return [
          transformedInsert,
          new Delete(
            other.index,
            other.length + this.text.length - adjustedLength
          ),
        ]
      } else {
        // The delete is in the middle of our insertion, so we need to split our insertion into two parts
        const adjustedLength1 = other.index - this.index
        const _adjustedLength2 =
          this.text.length - adjustedLength1 - other.length
        const transformedInsert1 = new Insert(
          this.index,
          this.text.substring(0, adjustedLength1)
        )
        const transformedInsert2 = new Insert(
          this.index + adjustedLength1,
          this.text.substring(adjustedLength1 + other.length)
        )
        return [
          Insert.concat(transformedInsert1, transformedInsert2),
          new Delete(other.index, other.length),
        ]
      }
    } else {
      throw new Error(`unsupported operation: ${other.instructionType}`)
    }
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
      return new Delete(obj.length, obj.index)
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
    otherWins: boolean
  ): [transformedThis: Instruction, transformedOther: Instruction] {
    console.debug(`xform: ${this.instructionType} vs ${other.instructionType}`)
    if (other instanceof Delete) {
      const thisIndex = this.index
      const otherIndex = other.index
      const thisEndIndex = this.index + this.length
      const otherEndIndex = other.index + other.length

      if (thisIndex >= otherEndIndex || otherIndex >= thisEndIndex) {
        // No overlap, no transformation needed
        return [this, other]
      } else if (thisIndex <= otherIndex && thisEndIndex >= otherEndIndex) {
        // Other is completely contained within this, so just adjust the indices
        const transformedOther = new Delete(
          other.index - this.length,
          other.length
        )
        return [this, transformedOther]
      } else if (thisIndex >= otherIndex && thisEndIndex <= otherEndIndex) {
        // This is completely contained within other, so this delete becomes a no-op
        const transformedThis = new NoOp()
        return [transformedThis, other]
      } else if (thisIndex < otherIndex) {
        // This overlaps with the left side of other, so adjust the length of this and the index of other
        const newLength = otherIndex - thisIndex
        const transformedThis = new Delete(thisIndex, newLength)
        const transformedOther = new Delete(
          other.index - newLength,
          other.length
        )
        return [transformedThis, transformedOther]
      } else {
        // This overlaps with the right side of other, so adjust the length of this and the index of other
        const newLength = thisEndIndex - otherEndIndex
        const transformedThis = new Delete(
          thisIndex + other.length - newLength,
          newLength
        )
        const transformedOther = new Delete(
          other.index,
          other.length - newLength
        )
        return [transformedThis, transformedOther]
      }
    } else if (other instanceof Insert) {
      const thisIndex = this.index
      const otherIndex = other.index
      const otherEndIndex = other.index + other.text.length

      if (otherIndex >= thisIndex + this.length) {
        // Other insertion doesn't affect this delete, no transformation needed
        return [this, other]
      } else if (otherEndIndex <= thisIndex) {
        // Other insertion happens before this delete, adjust index of this delete
        const transformedThis = new Delete(
          thisIndex + other.text.length,
          this.length
        )
        return [transformedThis, other]
      } else if (
        otherIndex <= thisIndex &&
        otherEndIndex >= thisIndex + this.length
      ) {
        // Other insertion completely covers this delete, this delete becomes a no-op
        const transformedThis = new NoOp()
        return [transformedThis, other]
      } else if (
        otherIndex > thisIndex &&
        otherEndIndex < thisIndex + this.length
      ) {
        // Other insertion is completely contained within this delete, adjust length of this delete and transform other insertion
        const transformedThis = new Delete(
          thisIndex,
          this.length - other.text.length
        )
        const transformedOther = new Insert(
          other.index - (this.length - transformedThis.length),
          other.text
        )
        return [transformedThis, transformedOther]
      } else if (otherIndex < thisIndex) {
        // Other insertion overlaps with the left side of this delete, adjust index and text of other insertion
        const overlap = thisIndex - otherIndex
        const transformedOther = new Insert(
          other.index + overlap,
          other.text.slice(overlap)
        )
        return [this, transformedOther]
      } else {
        // Other insertion overlaps with the right side of this delete, adjust text of other insertion
        const overlap = otherEndIndex - thisIndex - this.length
        const transformedOther = new Insert(
          other.index,
          other.text.slice(0, other.text.length - overlap)
        )
        return [this, transformedOther]
      }
    } else {
      throw new Error(`unsupported operation: ${other.instructionType}`)
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
