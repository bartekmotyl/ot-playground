import './style.css'
import { Demo } from './demo/demo.ts'


let demo = new Demo()


document.querySelector<HTMLButtonElement>('#reset')!.onclick = () => {
  demo = new Demo()
}