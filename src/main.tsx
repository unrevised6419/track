import "tailwindcss/tailwind.css";
import "./styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./App.tsx";
import { DataProvider } from "./DataProvider.tsx";
import { CommandMenuProvider } from "./CommandMenuProvider.tsx";

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
