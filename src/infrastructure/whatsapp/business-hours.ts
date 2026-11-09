/**
 * Horario de atención de los asesores (Ecuador, sin horario de verano).
 * Debe coincidir con contact.schedule de site-config.data.ts: lunes a viernes, 8h30 a 17h30.
 */
const TIME_ZONE = "America/Guayaquil";

/**
 * Días de descanso obligatorio en Ecuador, ya con los traslados oficiales.
 * Fuente: calendario del Viceministerio de Turismo (Primicias y Vistazo, nov. 2026).
 * Actualizar cada año. Para agregar días (feriados locales de Cuenca, vacaciones),
 * usa la variable BUSINESS_EXTRA_HOLIDAYS="2027-04-12,2027-12-24".
 */
const NATIONAL_HOLIDAYS = new Set([
  "2026-12-25", // Navidad
  "2027-01-01", // Año Nuevo
  "2027-02-08", // Carnaval
  "2027-02-09", // Carnaval
  "2027-03-26", // Viernes Santo
  "2027-04-30", // Día del Trabajo (trasladado del sábado 1 de mayo)
  "2027-05-24", // Batalla del Pichincha
  "2027-08-09", // Primer Grito de Independencia (trasladado del 10 de agosto)
  "2027-10-08", // Independencia de Guayaquil (trasladado del 9 de octubre)
  "2027-11-01", // Día de los Difuntos (trasladado del 2 de noviembre)
  "2027-11-02", // Independencia de Cuenca (trasladado del 3 de noviembre)
  "2027-12-25", // Navidad (sábado, sin traslado)
]);

function isHoliday(isoDate: string): boolean {
  const extra = (process.env.BUSINESS_EXTRA_HOLIDAYS ?? "").split(",").map((d) => d.trim());
  return NATIONAL_HOLIDAYS.has(isoDate) || extra.includes(isoDate);
}

/** Fecha local (YYYY-MM-DD) en Ecuador, desplazada `offsetDays` días. */
function localIsoDate(date: Date, offsetDays = 0): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(
    new Date(date.getTime() + offsetDays * 86_400_000),
  );
}
const OPEN_DAYS = new Set([1, 2, 3, 4, 5]);
const OPEN_MINUTES = 8 * 60 + 30;
const CLOSE_MINUTES = 17 * 60 + 30;
const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function localParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Día laborable: de lunes a viernes y no feriado. */
function isWorkday(now: Date, offsetDays: number): boolean {
  const { day } = localParts(new Date(now.getTime() + offsetDays * 86_400_000));
  return OPEN_DAYS.has(day) && !isHoliday(localIsoDate(now, offsetDays));
}

/** Cuándo abre de nuevo, en palabras ("hoy", "mañana" o el día de la semana). */
function nextOpening(now: Date, minutes: number): string {
  if (isWorkday(now, 0) && minutes < OPEN_MINUTES) return "hoy desde las 8h30";
  for (let offset = 1; offset <= 14; offset++) {
    if (isWorkday(now, offset)) {
      const { day } = localParts(new Date(now.getTime() + offset * 86_400_000));
      return `${offset === 1 ? "mañana" : `el ${DAY_NAMES[day]}`} desde las 8h30`;
    }
  }
  return "el próximo día hábil";
}

/** Si en este momento hay asesores atendiendo. */
export function isBusinessOpen(now: Date): boolean {
  const { minutes } = localParts(now);
  return isWorkday(now, 0) && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
}

/** Línea para las instrucciones del bot: hora actual y si hay asesores atendiendo. */
export function describeBusinessHours(now: Date): string {
  const { minutes } = localParts(now);
  const time = new Intl.DateTimeFormat("es-EC", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const holiday = isHoliday(localIsoDate(now)) ? " (hoy es feriado)" : "";

  return isBusinessOpen(now)
    ? `# Ahora
En Ecuador es ${time}: estamos en horario de atención, un asesor puede responder pronto.`
    : `# Ahora
En Ecuador es ${time}${holiday}: estamos fuera del horario de atención. Si pasas la conversación a un asesor, ` +
        `avisa con amabilidad que le responderá ${nextOpening(now, minutes)} (no prometas una hora exacta).`;
}
