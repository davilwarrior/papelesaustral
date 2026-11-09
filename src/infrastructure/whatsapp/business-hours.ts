/**
 * Horario de atención de los asesores (Ecuador, sin horario de verano).
 * Debe coincidir con contact.schedule de site-config.data.ts: lunes a viernes, 8h30 a 17h30.
 * No contempla feriados.
 */
const TIME_ZONE = "America/Guayaquil";
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

/** Cuándo abre de nuevo, en palabras ("hoy", "mañana" o el día de la semana). */
function nextOpening(day: number, minutes: number): string {
  if (OPEN_DAYS.has(day) && minutes < OPEN_MINUTES) return "hoy desde las 8h30";
  for (let offset = 1; offset <= 7; offset++) {
    const next = (day + offset) % 7;
    if (OPEN_DAYS.has(next)) {
      return `${offset === 1 ? "mañana" : `el ${DAY_NAMES[next]}`} desde las 8h30`;
    }
  }
  return "el próximo día hábil";
}

/** Línea para las instrucciones del bot: hora actual y si hay asesores atendiendo. */
export function describeBusinessHours(now: Date): string {
  const { day, minutes } = localParts(now);
  const open = OPEN_DAYS.has(day) && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES;
  const time = new Intl.DateTimeFormat("es-EC", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

  return open
    ? `# Ahora\nEn Ecuador es ${time}: estamos en horario de atención, un asesor puede responder pronto.`
    : `# Ahora\nEn Ecuador es ${time}: estamos fuera del horario de atención. Si pasas la conversación a un asesor, ` +
        `avisa con amabilidad que le responderá ${nextOpening(day, minutes)} (no prometas una hora exacta).`;
}
