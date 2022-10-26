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
import { WebSocketServer } from 'ws';
import Pusher from 'pusher';
import someFunc from './demo';
const app = express();
const httpServer = createServer(app);

const books = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

// const file = loadFilesSync(path.join(__dirname, "./**/*.graphql"));
// console.log({ file });
// // Resolvers define how to fetch the types defined in your schema.
// // This resolver retrieves books from the "books" array above.
// const typeDefs = mergeTypeDefs([...file]);

const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
  }

  type Mutation {
    createBook(author: String, title: String): Book
  }

  type Hello {
    hello: String
  }

  type Subscription {
    bookCreated: Book
    hello: Hello
  }
  subscription BookFeed {
    bookCreated {
      author
      title
    }
  }
`;

const pubsub = new PubSub();

const resolvers = {
  Query: {
    books: () => books,
  },
  Subscription: {
    hello: {
      // Example using an async generator
      subscribe: async function* () {
        for await (const word of ['Hello', 'Bonjour', 'Ciao']) {
          yield { hello: word };
        }
      },
    },
    bookCreated: {
      // More on pubsub below
      subscribe: () => pubsub.asyncIterator(['BOOK_CREATED']),
    },
  },
  Mutation: {
    createBook(_, args) {
      console.log(someFunc());
      pubsub.publish('BOOK_CREATED', { bookCreated: args });
      const pusher = new Pusher({
        appId: '1497541',
        key: '98c43f24ae31d3ccb385',
        secret: '4c3a0856625ba1989fc2',
        cluster: 'ap2',
        useTLS: true,
      });

      pusher.trigger('my-channel', 'my-event', args);
      // Datastore logic lives in postController
      return { ...args };
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/',
});
const serverCleanup = useServer(
  {
    schema,
    onConnect: async (ctx) => {
      console.log('Connected!');
    },
    onDisconnect(ctx, code, reason) {
      console.log(`Disconnected! ${reason} ${code}`);
    },
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
          },
        };
      },
    },
  ],
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests

server.start().then(() => {
  app.use('/', bodyParser.json(), expressMiddleware(server));
  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
});
