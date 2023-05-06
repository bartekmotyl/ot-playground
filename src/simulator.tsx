import { render } from "preact";
import './index.css'
import { TextBlock, TextBlockProps } from "./simulator/TextBlock";



function App() {

	const initialState = ''
	 
	const length = 20

	const propsPrimary: TextBlockProps = {
		label: 'P',
		prefix: 2,
		added: 2,
		removed: 5,
		suffix: ,
	} 
	
	return (
		<div>
			<h3>Primary</h3>
			<TextBlock {...propsPrimary} />
			<h3>Secondary</h3>
			<TextBlock prefix={3} added={3} removed={1} suffix={6} label={'S'}/>
		</div>
	)
}

render(<App />, document.getElementById("app")!);