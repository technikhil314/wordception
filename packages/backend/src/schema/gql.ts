export default `#graphql

type Book {
  title: String
  author: String
  date: String
}
type Hello {
  hello: String
}

subscription BookFeed {
  bookCreated {
    author
    title
  }
}

type Subscription {
  bookCreated: Book
  hello: Hello
}
type Query {
  books: [Book]
}
type Mutation {
  createBook(author: String, title: String): Book
}
`;
