const GUIDANCE = {
  payment_plan: {
    title: "Spread upcoming payments",
    body: "A short plan can move one bill closer to payday, so the gap does not have to be closed in a single week.",
    cta: "Look at a payment plan",
  },
  buffer: {
    title: "Protect a small cushion",
    body: "Setting aside even one bill’s worth gives an early debit somewhere to land.",
    cta: "See a small buffer",
  },
  talk_to_advisor: {
    title: "Talk it through with someone",
    body: "An advisor already has this fortnight. Eva does not need to open the app or sort it first.",
    cta: "Talk with an advisor",
  },
};

export const ON_TRACK = {
  title: "Looking steady",
  body: "Nothing in this window is clustering into a cash crunch. There is nothing to act on today.",
};

export function guidanceFor(actionId) {
  if (actionId === "none") return null;
  return GUIDANCE[actionId] ?? null;
}

export const TALK_TRACK = [
  { step: "Empathy", line: "Name the tight week without blame. She already knows it is tight." },
  { step: "Essentials", line: "Stay with the energy bill and the days before payday." },
  { step: "Options", line: "Move one bill, or have someone look at the fortnight with her." },
  { step: "Next step", line: "Offer tomorrow at 10:30 or Thursday at 16:00." },
];

export const DIALOGUE = [
  {
    speaker: "Kate",
    text: "I can move that bill closer to payday, or leave it and have someone confirm it with you. Tomorrow 10:30 or Thursday 16:00. They already have this week.",
  },
  {
    speaker: "Eva",
    text: "I don't want to open the app for this.",
  },
];

export const CALL_SLOTS = [
  { id: "tomorrow-1030", label: "Tomorrow 10:30" },
  { id: "thursday-1600", label: "Thursday 16:00" },
];
