import "./TextBlock.css"
import { range } from "lodash"
export type TextBlockProps = {
  prefix: string,
  removed: string,
  added: string, 
  suffix: string,
}

export function TextBlock(props: TextBlockProps) {

  return (
    <div class="flex">
       {Array.from(props.prefix).map(c => (
        <CharacterBlock content={c} color={0}/>
       ))}
       <div class="flex flex-col">
         <div class="flex">
         {Array.from(props.removed).map(c => (
            <CharacterBlock content={c} color={2}/>
          ))}
         </div>
         <div class="flex">
         {Array.from(props.added).map(c => (
            <CharacterBlock content={c} color={1}/>
          ))}
         </div>
       </div>
       {Array.from(props.suffix).map(c => (
        <CharacterBlock content={c} color={0}/>
       ))}       
    </div>
  )
}

type CharacterBlockProps = {
  content: string,
  color: number,
}


function CharacterBlock(props: CharacterBlockProps) {
  let classes = "w-7 h-8 m-0.5 align-middle text-center border-solid border-2 "
  if (props.color === 0) {
    classes += "bg-cyan-300 border-indigo-600"
  } else if (props.color === 1) {
    classes += "bg-emerald-300 border-emerald-600"
  } else if (props.color === 2) {
    classes += "bg-red-300 border-red-600"
  }

  return (
    <div class="" 
    className={classes}>{props.content}</div>
  )
}

