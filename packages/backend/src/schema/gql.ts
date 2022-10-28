export default `#graphql
type Book {
  title: String
  author: String
  date: String
}
type Hello {
  hello: String
}

type Query {
  books: [Book]
}
type Mutation {
  createBook(author: String, title: String): Book
}
`;
