import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import express from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

async function bootstrap() {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const server = new ApolloServer({ schema });
  await server.start();

  const app = express();
  app.use(express.json());
  app.get('/', (_req, res) => {
    res.type('text/plain').send('Hello World!');
  });
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway', timestamp: new Date().toISOString() });
  });
  app.use('/graphql', expressMiddleware(server));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Gateway corriendo en http://localhost:${port}/graphql`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
