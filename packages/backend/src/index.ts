import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bodyParser from 'body-parser';
import express from 'express';
import { createServer } from 'http';
import typeDefs from './schema/gql';
import { queryResolvers, mutationResolvers } from './resolvers';
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

const resolvers = {
	Query: queryResolvers,
	Mutation: mutationResolvers
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
