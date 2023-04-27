import "./TextBlock.css"
import { range } from "lodash"
type TextBlockProps = {
  prefix: number,
  removed: number,
  added: number, 
  suffix: number,
}

export function TextBlock(props: TextBlockProps) {
  const letter = (i: number) => String.fromCharCode('A'.charCodeAt(0) + i)

  return (
    <div class="flex">
       {range(props.prefix).map(i => (
        <CharacterBlock content={letter(i)} color={0}/>
       ))}
       <div class="flex flex-col">
         <div class="flex">
         {range(props.removed).map(i => (
            <CharacterBlock content={letter(props.prefix+i)} color={2}/>
          ))}
         </div>
         <div class="flex">
         {range(props.added).map(i => (
            <CharacterBlock content={i.toString()} color={1}/>
          ))}
         </div>
       </div>
       {range(props.suffix).map(i => (
        <CharacterBlock content={letter(props.prefix + props.removed + i)} color={0}/>
       ))}       
    </div>
  )
}

type CharacterBlockProps = {
  content: string,
  color: number,
}


function CharacterBlock(props: CharacterBlockProps) {
  let classes = "w-6 h-8 m-0.5 align-middle text-center border-solid border-2 "
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

