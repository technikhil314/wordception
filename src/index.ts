import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import bodyParser from "body-parser";
import express from "express";
import { createServer } from "http";
import path from "path";
const app = express();
const httpServer = createServer(app);

const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin",
  },
  {
    title: "City of Glass",
    author: "Paul Auster",
  },
];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const typeDefs = mergeTypeDefs([
  ...loadFilesSync(path.join(__dirname, "./**/*.graphql")),
]);

const resolvers = {
  Query: {
    books: () => books,
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  schema,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests

server.start().then(() => {
  app.use("/graphql", bodyParser.json(), expressMiddleware(server));
  const PORT = 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
});
