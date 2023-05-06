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

	const [ changePrimaryIndex, setChangePrimaryIndex ] = useState(3)
	const [ changePrimaryRemove, setChangePrimaryRemove ] = useState(5)
	const [ changePrimaryAdd, setChangePrimaryAdd ] = useState('xy')

	const [ changeSecondaryIndex, setChangeSecondaryIndex ] = useState(1)
	const [ changeSecondaryRemove, setChangeSecondaryRemove ] = useState(9)
	const [ changeSecondaryAdd, setChangeSecondaryAdd ] = useState('st')


	//const initialState = 'ABCDEFGHIJKLMNOP'
	
	const bufferPrimary = new SimpleBuffer()
	bufferPrimary.insert(0, initialState)

	const bufferSecondary = new SimpleBuffer()
	bufferSecondary.insert(0, initialState)


	const changePrimary = new Change(changePrimaryIndex, changePrimaryRemove, changePrimaryAdd)
	const primaryText0 = bufferPrimary.getText()
	const propsPrimary1 = calcTextBlockProps(bufferPrimary.getText(), changePrimary)
	changePrimary.applyTo(bufferPrimary)
	const primaryText1 = bufferPrimary.getText()
	
	const changeSecondary = new Change(changeSecondaryIndex, changeSecondaryRemove, changeSecondaryAdd)
	const secondaryText0 = bufferSecondary.getText()
	const propsSecondary1 = calcTextBlockProps(bufferSecondary.getText(), changeSecondary)
	changeSecondary.applyTo(bufferSecondary)
	const secondaryText1 = bufferSecondary.getText()

	const xformOfChangePrimary = changePrimary.xform(changeSecondary, true)
	const xformOfChangeSecondary = changeSecondary.xform(changePrimary, false)

	xformOfChangePrimary[1].applyTo(bufferPrimary)

	xformOfChangeSecondary[1].applyTo(bufferSecondary)
	const primaryText2 = bufferPrimary.getText()
	const secondaryText2 = bufferSecondary.getText()
	return (
		<div>
			<label class="m-1">Initial</label><input class="border-solid border-2 m-1 font-mono" type="text" id="initialText" value={initialState} onInput={e => updateInitialState((e.target as HTMLInputElement).value)}/>
			<h1 class="text-4xl">Primary</h1>
			<div class="font-mono">{primaryText0}</div>
			<ChangeConfig 
				index={changePrimaryIndex} 
				setIndex={setChangePrimaryIndex}
				remove={changePrimaryRemove}
				setRemove={setChangePrimaryRemove}
				add={changePrimaryAdd}
				setAdd={setChangePrimaryAdd}
				/>
			<div class="font-mono">{changePrimary.toString()}</div>
			<TextBlock {...propsPrimary1} />
			<div class="font-mono">{primaryText1}</div>
			<div class="font-mono">Result (after applied transformed secondary change): {primaryText2}</div>

			<h1 class="text-4xl">Secondary</h1>
			<div class="font-mono">{secondaryText0}</div>
			<ChangeConfig 
				index={changeSecondaryIndex} 
				setIndex={setChangeSecondaryIndex}
				remove={changeSecondaryRemove}
				setRemove={setChangeSecondaryRemove}
				add={changeSecondaryAdd}
				setAdd={setChangeSecondaryAdd}
				/>
			<div class="font-mono">{changeSecondary.toString()}</div>
			<TextBlock {...propsSecondary1} />
			<div class="font-mono">{secondaryText1}</div>
			<div class="font-mono">Result (after applied transformed primary change): {secondaryText2}</div>

			<p>
				<div> 
					{ secondaryText2 === primaryText2  && 
						<div class="bg-green-500">PASS</div>
					} 
					{ secondaryText2 !== primaryText2  && 
						<div class="bg-rose-500">FAIL</div>
					}
				</div>
			</p>
		</div>
	)
}

render(<App />, document.getElementById("app")!);