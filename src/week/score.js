import { asOfForDay } from "./timeline.js";

const WINDOW_DAYS = 14;
const WEIGHT = {
  balance_trend_down: 5,
  essential_spend_up: 6,
  payday_gap: 8,
  near_zero_balance: 9,
  overdraft_dip: 10,
  late_or_missed_payment_flag: 12,
  discretionary_cut: -4,
};
const REASON = {
  balance_trend_down:
    "The balance has been trending down, so the usual room before payday is getting thinner.",
  essential_spend_up:
    "Spending on food, energy, and housing is higher than the recent pattern.",
  payday_gap: "A bill is due before payday. The gap is already in view.",
  overdraft_dip: "The account dipped into overdraft. The buffer is gone.",
  near_zero_balance: "The balance came close to zero.",
  late_or_missed_payment_flag: "A recent payment looks late or missed.",
  discretionary_cut: "Everyday extras have already been cut back.",
};

export function scoreCustomer(customerId, signals, asOfDate) {
  const asOf = asOfDate.slice(0, 10);
  const inWindow = signals.filter(
    (signal) => signal.customerId === customerId && inScoringWindow(signal.timestamp, asOf),
  );
  const byType = new Map();
  let raw = 0;
  for (const signal of inWindow) {
    const severity = signal.severity >= 3 ? 3 : signal.severity <= 1 ? 1 : 2;
    const points = WEIGHT[signal.type] * severity;
    raw += points;
    const prev = byType.get(signal.type) ?? { points: 0 };
    prev.points += points;
    byType.set(signal.type, prev);
  }
  const score = Math.min(100, Math.max(0, Math.round(raw)));
  const level = score >= 55 ? "stress" : score >= 28 ? "watch" : "ok";
  const present = new Set(byType.keys());
  return {
    customerId,
    asOf,
    level,
    score,
    topReasons: topReasons(byType),
    recommendedActionId: recommend(level, score, present),
    overdraft: present.has("overdraft_dip"),
    latePayment: present.has("late_or_missed_payment_flag"),
  };
}

export function scoreDay(customerId, signals, day) {
  return scoreCustomer(customerId, signals, asOfForDay(day));
}

function topReasons(byType) {
  const ranked = [...byType.entries()].sort((a, b) => b[1].points - a[1].points);
  const reasons = ranked
    .filter(([, agg]) => agg.points > 0)
    .slice(0, 3)
    .map(([type]) => REASON[type]);
  const coping = byType.get("discretionary_cut");
  if (coping && coping.points < 0) reasons.push(REASON.discretionary_cut);
  if (reasons.length < 2) {
    reasons.push("Nothing in the last two weeks is clustering into a cash crunch.");
  }
  return reasons.slice(0, 4);
}

function recommend(level, score, types) {
  if (level === "ok") return "none";
  const acute =
    types.has("overdraft_dip") || types.has("late_or_missed_payment_flag") || score >= 80;
  if (level === "stress" && acute) return "talk_to_advisor";
  if (types.has("payday_gap") || types.has("late_or_missed_payment_flag")) return "payment_plan";
  return "buffer";
}

function inScoringWindow(timestamp, asOfDay) {
  const day = utcDayNumber(timestamp);
  const asOf = utcDayNumber(asOfDay);
  return day >= asOf - (WINDOW_DAYS - 1) && day <= asOf;
}

function utcDayNumber(iso) {
  const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00.000Z` : iso);
  return Math.floor(parsed.getTime() / 86_400_000);
}
