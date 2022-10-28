import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { PubSub } from 'graphql-subscriptions';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import Pusher from 'pusher';
import { WebSocketServer } from 'ws';
import typeDefs from './schema/gql';

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

const pubsub = new PubSub();

const resolvers = {
	Query: {
		books: () => books
	},
	Subscription: {
		hello: {
			// Example using an async generator
			subscribe: async function* () {
				for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
					yield { hello: word };
				}
			}
		},
		bookCreated: {
			// More on pubsub below
			subscribe: () => pubsub.asyncIterator(['BOOK_CREATED'])
		}
	},
	Mutation: {
		createBook(_, args) {
			pubsub.publish('BOOK_CREATED', { bookCreated: args });
			const pusher = new Pusher({
				appId: '1497541',
				key: '98c43f24ae31d3ccb385',
				secret: '4c3a0856625ba1989fc2',
				cluster: 'ap2',
				useTLS: true
			});

			pusher.trigger('my-channel', 'my-event', args);
			// Datastore logic lives in postController
			return { ...args };
		}
	}
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
	server: httpServer,
	path: '/'
});
const serverCleanup = useServer(
	{
		schema,
		onConnect: async () => {
			console.log('Connected!');
		},
		onDisconnect(_, code, reason) {
			console.log(`Disconnected! ${reason} ${code}`);
		}
	},
	wsServer
);

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
	schema,
	introspection: true,
	plugins: [
		ApolloServerPluginLandingPageLocalDefault({ footer: false }),
		ApolloServerPluginDrainHttpServer({ httpServer }),

		// Proper shutdown for the WebSocket server.
		{
			async serverWillStart() {
				return {
					async drainServer() {
						await serverCleanup.dispose();
					}
				};
			}
		}
	]
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
server.start().then(() => {
	app.use('/', bodyParser.json(), expressMiddleware(server));
});

export default httpServer;
