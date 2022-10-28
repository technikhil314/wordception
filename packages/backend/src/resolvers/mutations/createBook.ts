import Pusher from 'pusher';

export default function createBook(_, args) {
	console.log({
		appId: process.env.PUSHER_APP_ID,
		key: process.env.PUSHER_KEY,
		secret: process.env.PUSHER_SECRET,
		cluster: process.env.PUSHER_CLUSTER,
		useTLS: true
	});
	console.log({ args });
	const pusher = new Pusher({
		appId: process.env.PUSHER_APP_ID,
		key: process.env.PUSHER_KEY,
		secret: process.env.PUSHER_SECRET,
		cluster: process.env.PUSHER_CLUSTER,
		useTLS: true
	});

	pusher.trigger('my-channel', 'my-event', 'demo');
	return { ...args };
}
