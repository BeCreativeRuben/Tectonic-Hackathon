import { useEffect, useMemo, useRef, useState } from "react";
import customers from "./customers.json";
import signals from "./signals.json";
import transcript from "./eva-stress.txt?raw";
import { CALL_SLOTS, DIALOGUE, ON_TRACK, guidanceFor } from "./guidance.js";
import { ROUTE_LABEL, routeNextStep } from "./route.js";
import { scoreCustomer, scoreDay } from "./score.js";
import { REPLAY_DAYS, asOfForDay, formatDay } from "./timeline.js";

const TICK_MS = 1200;
const LEVEL_LABEL = { ok: "On track", watch: "Worth a look", stress: "Tight week" };
const BEATS = [
  { day: 0, kicker: "Steady", caption: "A quiet start. Nothing needs a nudge." },
  { day: 4, kicker: "First warning", caption: "Food and energy run higher. Still on track." },
  { day: 5, kicker: "Worth a look", caption: "Rent is due before salary. A gap opens." },
  { day: 9, kicker: "Tight week", caption: "The balance is almost gone." },
  { day: 10, kicker: "Talk with someone", caption: "A debit goes into overdraft." },
];

export function WeekView({
  customerId,
  onCustomer,
  day,
  onDay,
  playing,
  onPlaying,
  slot,
  onSlot,
  onOpenDesk,
}) {
  const [hoverPaused, setHoverPaused] = useState(false);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const result = scoreDay(customerId, signals, day);
  const route = routeNextStep({
    level: result.level,
    score: result.score,
    overdraft: result.overdraft,
    latePayment: result.latePayment,
    slotBooked: customerId === "eva" && slot !== null,
  });
  const levels = useMemo(
    () => Array.from({ length: REPLAY_DAYS }, (_, index) => scoreDay(customerId, signals, index).level),
    [customerId],
  );

  useEffect(() => {
    if (!playing || hoverPaused) return undefined;
    const timer = window.setInterval(() => {
      onDay((current) => {
        if (current >= REPLAY_DAYS - 1) {
          onPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [playing, hoverPaused, onDay, onPlaying]);

  useEffect(() => {
    if (result.level !== "stress" && slot === null) setDialogueOpen(false);
  }, [result.level, slot]);

  function playWeek() {
    if (playing) {
      onPlaying(false);
      return;
    }
    onCustomer("eva");
    onDay(0);
    setHoverPaused(false);
    onPlaying(true);
  }

  const customer = customers.find((item) => item.id === customerId) ?? customers[0];
  const guidance = guidanceFor(result.recommendedActionId);
  const spoken = customerId === "eva" && result.level === "stress";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sky-100">
        <p className="text-xs font-bold uppercase tracking-wider text-kbc-blue">Before she opens the app</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-kbc-navy">Eva’s week</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-700">
          Sarah’s screen pauses a purchase. This is the other moment: Eva was fine, the fortnight tipped, and Kate already has it. She does not have to come looking.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={playWeek}
            className="rounded-xl bg-kbc-blue px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-900/10 hover:bg-kbc-blue-dark"
          >
            {playing ? "Pause the week" : "Play Eva’s week"}
          </button>
          <p className="text-sm text-kbc-muted">
            {playing
              ? hoverPaused
                ? "Paused while you read."
                : `Playing day ${day} of ${REPLAY_DAYS - 1}.`
              : "Two weeks, about twenty seconds."}
          </p>
        </div>
      </section>

      <div
        className="mt-6"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {customers.map((item) => {
            const selected = item.id === customerId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onPlaying(false);
                  onCustomer(item.id);
                }}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left ${
                  selected ? "border-kbc-blue bg-white shadow-sm" : "border-sky-100 bg-white"
                }`}
              >
                <span className="block text-sm font-semibold text-kbc-navy">{item.name}</span>
                <span className="block text-xs text-kbc-muted">{item.city}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-kbc-muted">
          Marc Vermeulen is on this tape. Marc Janssens on the advisor desk is the Focus Shield file, a different household.
        </p>

        <p className="mt-4 text-sm font-semibold text-kbc-navy">
          {customer.name} · {formatDay(asOfForDay(day))} · {LEVEL_LABEL[result.level]} · read {result.score}
          <span className="ml-2 rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-kbc-blue">
            {ROUTE_LABEL[route]}
          </span>
        </p>

        {customerId === "eva" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BEATS.map((beat) => {
              const selected = day === beat.day;
              return (
                <button
                  key={beat.day}
                  type="button"
                  onClick={() => {
                    onPlaying(false);
                    onDay(beat.day);
                  }}
                  className={`rounded-2xl px-3 py-3 text-left ${
                    selected ? "bg-kbc-blue text-white" : "bg-white text-kbc-navy ring-1 ring-sky-100"
                  }`}
                >
                  <span className={`block text-xs font-bold ${selected ? "text-sky-100" : "text-kbc-blue"}`}>
                    Day {beat.day} · {beat.kicker}
                  </span>
                  <span className="mt-1 block text-sm leading-snug">{beat.caption}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {levels.map((level, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Day ${index}, ${LEVEL_LABEL[level]}`}
              onClick={() => {
                onPlaying(false);
                onDay(index);
              }}
              className={`flex h-10 w-10 flex-col items-center justify-center rounded-lg text-sm font-semibold ${
                index === day ? "bg-kbc-blue text-white" : "bg-white text-kbc-navy ring-1 ring-sky-100"
              }`}
            >
              {index}
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  level === "ok" ? "bg-emerald-500" : level === "watch" ? "bg-amber-500" : "bg-red-500"
                } ${index === day ? "bg-white" : ""}`}
              />
            </button>
          ))}
        </div>

        {result.level === "ok" || !guidance ? (
          <article className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6">
            <p className="text-sm font-bold text-emerald-800">Nothing to act on</p>
            <h2 className="mt-1 text-2xl font-bold text-emerald-900">{ON_TRACK.title}</h2>
            <p className="mt-2 text-emerald-950">{ON_TRACK.body}</p>
          </article>
        ) : (
          <article id="week-guidance" className="mt-6 rounded-2xl bg-white px-5 py-6 shadow-sm ring-1 ring-sky-100">
            <p className="text-xs font-bold uppercase tracking-wider text-kbc-blue">
              {result.level === "stress" ? "A tighter week" : "Worth a look"}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-kbc-navy">{guidance.title}</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{guidance.body}</p>
            <ul className="mt-3 grid gap-1 text-sm text-kbc-navy">
              {result.topReasons.slice(0, 3).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {spoken ? (
              <div className="mt-5 flex flex-wrap gap-3 border-t border-sky-100 pt-4">
                <SpokenNote />
                <button
                  type="button"
                  onClick={() => {
                    setDialogueOpen(true);
                    window.setTimeout(() => {
                      document.getElementById("week-talk")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 40);
                  }}
                  className="rounded-xl bg-kbc-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-kbc-blue-dark"
                >
                  Talk it through
                </button>
              </div>
            ) : null}
          </article>
        )}

        {customerId === "eva" ? (
          <Dialogue
            open={dialogueOpen}
            slot={slot}
            onSlot={onSlot}
            onOpenDesk={onOpenDesk}
          />
        ) : null}
      </div>
    </div>
  );
}

function SpokenNote() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (!audio.paused) audio.pause();
          else void audio.play();
        }}
        className="rounded-xl border border-kbc-blue bg-white px-4 py-2.5 text-sm font-semibold text-kbc-blue hover:bg-kbc-blue hover:text-white"
      >
        {playing ? "Pause spoken note" : "Play spoken note"}
      </button>
      <audio
        ref={audioRef}
        src="/voice/eva-stress.mp3"
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-kbc-muted">{transcript.trim()}</p>
    </div>
  );
}

function Dialogue({ open, slot, onSlot, onOpenDesk }) {
  const [shown, setShown] = useState(slot ? DIALOGUE.length : 0);
  const [typing, setTyping] = useState("");
  const [running, setRunning] = useState(false);

  if (!open) return null;

  async function play() {
    if (running) return;
    setRunning(true);
    setShown(0);
    for (let index = 0; index < DIALOGUE.length; index += 1) {
      const line = DIALOGUE[index];
      setShown(index + 1);
      for (let count = 1; count <= line.text.length; count += 1) {
        setTyping(line.text.slice(0, count));
        await wait(18);
      }
      await wait(240);
    }
    setTyping("");
    setRunning(false);
  }

  const ready = shown >= DIALOGUE.length && !running;

  return (
    <section id="week-talk" className="mt-6 rounded-2xl bg-white px-5 py-5 shadow-sm ring-1 ring-sky-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-kbc-navy">Talk it through</h2>
        <button
          type="button"
          onClick={() => void play()}
          disabled={running}
          className="rounded-xl bg-kbc-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kbc-blue-dark disabled:opacity-60"
        >
          {running ? "Playing" : "Play dialogue"}
        </button>
      </div>
      <p className="mt-1 text-sm text-kbc-muted">Kate offers a step she already prepared. Eva does not have to check the numbers.</p>
      <ol className="mt-4 grid gap-3">
        {DIALOGUE.slice(0, shown).map((line, index) => {
          const latest = index === shown - 1 && typing && typing.length < line.text.length;
          const mine = line.speaker === "Eva";
          return (
            <li key={line.speaker} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${mine ? "bg-kbc-blue text-white" : "bg-sky-50 text-kbc-navy"}`}>
                <p className="text-xs font-bold opacity-80">{line.speaker}</p>
                <p className="mt-1 leading-relaxed">{latest ? typing : line.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {ready ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {CALL_SLOTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSlot(option.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                slot === option.id ? "bg-kbc-blue text-white" : "border border-kbc-blue bg-white text-kbc-blue"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {slot ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p>
            {CALL_SLOTS.find((item) => item.id === slot)?.label} is held. The advisor desk already has this week. This demo does not place the call.
          </p>
          <button
            type="button"
            onClick={onOpenDesk}
            className="mt-3 rounded-xl bg-kbc-blue px-4 py-2 text-sm font-semibold text-white hover:bg-kbc-blue-dark"
          >
            Open the advisor desk
          </button>
        </div>
      ) : null}
    </section>
  );
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function evaDeskRequest(slot) {
  const label = CALL_SLOTS.find((item) => item.id === slot)?.label;
  return {
    id: "REQ-EVA",
    customerName: "Eva Janssens",
    accountNumber: "Week tape · Antwerp",
    balance: "Tight week",
    riskLevel: "From the fortnight, not a purchase",
    frictionEvent: "Week tipped before she opened the app",
    frictionReason: label
      ? `Doesn't want to open the app for this; prefers ${label}.`
      : "The bank already has this fortnight. She has not picked a time.",
    goalsCount: 0,
    queueCount: 0,
    requestTime: "From this week",
    status: "calling",
    fromWeek: true,
  };
}

export function useWeekScore(customerId, day) {
  return scoreCustomer(customerId, signals, asOfForDay(day));
}
