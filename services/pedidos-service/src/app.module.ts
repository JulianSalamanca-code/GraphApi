import { mkdirSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidosModule } from './pedidos.module';
import { Pedido } from './pedidos.model';
import { HealthController } from './health.controller';

// DB_PATH es el directorio de datos (volumen en Docker). El fichero SQLite se
// construye a partir de él para no confundir directorio con fichero.
const dbDir = process.env.DB_PATH || './data';
mkdirSync(dbDir, { recursive: true });

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: `${dbDir}/pedidos.db`,
      entities: [Pedido],
      synchronize: true,
    }),
    PedidosModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
