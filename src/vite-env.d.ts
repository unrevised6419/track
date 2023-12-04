/// <reference types="vite/client" />

declare module "use-sound" {
	export function useSound(src: string): [() => void];
}
