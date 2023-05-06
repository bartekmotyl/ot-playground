import "./TextBlock.css"

export type ChangeConfigProps = {
  index: number,
  setIndex: (value: number) => void,
  remove: number,
  setRemove: (value: number) => void,
  add: string,
  setAdd: (value: string) => void,
}

export function ChangeConfig(props: ChangeConfigProps) {

  return (
    <div class="flex">
      <label class="m-1">Index</label><input class="border-solid border-2 m-1" type="number" value={props.index} onInput={e => props.setIndex(parseInt((e.target as HTMLInputElement).value))}/>
      <label class="m-1">Remove</label><input  class="border-solid border-2 m-1" type="number" value={props.remove} onInput={e => props.setRemove(parseInt((e.target as HTMLInputElement).value))}/>
      <label class="m-1">Add</label><input  class="border-solid border-2 m-1 font-mono" type="text" value={props.add} onInput={e => props.setAdd((e.target as HTMLInputElement).value)}/>
    </div>
  )
}
