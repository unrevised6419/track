import "tailwindcss/tailwind.css";
import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./app.component.tsx";
import { DataProvider } from "./data.provider.tsx";
import { CommandMenuProvider } from "./command-menu.provider.tsx";

const rootElement = document.getElementById("root");

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<React.StrictMode>
			<DataProvider>
				<CommandMenuProvider>
					<App />
				</CommandMenuProvider>
			</DataProvider>
			<Analytics />
		</React.StrictMode>,
	);
}
