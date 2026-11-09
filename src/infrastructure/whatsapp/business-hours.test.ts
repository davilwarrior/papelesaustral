import { afterEach, describe, expect, it } from "vitest";
import { describeBusinessHours, isBusinessOpen } from "./business-hours";

// Ecuador es UTC-5 todo el año: 12:00 en Cuenca = 17:00 UTC.
const ecuador = (isoLocal: string) => new Date(`${isoLocal}-05:00`);

afterEach(() => {
  delete process.env.BUSINESS_EXTRA_HOLIDAYS;
});

describe("horario de atención", () => {
  it("abre de lunes a viernes de 8h30 a 17h30", () => {
    expect(isBusinessOpen(ecuador("2026-11-09T08:29"))).toBe(false);
    expect(isBusinessOpen(ecuador("2026-11-09T08:30"))).toBe(true);
    expect(isBusinessOpen(ecuador("2026-11-09T17:29"))).toBe(true);
    expect(isBusinessOpen(ecuador("2026-11-09T17:30"))).toBe(false);
    expect(isBusinessOpen(ecuador("2026-11-14T10:00"))).toBe(false); // sábado
  });

  it("dice cuándo responde el asesor fuera de horario", () => {
    expect(describeBusinessHours(ecuador("2026-11-10T07:00"))).toContain("hoy desde las 8h30");
    expect(describeBusinessHours(ecuador("2026-11-09T18:00"))).toContain("mañana desde las 8h30");
    expect(describeBusinessHours(ecuador("2026-11-13T18:00"))).toContain("el lunes desde las 8h30");
  });

  it("no atiende en feriados y salta al siguiente día hábil", () => {
    expect(isBusinessOpen(ecuador("2026-12-25T10:00"))).toBe(false); // Navidad, viernes
    const text = describeBusinessHours(ecuador("2026-12-24T18:00"));
    expect(text).toContain("el lunes desde las 8h30");
    expect(describeBusinessHours(ecuador("2026-12-25T10:00"))).toContain("hoy es feriado");
    // Carnaval 2027: lunes 8 y martes 9 de febrero
    expect(describeBusinessHours(ecuador("2027-02-05T18:00"))).toContain("el miércoles desde las 8h30");
  });

  it("acepta feriados extra por variable de entorno", () => {
    process.env.BUSINESS_EXTRA_HOLIDAYS = "2026-11-10";
    expect(isBusinessOpen(ecuador("2026-11-10T10:00"))).toBe(false);
    expect(describeBusinessHours(ecuador("2026-11-09T18:00"))).toContain("el miércoles desde las 8h30");
  });
});
