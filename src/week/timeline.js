export const REPLAY_START = "2026-03-07";
export const REPLAY_DAYS = 14;

export function asOfForDay(day) {
  const start = new Date(`${REPLAY_START}T00:00:00.000Z`);
  start.setUTCDate(start.getUTCDate() + day);
  return start.toISOString().slice(0, 10);
}

export function formatDay(iso) {
  const date = new Date(`${iso}T00:00:00.000Z`);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
