import './app.css';
import App from './App.svelte';
console.log(import.meta.env.VITE_API_URL);
const app = new App({
	target: document.getElementById('app')
});

export default app;
