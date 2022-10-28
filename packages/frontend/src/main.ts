import './app.css';
import App from './App.svelte';
if (!import.meta.env.VITE_API_URL) {
	throw new Error('Please define env var for API_URL');
}
const app = new App({
	target: document.getElementById('app')
});

export default app;
