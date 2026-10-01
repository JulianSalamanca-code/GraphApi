import { GraphQLError } from 'graphql';

export interface ServiceEndpoints {
  usuarios: string;
  ordenes: string;
  pedidos: string;
  pagos: string;
}

export const endpoints: ServiceEndpoints = {
  usuarios:
    process.env.USUARIOS_URL || 'http://usuarios-service:3001/graphql',
  ordenes: process.env.ORDENES_URL || 'http://ordenes-service:3002/graphql',
  pedidos: process.env.PEDIDOS_URL || 'http://pedidos-service:3003/graphql',
  pagos: process.env.PAGOS_URL || 'http://pagos-service:3004/graphql',
};

export type ServiceName = keyof ServiceEndpoints;

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: Array<{ message: string }>;
}

/**
 * Ejecuta una operación GraphQL contra uno de los microservicios y devuelve
 * el objeto `data` o lanza un GraphQLError con el primer mensaje de error.
 */
export async function callService<T>(
  service: ServiceName,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  let response: globalThis.Response;
  try {
    response = await fetch(endpoints[service], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch (error) {
    throw new GraphQLError(
      `Servicio ${service} no disponible: ${(error as Error).message}`,
    );
  }

  if (!response.ok) {
    throw new GraphQLError(
      `Servicio ${service} respondió con HTTP ${response.status}`,
    );
  }

  const body = (await response.json()) as GraphQLResponse<T>;
  if (body.errors && body.errors.length > 0) {
    throw new GraphQLError(body.errors[0].message);
  }
  return body.data as T;
}
