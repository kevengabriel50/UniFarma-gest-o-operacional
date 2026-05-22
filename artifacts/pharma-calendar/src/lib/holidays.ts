function easterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface Holiday {
  title: string;
  date: string;
}

export function getBrazilianHolidays(year: number): Holiday[] {
  const easter = easterDate(year);

  const fixed: Holiday[] = [
    { title: "Confraternização Universal", date: `${year}-01-01` },
    { title: "Tiradentes", date: `${year}-04-21` },
    { title: "Dia do Trabalhador", date: `${year}-05-01` },
    { title: "Independência do Brasil", date: `${year}-09-07` },
    { title: "Nossa Senhora Aparecida", date: `${year}-10-12` },
    { title: "Finados", date: `${year}-11-02` },
    { title: "Proclamação da República", date: `${year}-11-15` },
    { title: "Natal", date: `${year}-12-25` },
  ];

  const variable: Holiday[] = [
    { title: "Carnaval", date: toDateStr(addDays(easter, -48)) },
    { title: "Carnaval", date: toDateStr(addDays(easter, -47)) },
    { title: "Sexta-feira Santa", date: toDateStr(addDays(easter, -2)) },
    { title: "Páscoa", date: toDateStr(easter) },
    { title: "Corpus Christi", date: toDateStr(addDays(easter, 60)) },
  ];

  return [...fixed, ...variable].sort((a, b) => a.date.localeCompare(b.date));
}

export function getHolidaysForYears(years: number[]): Holiday[] {
  return years.flatMap(getBrazilianHolidays);
}

export function mapHolidayToFullCalendar(holiday: Holiday) {
  return {
    id: `holiday-${holiday.date}-${holiday.title}`,
    title: holiday.title,
    start: holiday.date,
    allDay: true,
    display: "background",
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    classNames: ["holiday-event"],
    extendedProps: { isHoliday: true },
  };
}

export function mapHolidayToLabelEvent(holiday: Holiday) {
  return {
    id: `holiday-label-${holiday.date}-${holiday.title}`,
    title: `Feriado: ${holiday.title}`,
    start: holiday.date,
    allDay: true,
    display: "list-item",
    backgroundColor: "#EF4444",
    borderColor: "#DC2626",
    textColor: "#ffffff",
    classNames: ["holiday-label"],
    extendedProps: { isHoliday: true },
    interactive: false,
  };
}
