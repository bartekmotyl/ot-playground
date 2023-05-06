import { diffChars } from "diff"
import { Buffer, SimpleBuffer } from "./buffer"
import { Instruction, cloneMessage } from "./instructions"
import { Subject } from "rxjs"

export type Message = {
  myMessagesCount: number
  otherMessagesCount: number
  operation: Instruction
  creatorId: number
}

export class State {
  private label: string
  private actorId: number
  private buffer: Buffer = new SimpleBuffer()
  private outgoing: Message[] = []
  private incoming: Message[] = []
  private myMessagesCount: number = 0
  private otherMessagesCount: number = 0
  private messageSubject = new Subject<Message>()

  constructor(actorId: number, label: string) {
    this.actorId = actorId
    this.label = label
  }
  public localUpdate(newText: string): Instruction[] {
    const oldText = this.buffer.getText()
    const changes = diffChars(oldText, newText)

    let index = 0
    const newInstructions: Instruction[] = []
    changes.forEach((change) => {
      // TODO
      /*
      if (change.added) {
        newInstructions.push(new Insert(index, change.value))
        index += change.value.length
      } else if (change.removed) {
        newInstructions.push(new Delete(index, change.value.length))
      } else {
        index += change.value.length
      }
      */
    })

    newInstructions.forEach((i) => {
      console.log(`applying local: ${i.toString()}`)
      i.applyTo(this.buffer)
    })
    newInstructions.forEach((instr) => {
      const msg: Message = {
        operation: instr,
        myMessagesCount: this.myMessagesCount,
        otherMessagesCount: this.otherMessagesCount,
        creatorId: this.actorId,
      }
      this.messageSubject.next(msg)
      this.outgoing.push(msg)
      this.myMessagesCount += 1
    })

    return newInstructions
  }

  public receive(message: Message) {
    // simulate network transmission - make sure this is not the same instance!
    this.incoming.push(cloneMessage(message))
  }
  public processReceived() {
    console.debug(
      this.label,
      `processReceived, ${this.incoming.length} waiting`
    )

    const received = this.incoming
    this.incoming = []

    received.forEach((msgReceived) => {
      console.debug(
        this.label,
        `processReceived, oper ${msgReceived.operation.toString()}`
      )
      const receivedMsgBeingProcessed = msgReceived
      // Discard acknowledged messages
      const index = this.outgoing.findIndex(
        (m) => m.myMessagesCount >= receivedMsgBeingProcessed.otherMessagesCount
      )
      this.outgoing.splice(0, index)
      if (
        receivedMsgBeingProcessed.myMessagesCount !== this.otherMessagesCount
      ) {
        throw new Error("wtf?")
      }

      this.outgoing.forEach((msgOutgoing) => {
        // Transform the new message and the oness in the queue
        const oper1 = receivedMsgBeingProcessed.operation
        const oper2 = msgOutgoing.operation

        const otherWins =
          receivedMsgBeingProcessed.creatorId > msgOutgoing.creatorId

        const ot = oper1.xform(oper2, otherWins)

        console.group(`xform at ${this.label}`)
        console.debug(`Input oper1: ${oper1.toString()}`)
        console.debug(`Input oper2: ${oper2.toString()}`)
        console.debug(`Transformed oper1: ${ot[0].toString()}`)
        console.debug(`Transformed oper2: ${ot[1].toString()}`)
        console.groupEnd()

        receivedMsgBeingProcessed.operation = ot[0]
        msgOutgoing.operation = ot[1]
      })
      console.log(
        `applying remote: ${receivedMsgBeingProcessed.operation.toString()}`
      )

      receivedMsgBeingProcessed.operation.applyTo(this.buffer)
      this.otherMessagesCount += 1
    })
  }

  public getText(): string {
    return this.buffer.getText()
  }

  public getMessageSubject(): Subject<Message> {
    return this.messageSubject
  }

  public dump() {
    console.group(`state of ${this.label}`)
    console.info(`incoming:`)
    console.table(this.incoming)
    console.info(`outgoing:`)
    console.table(this.outgoing)
    console.table(this.buffer.getText())
    console.groupEnd()
  }
}
