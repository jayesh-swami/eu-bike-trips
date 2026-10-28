import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

// '/graphql' is proxied to the backend by Vite (see vite.config.ts).
export const client = new ApolloClient({
  link: new HttpLink({ uri: '/graphql' }),
  cache: new InMemoryCache(),
})
