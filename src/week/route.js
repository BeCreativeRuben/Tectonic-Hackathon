export function routeNextStep({ level, score, overdraft, latePayment, slotBooked }) {
  if (slotBooked) return "book_advisor";
  if (level === "stress" && (overdraft || latePayment || score >= 90)) return "human_now";
  if (level === "stress") return "proactive_voice";
  return "card_only";
}

export const ROUTE_LABEL = {
  card_only: "guidance card",
  proactive_voice: "voice first",
  human_now: "a person now",
  book_advisor: "advisor booked",
};
