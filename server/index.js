const { gql, ApolloServer } = require('apollo-server')

// `.current`, not `.dev`: see constants.js. This used to read the development port
// even when the process had been started with NODE_ENV=production.
const { port } = require('../constants').current.apollo

const typeDefs = gql`
  schema {
    query: Query
  }

  type Query {
    luckyNumber: String
  }
`;

const resolvers = {
  Query: {
    luckyNumber: () => `Your lucky number is ${Math.floor(Math.random() * 101)}`
  }
}

const isProduction = process.env.NODE_ENV === 'production'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // Was `cors: true`, which allows every origin. The only browser client here is the
  // static page served by http-client on its own port, so name it. Same-origin is not
  // an option: two ports means two origins, which is exactly why CORS is involved in a
  // demo this small.
  cors: {
    origin: require('../constants').current.http.url + ':' + require('../constants').current.http.port,
    credentials: false
  },
  // Playground and introspection are development affordances. apollo-server already
  // disables introspection when NODE_ENV is production; this makes the playground match
  // rather than relying on the reader to notice.
  playground: !isProduction,
  introspection: !isProduction,
  // Without this, an error response carries a full stack trace including absolute
  // filesystem paths whenever NODE_ENV is anything other than production, and `node
  // server/` with no NODE_ENV set is exactly that case.
  debug: !isProduction
});

server.listen({
  port: process.env.PORT || port
}).then(
  (serverInformation) =>
    console.log(
      'Apollo Server is running at', serverInformation.url,
      'in', process.env.NODE_ENV || 'dev (NODE_ENV was not set)'
    )
).catch((error) => {
  // Without this, a port already in use exits with an unhandled rejection warning and
  // no clue as to which port or why.
  console.error('Apollo Server failed to start:', error.message)
  process.exit(1)
})