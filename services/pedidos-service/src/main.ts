import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import Consul from 'consul';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = Number(process.env.PORT ?? 3003);
  await app.listen(port);

  // Registro en Consul (opcional: no debe impedir el arranque del servicio).
  const consulHost = process.env.CONSUL_HOST || 'localhost';
  try {
    const consulClient = new Consul({ host: consulHost, port: 8500 });
    consulClient.agent.service.register(
      {
        name: 'pedidos-service',
        address: 'pedidos-service',
        port,
        check: {
          http: `http://pedidos-service:${port}/health`,
          interval: '10s',
          timeout: '5s',
        },
      },
      (err) => {
        if (err) console.error('Error registrando en Consul:', String(err));
        else console.log('Pedidos Service registrado en Consul');
      },
    );
  } catch (error) {
    console.error('Error registrando en Consul:', String(error));
  }

  console.log(`Pedidos Service corriendo en puerto ${port}`);
}
bootstrap();
