import { render } from "preact";
import './index.css'
import { TextBlock, TextBlockProps } from "./simulator/TextBlock";
import { Change } from "./ot/instructions";
import { SimpleBuffer, Buffer } from "./ot/buffer";
import { useState } from 'preact/hooks';
import { ChangeConfig } from "./simulator/ChangeConfig";

function calcTextBlockProps(text: string, change: Change): TextBlockProps {
	
	return {
		prefix: text.substring(0, change.index),
		added: change.text,
		removed: text.substring(change.index, change.index + change.remove),
		suffix: text.substring(change.index + change.remove),		
	}
}

function App() {
	const [ initialState, updateInitialState ] = useState('ABCDEFGHIJKLMNOP')

	const [ changePrimary1Index, setChangePrimary1Index ] = useState(1)
	const [ changePrimary1Remove, setChangePrimary1Remove ] = useState(5)
	const [ changePrimary1Add, setChangePrimary1Add ] = useState('xy')

	const [ changeSecondary1Index, setChangeSecondary1Index ] = useState(2)
	const [ changeSecondary1Remove, setChangeSecondary1Remove ] = useState(8)
	const [ changeSecondary1Add, setChangeSecondary1Add ] = useState('st')


	//const initialState = 'ABCDEFGHIJKLMNOP'
	
	const bufferPrimary = new SimpleBuffer()
	bufferPrimary.insert(0, initialState)

	const bufferSecondary = new SimpleBuffer()
	bufferSecondary.insert(0, initialState)


	const changePrimary1 = new Change(changePrimary1Index, changePrimary1Remove, changePrimary1Add)
	const primaryText0 = bufferPrimary.getText()
	const propsPrimary1 = calcTextBlockProps(bufferPrimary.getText(), changePrimary1)
	changePrimary1.applyTo(bufferPrimary)
	const primaryText1 = bufferPrimary.getText()
	
	const changeSecondary1 = new Change(changeSecondary1Index, changeSecondary1Remove, changeSecondary1Add)
	const secondaryText0 = bufferSecondary.getText()
	const propsSecondary1 = calcTextBlockProps(bufferSecondary.getText(), changeSecondary1)
	changeSecondary1.applyTo(bufferSecondary)
	const secondaryText1 = bufferSecondary.getText()

	return (
		<div>
			<label class="m-1">Initial</label><input class="border-solid border-2 m-1 font-mono" type="text" id="initialText" value={initialState} onInput={e => updateInitialState((e.target as HTMLInputElement).value)}/>
			<h1 class="text-4xl">Primary</h1>
			<div class="font-mono">{primaryText0}</div>
			<ChangeConfig 
				index={changePrimary1Index} 
				setIndex={setChangePrimary1Index}
				remove={changePrimary1Remove}
				setRemove={setChangePrimary1Remove}
				add={changePrimary1Add}
				setAdd={setChangePrimary1Add}
				/>
			<div class="font-mono">{changePrimary1.toString()}</div>
			<TextBlock {...propsPrimary1} />
			<div class="font-mono">{primaryText1}</div>
			
			<h1 class="text-4xl">Secondary</h1>
			<div class="font-mono">{secondaryText0}</div>
			<ChangeConfig 
				index={changeSecondary1Index} 
				setIndex={setChangeSecondary1Index}
				remove={changeSecondary1Remove}
				setRemove={setChangeSecondary1Remove}
				add={changeSecondary1Add}
				setAdd={setChangeSecondary1Add}
				/>
			<div class="font-mono">{changeSecondary1.toString()}</div>
			<TextBlock {...propsSecondary1} />
			<div class="font-mono">{secondaryText1}</div>
		</div>
	)
}

render(<App />, document.getElementById("app")!);