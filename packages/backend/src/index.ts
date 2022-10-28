import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { createServer } from 'http';
import Pusher from 'pusher';
import typeDefs from './schema/gql';

if (
	!process.env.PUSHER_APP_ID ||
	!process.env.PUSHER_KEY ||
	!process.env.PUSHER_SECRET ||
	!process.env.PUSHER_CLUSTER
) {
	throw new Error('Please set pusher environment variables');
}

const app = express();
const httpServer = createServer(app);

const books = [
	{
		title: 'The Awakening',
		author: 'Kate Chopin',
		date: '27 Oct 2022'
	},
	{
		title: 'City of Glass',
		author: 'Paul Auster',
		date: '27 Oct 2022 16:50'
	}
];

const resolvers = {
	Query: {
		books: () => books
	},
	Mutation: {
		createBook(_, args) {
			const pusher = new Pusher({
				appId: process.env.PUSHER_APP_ID,
				key: process.env.PUSHER_KEY,
				secret: process.env.PUSHER_SECRET,
				cluster: process.env.PUSHER_CLUSTER,
				useTLS: true
			});

			pusher.trigger('my-channel', 'my-event', args);
			return { ...args };
		}
	}
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
	schema,
	introspection: true,
	plugins: [
		ApolloServerPluginLandingPageLocalDefault({ footer: false }),
		ApolloServerPluginDrainHttpServer({ httpServer })
	]
});

server.start().then(() => {
	app.use('/', bodyParser.json(), expressMiddleware(server));
});

export default httpServer;
