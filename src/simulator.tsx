import { render } from "preact";
import './index.css'
import { TextBlock } from "./simulator/TextBlock";
function App() {
	return (
		<div>
			<div class="text-3xl font-bold underline">Hello from Preact</div>
			<TextBlock prefix={4} added={3} removed={2} suffix={6} />
		</div>
	)
}

render(<App />, document.getElementById("app")!);