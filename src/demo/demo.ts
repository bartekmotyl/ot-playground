import { State } from "../ot/state"

export class Demo {
  clientEditor: HTMLTextAreaElement
  serverEditor: HTMLTextAreaElement
  clientState = new State(123, "client")
  serverState = new State(124, "server")

  constructor() {
    document.querySelector<HTMLButtonElement>("#clientApply")!.onclick = () =>
      this.clientApply()
    document.querySelector<HTMLButtonElement>("#clientReceive")!.onclick = () =>
      this.clientReceive()
    document.querySelector<HTMLButtonElement>("#serverApply")!.onclick = () =>
      this.serverApply()
    document.querySelector<HTMLButtonElement>("#serverReceive")!.onclick = () =>
      this.serverReceive()
    this.clientEditor =
      document.querySelector<HTMLTextAreaElement>("#clientEditor")!
    this.serverEditor =
      document.querySelector<HTMLTextAreaElement>("#serverEditor")!
    this.clientEditor.value = ""
    this.serverEditor.value = ""

    this.clientState.getMessageSubject().subscribe({
      next: (msg) => this.serverState.receive(msg),
    })
    this.serverState.getMessageSubject().subscribe({
      next: (msg) => this.clientState.receive(msg),
    })
  }

  clientApply() {
    this.clientState.localUpdate(this.clientEditor.value)
  }
  clientReceive() {
    this.clientState.processReceived()
    this.clientEditor.value = this.clientState.getText()
    /*
        const instructions = this.clientState.getLocalInstructions()
        this.serverState.remoteUpdate(instructions)
        this.clientState.resetLocalInstructions()
        this.serverEditor.value = this.serverState.getText()
        */
  }
  serverApply() {
    this.serverState.localUpdate(this.serverEditor.value)
  }
  serverReceive() {
    this.serverState.processReceived()
    this.serverEditor.value = this.serverState.getText()
    /*
        const instructions = this.serverState.getLocalInstructions()
        this.clientState.remoteUpdate(instructions)
        this.serverState.resetLocalInstructions()
        this.clientEditor.value = this.clientState.getText()
        */
  }
}
