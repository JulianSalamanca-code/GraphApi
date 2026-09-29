import express from 'express';
import { graphql, buildASTSchema, validateSchema, execute } from 'graphql';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from './resolvers';
import gql from 'graphql-tag';

const typeDefs = gql(readFileSync(join(__dirname, 'schema.graphql'), 'utf-8'));
const schema = buildASTSchema(typeDefs);

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.use('/graphql', async (req, res) => {
    const { query, variables, operationName } = req.body;
    const result = await execute({
      schema,
      document: typeDefs.definitions.find((d: any) => d.kind === 'OperationDefinition') as any,
      rootValue: resolvers.Query,
      variableValues: variables,
      operationName,
    });
    res.json(result);
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Gateway corriendo en http://localhost:${port}/graphql`);
  });
}

bootstrap().catch(console.error);
