export type PeriodoMensual = { anio: number; mes: number };

/**
 * Calcula los periodos pendientes de pago para un socio.
 * Solo recibe pagos con estado='aprobado' — los pendientes y rechazados NO se descuentan.
 */
export function calcularPeriodosPendientes(
  fechaInicio: string,
  pagosAprobados: { anio: number; mes: number }[]
): PeriodoMensual[] {
  const inicio = new Date(fechaInicio + "T00:00:00");
  const ahora = new Date();
  const periodos: PeriodoMensual[] = [];

  let anio = inicio.getFullYear();
  let mes = inicio.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;

  while (anio < anioActual || (anio === anioActual && mes <= mesActual)) {
    const yaPagado = pagosAprobados.some(
      (p) => p.anio === anio && p.mes === mes
    );
    if (!yaPagado) {
      periodos.push({ anio, mes });
    }
    mes++;
    if (mes > 12) {
      mes = 1;
      anio++;
    }
  }

  return periodos;
}

/**
 * Calcula la deuda total: periodos pendientes × tarifa.
 */
export function calcularDeudaTotal(
  periodosPendientes: PeriodoMensual[],
  tarifa: number
): number {
  return periodosPendientes.length * tarifa;
}
