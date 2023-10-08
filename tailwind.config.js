/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			container: {
				center: true,
				padding: "1rem",
			},
			colors: {
				jagaatrack: "#2EC0FF",
			},
		},
	},
	plugins: [],
};
