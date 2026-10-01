#!/usr/bin/env node
/**
 * Espera a que todo el stack de microservicios esté healthy.
 * Uso: node scripts/wait-for-stack.mjs [timeoutSegundos]
 */
const timeoutSegundos = Number(process.argv[2] ?? 300);
const inicio = Date.now();

const objetivos = [
  { nombre: 'gateway', url: 'http://localhost:3000/health' },
  { nombre: 'usuarios-service', url: 'http://localhost:3001/actuator/health' },
  { nombre: 'ordenes-service', url: 'http://localhost:3002/actuator/health' },
  { nombre: 'pedidos-service', url: 'http://localhost:3003/health' },
  { nombre: 'pagos-service', url: 'http://localhost:3004/health' },
];

async function estaListo(url) {
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return respuesta.ok;
  } catch {
    return false;
  }
}

const pendientes = new Set(objetivos.map((o) => o.nombre));

while (Date.now() - inicio < timeoutSegundos * 1000) {
  for (const objetivo of objetivos) {
    if (!pendientes.has(objetivo.nombre)) continue;
    if (await estaListo(objetivo.url)) {
      pendientes.delete(objetivo.nombre);
      console.log(`[stack] listo: ${objetivo.nombre}`);
    }
  }
  if (pendientes.size === 0) {
    console.log('[stack] todos los servicios están listos.');
    process.exit(0);
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

console.error(`[stack] tiempo de espera agotado. Pendientes: ${[...pendientes].join(', ')}`);
process.exit(1);
