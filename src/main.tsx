import "tailwindcss/tailwind.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { App } from "./App.tsx";
import { AppProvider } from "./AppProvider.tsx";

const rootElement = document.getElementById("root");

if (rootElement) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<React.StrictMode>
			<AppProvider>
				<App />
			</AppProvider>
			<Analytics />
		</React.StrictMode>,
	);
}
