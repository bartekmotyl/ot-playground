import { Change, Instruction } from "./instructions"

/*
 * Applying instruction 'A' followed by applying instruction returned as 'transformedB'
 * yields the same result as applying instruction represented by 'B' followed by 'transformedB'.
 */
export function xform(
  instrA: Instruction,
  instrB: Instruction,
  aIsPrimary: boolean
): [transformedA: Instruction, transformedB: Instruction] {
  if (instrA instanceof Change && instrB instanceof Change) {
    return xformChangeChange(instrA, instrB, aIsPrimary)
  } else {
    throw new Error(
      `not supported combination: ${instrA.instructionType}+${instrB.instructionType}`
    )
  }
}

function xformChangeChange(
  instrA: Change,
  instrB: Change,
  aIsPrimary: boolean
): [transformedThis: Instruction, transformedOther: Instruction] {
  const left =
    instrA.index < instrB.index || (instrA.index === instrB.index && aIsPrimary)
      ? instrA
      : instrB
  const isThisLeft = instrA === left
  const right = isThisLeft ? instrB : instrA
  const result = xformChangeChangeOriented(left, right)

  if (isThisLeft) {
    return [result[0], result[1]]
  } else {
    return [result[1], result[0]]
  }
}

function xformChangeChangeOriented(
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
