import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';

async function bootstrap() {
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: [
        { name: 'usuarios', url: 'http://usuarios-service:3001/graphql' },
        { name: 'ordenes', url: 'http://ordenes-service:3002/graphql' },
        { name: 'pedidos', url: 'http://pedidos-service:3003/graphql' },
        { name: 'pagos', url: 'http://pagos-service:3004/graphql' },
      ],
    }),
  });

  const server = new ApolloServer({ gateway });
  await server.start();

  const app = express();
  app.use('/graphql', expressMiddleware(server));

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Gateway corriendo en http://localhost:${port}/graphql`);
  });
}

bootstrap().catch(console.error);
