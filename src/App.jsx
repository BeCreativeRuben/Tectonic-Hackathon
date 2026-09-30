import { useState, useEffect, useRef } from "react";
import kbcLogoImg from "./assets/bank-kbc.png";

const INITIAL_BALANCE = "€55.30";

// Default goals seed data
const DEFAULT_GOALS = [
  {
    id: 1,
    title: "Buy a House",
    targetAmount: 40000,
    currentAmount: 14200,
    type: "savings", // "savings" | "monthly_investment"
    monthlyContribution: 400,
    icon: "🏠",
    targetDate: "Dec 2027",
    color: "bg-blue-600",
  },
  {
    id: 2,
    title: "Invest Monthly",
    targetAmount: 300,
    currentAmount: 300,
    type: "monthly_investment",
    monthlyContribution: 300,
    icon: "📈",
    targetDate: "Monthly target",
    color: "bg-emerald-600",
  },
];

// Mock CRM Customer Queue Data
const MOCK_SUPPORT_QUEUE = [
  {
    id: "REQ-9041",
    customerName: "Sarah Van den Berg",
    customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    accountNumber: "BE12 3456 7890 1234",
    balance: "€55.30",
    riskLevel: "Medium (Tight Budget)",
    frictionEvent: "Attempted €80.00 Zara Purchase",
    frictionReason: "Insufficient balance before scheduled bills (€914.49 due)",
    goalsCount: 2,
    queueCount: 1,
    requestTime: "Just now",
    status: "calling", // "calling" | "waiting" | "resolved"
  },
  {
    id: "REQ-8820",
    customerName: "Marc Janssens",
    customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    accountNumber: "BE45 9876 5432 1098",
    balance: "€120.00",
    riskLevel: "Low",
    frictionEvent: "Attempted €250 Electronics Purchase",
    frictionReason: "Exceeded impulse threshold",
    goalsCount: 1,
    queueCount: 2,
    requestTime: "4 mins ago",
    status: "waiting",
  },
  {
    id: "REQ-8742",
    customerName: "Elena Dubois",
    customerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    accountNumber: "BE78 1122 3344 5566",
    balance: "€42.10",
    riskLevel: "High Risk",
    frictionEvent: "Attempted €110 Restaurant Voucher",
    frictionReason: "Balance negative after upcoming direct debits",
    goalsCount: 3,
    queueCount: 0,
    requestTime: "12 mins ago",
    status: "waiting",
  },
];

// Official KBC Bank Logo Component using bank-kbc.png
function KBCLogo({ className = "h-9 w-auto", showText = false }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={kbcLogoImg}
        alt="KBC Bank Logo"
        className="h-9 w-auto object-contain shrink-0 max-w-[140px]"
      />
      {showText && (
        <span className="font-extrabold tracking-tight text-kbc-navy text-lg leading-none">
          KBC
        </span>
      )}
    </div>
  );
}

// Kate SVG Icon representing KBC's AI Assistant with a thinking/AI spark badge
function KateIcon({ className = "h-7 w-7" }) {
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        className={className}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="18" cy="18" r="17" fill="#E8F4FB" stroke="#0077C8" strokeWidth="1.5" />
        <circle cx="18" cy="15" r="5" fill="#0077C8" />
        <path
          d="M9.5 27c1.6-3.8 4.8-6 8.5-6s6.9 2.2 8.5 6"
          stroke="#0077C8"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M26 8L27.2 10.8L30 12L27.2 13.2L26 16L24.8 13.2L22 12L24.8 10.8L26 8Z"
          fill="#0077C8"
        />
        <circle cx="28.5" cy="7.5" r="1" fill="#005FA0" />
      </svg>
    </div>
  );
}

// Sparkle Icon for Kate AI highlights
function SparklesIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

// Toast notification component
function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-5 z-50 flex max-w-md items-center gap-3 rounded-xl border border-emerald-300 bg-white px-4 py-3.5 shadow-xl shadow-emerald-900/10 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-emerald-900">{message}</p>
      <button
        onClick={onDone}
        className="ml-auto text-emerald-500 hover:text-emerald-800 focus:outline-none"
        aria-label="Dismiss toast"
      >
        ✕
      </button>
    </div>
  );
}

// Global View Switcher Bar (App View vs Operator CRM)
function GlobalRoleBar({ activeRole, onChangeRole, incomingCallCount }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-sky-200 bg-white px-4 py-2.5 shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <KBCLogo showText={true} />
          <span className="text-xs font-semibold text-kbc-muted hidden md:inline border-l border-slate-200 pl-3">
            Focus Shield Platform
          </span>
        </div>

        {/* Role Toggle Buttons */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => onChangeRole("customer")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeRole === "customer"
                ? "bg-white text-kbc-navy shadow-xs"
                : "text-slate-600 hover:text-kbc-navy"
            }`}
          >
            <span>📱</span> Customer App View
          </button>
          <button
            onClick={() => onChangeRole("operator")}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeRole === "operator"
                ? "bg-kbc-blue text-white shadow-xs"
                : "text-slate-600 hover:text-kbc-navy"
            }`}
          >
            <span>🎧</span> KBC Operator CRM
            {incomingCallCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {incomingCallCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

// Add New Personal Goal Modal Component
function AddGoalModal({ onClose, onAddGoal }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("savings"); // "savings" | "monthly_investment"
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [icon, setIcon] = useState("🏠");
  const [targetDate, setTargetDate] = useState("Dec 2026");

  const iconsList = ["🏠", "📈", "🚗", "✈️", "🎓", "💰", "💍", "🛡️"];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    onAddGoal({
      id: Date.now(),
      title,
      targetAmount: parseFloat(targetAmount) || 1000,
      currentAmount: parseFloat(currentAmount) || 0,
      type,
      monthlyContribution: type === "monthly_investment" ? parseFloat(targetAmount) || 300 : 250,
      icon,
      targetDate: type === "monthly_investment" ? "Monthly target" : targetDate,
      color: type === "monthly_investment" ? "bg-emerald-600" : "bg-blue-600",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h2 className="text-xl font-bold text-kbc-navy">Create Personal Goal</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1.5">
              Goal Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {iconsList.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition ${
                    icon === ic
                      ? "bg-sky-100 ring-2 ring-kbc-blue scale-105"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Buy a house, Invest €300/mo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none focus:ring-1 focus:ring-kbc-blue"
            />
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
              Goal Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("savings")}
                className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                  type === "savings"
                    ? "border-kbc-blue bg-sky-100/70 text-kbc-blue ring-1 ring-kbc-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"
                }`}
              >
                Target Savings Total
              </button>
              <button
                type="button"
                onClick={() => setType("monthly_investment")}
                className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                  type === "monthly_investment"
                    ? "border-kbc-blue bg-sky-100/70 text-kbc-blue ring-1 ring-kbc-blue"
                    : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"
                }`}
              >
                Monthly Investment
              </button>
            </div>
          </div>

          {/* Amount inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
                {type === "savings" ? "Target Amount (€)" : "Monthly Goal (€)"}
              </label>
              <input
                type="number"
                required
                placeholder={type === "savings" ? "40000" : "300"}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none"
              />
            </div>
            {type === "savings" && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
                  Current Savings (€)
                </label>
                <input
                  type="number"
                  placeholder="14200"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Target Date */}
          {type === "savings" && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
                Target Date
              </label>
              <input
                type="text"
                placeholder="e.g. Dec 2027"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-sky-200 px-3.5 py-2 text-sm font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-kbc-blue px-4 py-3 text-sm font-semibold text-white hover:bg-kbc-blue-dark transition"
            >
              Add Goal
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal Component supporting Soft Friction prompt + Add to Cooling-off Queue with photo upload & reminder duration
function SoftFrictionModal({ onCancel, onProceed, onAddToQueue, primaryGoal }) {
  const [activeTab, setActiveTab] = useState("friction"); // "friction" | "queue"
  const [reminderDays, setReminderDays] = useState("3");
  const [customDays, setCustomDays] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [itemNote, setItemNote] = useState("Zara Linen Shirt & Trousers");
  const fileInputRef = useRef(null);

  const sampleClothingImage =
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleQueueSubmit = (e) => {
    e.preventDefault();
    const days = reminderDays === "custom" ? customDays || "1" : reminderDays;
    onAddToQueue({
      id: Date.now(),
      name: itemNote || "€80 Clothing Purchase",
      price: "€80.00",
      reminderDays: days,
      createdAt: new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      imageUrl: uploadedImage || sampleClothingImage,
      hasCustomImage: !!uploadedImage,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
        {/* Header Ribbon (Pill box removed) */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/70 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <KateIcon className="h-8 w-8" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-kbc-blue">
                  Kate AI Assistant
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-kbc-navy">
                  <SparklesIcon className="h-3 w-3 text-kbc-blue" />
                  Focus Shield
                </span>
              </div>
              <p className="text-xs text-kbc-muted">Smart Budget Safeguard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {activeTab === "friction" ? (
          <div className="p-6 sm:p-7">
            {/* Modal Title */}
            <div className="mb-3 flex items-center gap-2">
              <h2
                id="modal-title"
                className="text-2xl font-bold tracking-tight text-kbc-navy"
              >
                Take a moment?
              </h2>
            </div>

            {/* Modal Body */}
            <p className="text-base leading-relaxed text-slate-700">
              Money is a bit tight this month. Your current balance (
              <span className="font-semibold text-kbc-navy">{INITIAL_BALANCE}</span>) can&apos;t
              cover this <span className="font-semibold text-kbc-navy">€80</span> purchase without
              risking your scheduled bills. Are you sure you want to proceed?
            </p>

            {/* Personal Goal Impact Banner */}
            {primaryGoal && (
              <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 flex items-start gap-3">
                <span className="text-2xl shrink-0 mt-0.5">{primaryGoal.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-xs font-bold text-kbc-blue">
                    <SparklesIcon className="h-3.5 w-3.5" />
                    Goal Protection Alert
                  </div>
                  <p className="text-xs text-kbc-navy mt-0.5 font-medium leading-snug">
                    Pausing this €80 purchase keeps you on track for{" "}
                    <span className="font-bold">{primaryGoal.title}</span> (
                    {primaryGoal.type === "savings"
                      ? `€${primaryGoal.currentAmount.toLocaleString()} / €${primaryGoal.targetAmount.toLocaleString()}`
                      : `€${primaryGoal.targetAmount}/mo target`}
                    ).
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              {/* Primary Button (Blue, Prominent) */}
              <button
                type="button"
                onClick={onCancel}
                className="group w-full rounded-xl bg-kbc-blue px-5 py-3.5 text-center transition-all hover:bg-kbc-blue-dark focus:outline-none focus:ring-2 focus:ring-kbc-blue focus:ring-offset-2 active:scale-[0.99] shadow-md shadow-sky-900/10"
              >
                <span className="text-base font-semibold text-white">Cancel Payment</span>
                <span className="block text-xs font-normal text-sky-100 group-hover:text-white transition">
                  Your budget will thank you
                </span>
              </button>

              {/* Think About It Button (Triggers Cooling Queue & Photo Upload) */}
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-sky-300 bg-sky-50/80 px-4 py-3.5 text-sm font-semibold text-kbc-blue transition hover:bg-sky-100 hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-kbc-blue focus:ring-offset-2 shadow-2xs"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Think about it</span>
                <span className="text-xs font-normal text-kbc-muted">(Set reminder & photo)</span>
              </button>

              {/* Secondary Button (Gray, Muted) */}
              <button
                type="button"
                onClick={onProceed}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Proceed anyway
              </button>
            </div>
          </div>
        ) : (
          /* Queue & Reminder Setup View */
          <form onSubmit={handleQueueSubmit} className="p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-kbc-navy">Cooling-off Queue</h2>
              <p className="text-xs text-kbc-muted mt-0.5">
                Save this €80 purchase to your queue. Kate will remind you after your chosen waiting period.
              </p>
            </div>

            {/* Photo / Screenshot Upload Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1.5">
                Upload Item Photo or Screenshot
              </label>

              {uploadedImage ? (
                <div className="relative rounded-xl border border-sky-200 bg-slate-50 p-2 flex items-center gap-3">
                  <img
                    src={uploadedImage}
                    alt="Uploaded item"
                    className="h-16 w-16 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-kbc-navy truncate">{imageName || "Item Screenshot"}</p>
                    <p className="text-[11px] text-emerald-600 font-medium">✓ Image attached</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mr-2 rounded-lg bg-red-50 p-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50 p-4 text-center transition hover:border-kbc-blue hover:bg-sky-50"
                >
                  <svg className="mx-auto h-7 w-7 text-kbc-blue group-hover:scale-110 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-1 text-xs font-semibold text-kbc-navy">
                    Click or drag photo/screenshot here
                  </p>
                  <p className="text-[11px] text-kbc-muted mt-0.5">
                    PNG, JPG, or WEBP up to 5MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Item Description / Note */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-1">
                Item Details
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="e.g. Blue Linen Shirt (€80)"
                className="w-full rounded-xl border border-sky-200 px-3.5 py-2.5 text-sm font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none focus:ring-1 focus:ring-kbc-blue"
              />
            </div>

            {/* Reminder Duration Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-kbc-navy mb-2">
                Remind Me In:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: "1", label: "24 Hours" },
                  { id: "3", label: "3 Days" },
                  { id: "7", label: "7 Days" },
                  { id: "9", label: "Next Payday (9d)" },
                ].map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setReminderDays(option.id)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition ${
                      reminderDays === option.id
                        ? "border-kbc-blue bg-sky-100/70 text-kbc-blue ring-1 ring-kbc-blue"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-kbc-blue px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-kbc-blue-dark transition"
              >
                Add to Queue & Pause
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("friction")}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// KBC Operator CRM Dashboard View (Financial Advisor Portal)
function KBCOperatorCRM({ supportQueue, goals, queueItems, onResolveCustomerCall }) {
  const [activeCallCustomer, setActiveCallCustomer] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Secure encrypted line established with Customer." },
    { sender: "customer", text: "Hello, Kate suggested I talk with an advisor. I tried to buy a €80 jacket but money is tight." },
  ]);
  const [operatorInput, setOperatorInput] = useState("");
  const [callDuration, setCallDuration] = useState(84); // seconds

  useEffect(() => {
    let interval;
    if (activeCallCustomer) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCallCustomer]);

  const handleAnswerCall = (customer) => {
    setActiveCallCustomer(customer);
    setCallDuration(1);
    setChatMessages([
      { sender: "system", text: `Call connected with ${customer.customerName} (${customer.accountNumber}).` },
      { sender: "customer", text: `Hi, I was about to buy ${customer.frictionEvent} but Kate triggered Soft Friction. Can you review my budget with me?` },
    ]);
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!operatorInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: "operator", text: operatorInput },
    ]);
    setOperatorInput("");

    // Auto simulated customer reply after 1.5s
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "customer",
          text: "That makes a lot of sense. I'll stick to my cooling-off queue and focus on my house savings goal.",
        },
      ]);
    }, 1500);
  };

  const handleEndCall = () => {
    if (activeCallCustomer) {
      onResolveCustomerCall(activeCallCustomer.id);
      setActiveCallCustomer(null);
    }
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${remainderSec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* CRM Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
        <div className="flex items-center gap-3">
          <KBCLogo showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-kbc-navy">KBC Advisor CRM</h1>
              <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-semibold text-kbc-blue">
                Soft Friction 360 Workspace
              </span>
            </div>
            <p className="text-xs text-kbc-muted">Operator ID: #ADV-7049 (Brussels Financial Hub)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-700">Status: Available</span>
          </div>
          <div className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-kbc-blue">
            Live Requests: {supportQueue.length}
          </div>
        </div>
      </header>

      {/* 1. HIGH PRIORITY CALL NOTIFICATION / POPUP BANNER */}
      {supportQueue.some((c) => c.status === "calling") && !activeCallCustomer && (
        <div className="mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="relative overflow-hidden rounded-2xl border-2 border-red-400 bg-gradient-to-r from-red-500 via-rose-500 to-kbc-blue p-5 text-white shadow-xl shadow-red-900/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <svg className="h-7 w-7 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white">
                      🚨 Incoming Live Support Request
                    </span>
                    <span className="text-xs font-semibold text-rose-100">Just now</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Sarah Van den Berg wants to talk to a financial advisor
                  </h3>
                  <p className="text-xs text-sky-100">
                    Trigger: Soft Friction Event (€80 Zara Purchase) · Account Balance: €55.30
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAnswerCall(supportQueue[0])}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-lg hover:bg-emerald-50 transition transform active:scale-95"
                >
                  <svg className="h-5 w-5 fill-emerald-600" viewBox="0 0 24 24">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  Answer Now / Call Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CALL WORKSPACE OR QUEUE LIST */}
      {activeCallCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in zoom-in-95 duration-200">
          {/* Left Column: Live Call & Chat Interface (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sky-100">
              {/* Call Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={activeCallCustomer.customerAvatar}
                      alt={activeCallCustomer.customerName}
                      className="h-11 w-11 rounded-xl object-cover ring-2 ring-emerald-400"
                    />
                    <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{activeCallCustomer.customerName}</h3>
                    <p className="text-xs text-slate-300">Live Voice & Chat Session · {activeCallCustomer.accountNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>In Call: {formatTimer(callDuration)}</span>
                  </div>
                  <button
                    onClick={handleEndCall}
                    className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
                  >
                    End Call
                  </button>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.sender === "operator"
                        ? "justify-end"
                        : msg.sender === "customer"
                        ? "justify-start"
                        : "justify-center"
                    }`}
                  >
                    {msg.sender === "system" ? (
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {msg.text}
                      </span>
                    ) : (
                      <div
                        className={`max-w-xs rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                          msg.sender === "operator"
                            ? "bg-kbc-blue text-white rounded-br-none"
                            : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                        }`}
                      >
                        <p className="font-semibold text-[10px] opacity-75 mb-0.5">
                          {msg.sender === "operator" ? "You (KBC Advisor)" : activeCallCustomer.customerName}
                        </p>
                        {msg.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Quick AI Talking Points for Advisor */}
              <div className="border-t border-sky-100 bg-sky-50/50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-kbc-blue mb-1.5 flex items-center gap-1">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Kate AI Suggested Advisor talking points:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Acknowledge €80 clothing pause",
                    "Highlight €14.2k House Savings Goal",
                    "Offer €50 temporary emergency buffer",
                  ].map((tip, i) => (
                    <button
                      key={i}
                      onClick={() => setOperatorInput(tip)}
                      className="rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-kbc-navy hover:bg-sky-100 transition"
                    >
                      + {tip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={operatorInput}
                  onChange={(e) => setOperatorInput(e.target.value)}
                  placeholder="Type message to customer..."
                  className="flex-1 rounded-xl border border-sky-200 px-3.5 py-2 text-xs font-medium text-kbc-navy focus:border-kbc-blue focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-kbc-blue px-4 py-2 text-xs font-bold text-white hover:bg-kbc-blue-dark transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Customer 360 & Application Insights (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Customer Overview */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-kbc-muted mb-3">
                Customer 360 Profile
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={activeCallCustomer.customerAvatar}
                  alt={activeCallCustomer.customerName}
                  className="h-12 w-12 rounded-2xl object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-base font-bold text-kbc-navy">{activeCallCustomer.customerName}</h4>
                  <p className="text-xs text-kbc-muted">{activeCallCustomer.accountNumber}</p>
                  <span className="inline-block mt-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    {activeCallCustomer.riskLevel}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Current Balance</span>
                  <span className="font-bold text-kbc-navy text-sm">{activeCallCustomer.balance}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-500 block text-[10px]">Focus Shield</span>
                  <span className="font-bold text-emerald-600 text-sm">Active</span>
                </div>
              </div>
            </div>

            {/* Soft Friction Data */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-kbc-muted">
                Soft Friction Event History
              </h3>
              <div className="rounded-xl bg-red-50/70 p-3 border border-red-100">
                <p className="text-xs font-bold text-red-900">{activeCallCustomer.frictionEvent}</p>
                <p className="text-[11px] text-red-700 mt-0.5">{activeCallCustomer.frictionReason}</p>
                <span className="mt-1 inline-block text-[10px] font-semibold text-red-600">
                  Status: Canceled by user via Kate AI Soft Friction
                </span>
              </div>
            </div>

            {/* Customer Goals */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-kbc-muted mb-2">
                Active Customer Personal Goals ({goals.length})
              </h3>
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span>{g.icon}</span>
                      <span className="font-bold text-kbc-navy">{g.title}</span>
                    </div>
                    <span className="font-semibold text-kbc-blue">
                      {g.type === "savings" ? `€${g.currentAmount.toLocaleString()} / €${g.targetAmount.toLocaleString()}` : `€${g.targetAmount}/mo`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooling Queue Items */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-kbc-muted mb-2">
                Cooling-off Queue ({queueItems.length} items)
              </h3>
              {queueItems.map((qi) => (
                <div key={qi.id} className="flex items-center gap-3 p-2 rounded-xl bg-sky-50/50 border border-sky-100">
                  <img src={qi.imageUrl} alt={qi.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-kbc-navy truncate">{qi.name}</p>
                    <p className="text-[10px] text-kbc-muted">Remind in {qi.reminderDays} days</p>
                  </div>
                  <span className="text-xs font-bold text-kbc-navy">{qi.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* INCOMING REQUESTS QUEUE TABLE */
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sky-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-kbc-navy">Live Customer Support Queue</h2>
              <p className="text-xs text-kbc-muted">Customers currently requesting financial advisor assistance</p>
            </div>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-kbc-blue">
              {supportQueue.length} Waiting
            </span>
          </div>

          <div className="space-y-3">
            {supportQueue.map((req) => (
              <div
                key={req.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                  req.status === "calling"
                    ? "border-emerald-300 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={req.customerAvatar}
                    alt={req.customerName}
                    className="h-12 w-12 rounded-2xl object-cover border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-kbc-navy">{req.customerName}</h4>
                      <span className="text-xs text-kbc-muted">({req.accountNumber})</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-0.5">
                      Trigger: <span className="font-semibold text-red-700">{req.frictionEvent}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-kbc-muted">
                      <span>Balance: <strong className="text-kbc-navy">{req.balance}</strong></span>
                      <span>·</span>
                      <span>Goals: <strong>{req.goalsCount}</strong></span>
                      <span>·</span>
                      <span>Queue: <strong>{req.queueCount} items</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAnswerCall(req)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
                  >
                    <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                    Answer Now / Call Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Dashboard view for Customer
function MainDashboard({
  onSimulate,
  queueItems,
  onRemoveFromQueue,
  onBuyFromQueue,
  goals,
  onOpenAddGoal,
  onDeleteGoal,
  onRequestAdvisorCall,
}) {
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  return (
    <div className="mx-auto max-w-lg px-4 pb-20 pt-6">
      {/* KBC Header */}
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KBCLogo showText={false} />
          <div>
            <p className="text-sm font-bold tracking-tight text-kbc-navy">KBC Mobile Banking</p>
            <p className="text-xs text-kbc-muted">Current Account · BE12 3456 7890 1234</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRequestAdvisorCall}
            className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
          >
            <span>🎧</span> Call Advisor
          </button>
        </div>
      </header>

      {/* 1. TOP BANNER: Focus Mode Active Light Yellow Alert */}
      <div
        role="status"
        aria-live="polite"
        className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 shadow-xs"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-amber-900 leading-snug">
          Focus Mode Active: Helping you keep your budget on track.
        </p>
      </div>

      {/* Low Balance Account Card */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-sky-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-kbc-muted">
            Current Balance
          </p>
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 border border-red-100">
            Tight Budget
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight text-kbc-navy">
            {INITIAL_BALANCE}
          </span>
        </div>
        <p className="mt-2 text-xs text-kbc-muted">
          Scheduled commitments before next payday (Oct 9): <span className="font-semibold text-kbc-navy">€914.49</span>
        </p>
      </section>

      {/* Trigger Button Section */}
      <section className="mt-5">
        <button
          type="button"
          onClick={onSimulate}
          className="group relative w-full overflow-hidden rounded-2xl bg-kbc-blue p-4 text-left shadow-lg shadow-sky-900/15 transition-all hover:bg-kbc-blue-dark active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-kbc-blue focus:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                  Interactive Demo Trigger
                </p>
                <p className="text-base font-bold text-white">
                  Simulate Online Purchase (€80 Clothing)
                </p>
              </div>
            </div>
            <span className="text-xl text-white group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </section>

      {/* PERSONAL GOALS SECTION */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-kbc-navy">Personal Goals</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-kbc-blue">
              {goals.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAddGoal}
            className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-white px-2.5 py-1 text-xs font-semibold text-kbc-blue hover:bg-sky-50 transition shadow-2xs"
          >
            + Add Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-center">
            <p className="text-xs font-semibold text-kbc-navy">No personal goals set</p>
            <p className="text-[11px] text-kbc-muted mt-0.5">
              Add goals like &quot;Buy a house&quot; or &quot;Invest €300/month&quot; to keep your budget focused.
            </p>
            <button
              onClick={onOpenAddGoal}
              className="mt-3 rounded-lg bg-kbc-blue px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
            >
              Set First Goal
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progressPct =
                goal.type === "savings"
                  ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100)
                  : 100;

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <h4 className="text-sm font-bold text-kbc-navy">{goal.title}</h4>
                        <p className="text-xs text-kbc-muted">
                          {goal.type === "savings"
                            ? `€${goal.currentAmount.toLocaleString()} of €${goal.targetAmount.toLocaleString()} saved`
                            : `Target: €${goal.targetAmount}/month investment`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{goal.targetDate}</span>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="text-slate-300 hover:text-red-500 text-xs px-1"
                        title="Delete Goal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Progress bar for savings */}
                  {goal.type === "savings" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-kbc-navy mb-1">
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${goal.color} transition-all duration-500`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cooling-off Queue Section */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-kbc-navy">Cooling-off Queue</h3>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-kbc-blue">
              {queueItems.length}
            </span>
          </div>
          <span className="text-xs font-medium text-kbc-muted">Kate Reminders</span>
        </div>

        {queueItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white/60 p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-kbc-blue">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-2 text-xs font-semibold text-kbc-navy">No purchases in cooling queue</p>
            <p className="text-[11px] text-kbc-muted mt-0.5">
              When Soft Friction activates, you can snooze purchases here with screenshot reminders.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-sky-100 transition hover:shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  {/* Thumbnail */}
                  <div
                    onClick={() => setSelectedImageModal(item.imageUrl)}
                    className="relative cursor-pointer h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 hover:opacity-90 transition"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-kbc-navy truncate">{item.name}</h4>
                      <span className="text-sm font-bold text-kbc-navy">{item.price}</span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-kbc-blue border border-sky-100">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Remind in {item.reminderDays} {item.reminderDays === "1" ? "day" : "days"}
                      </span>
                      <span className="text-[11px] text-kbc-muted">Added {item.createdAt}</span>
                    </div>

                    {/* Card Action buttons */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => onBuyFromQueue(item)}
                        className="rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-kbc-blue hover:bg-kbc-blue hover:text-white transition"
                      >
                        Buy Now
                      </button>
                      <button
                        onClick={() => onRemoveFromQueue(item.id)}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Scheduled Bills */}
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-sky-100">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-kbc-muted">
          Upcoming Scheduled Payments
        </h3>
        <div className="space-y-3">
          {[
            { title: "Monthly Rent", date: "Due in 3 days", amount: "€820.00" },
            { title: "Energy & Utilities", date: "Due in 5 days", amount: "€64.50" },
            { title: "Mobile Subscription", date: "Due in 7 days", amount: "€29.99" },
          ].map((bill, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-kbc-navy">{bill.title}</p>
                <p className="text-[11px] text-kbc-muted">{bill.date}</p>
              </div>
              <span className="font-bold text-kbc-navy">{bill.amount}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Image Preview Modal */}
      {selectedImageModal && (
        <div
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2">
            <img src={selectedImageModal} alt="Item enlarged" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
            <p className="text-center text-xs font-semibold text-kbc-navy py-2">Click anywhere to close preview</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Processing View (Triggered on "Proceed anyway")
function ProcessingView({ onReset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-kbc-sky">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl ring-1 ring-sky-100">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-kbc-blue" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-kbc-navy">Payment Processing...</h1>
        <p className="mt-2 text-sm leading-relaxed text-kbc-muted">
          Connecting to merchant for <span className="font-semibold text-kbc-navy">€80.00 Clothing</span> purchase.
        </p>
        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          Balance remaining after payment: <span className="font-semibold text-red-600">-€24.70</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 w-full rounded-xl bg-kbc-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-kbc-blue-dark"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeRole, setActiveRole] = useState("customer"); // "customer" | "operator"
  const [modalOpen, setModalOpen] = useState(false);
  const [addGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "processing"
  const [toastMessage, setToastMessage] = useState(null);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [supportQueue, setSupportQueue] = useState(MOCK_SUPPORT_QUEUE);
  const [queueItems, setQueueItems] = useState([
    {
      id: 1,
      name: "Zara Linen Jacket (€80)",
      price: "€80.00",
      reminderDays: "3",
      createdAt: "Today",
      imageUrl:
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80",
      hasCustomImage: false,
    },
  ]);

  const handleSimulateClick = () => {
    setModalOpen(true);
  };

  const handleCancelPayment = () => {
    setModalOpen(false);
    setToastMessage("Smart choice! Purchase canceled.");
  };

  const handleProceedAnyway = () => {
    setModalOpen(false);
    setView("processing");
  };

  const handleAddToQueue = (newItem) => {
    setQueueItems((prev) => [newItem, ...prev]);
    setModalOpen(false);
    setToastMessage(
      `Added to Cooling-off Queue! Kate will remind you in ${newItem.reminderDays} ${
        newItem.reminderDays === "1" ? "day" : "days"
      }.`
    );
  };

  const handleRemoveFromQueue = (id) => {
    setQueueItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage("Item removed from queue.");
  };

  const handleAddGoal = (newGoal) => {
    setGoals((prev) => [newGoal, ...prev]);
    setAddGoalModalOpen(false);
    setToastMessage(`Goal "${newGoal.title}" added! Kate will help keep you on track.`);
  };

  const handleDeleteGoal = (goalId) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setToastMessage("Personal goal removed.");
  };

  const handleRequestAdvisorCall = () => {
    setActiveRole("operator");
    setToastMessage("Support request sent! Switched to Operator CRM view.");
  };

  const handleResolveCustomerCall = (reqId) => {
    setSupportQueue((prev) => prev.filter((r) => r.id !== reqId));
    setToastMessage("Customer call ended and session logged in KBC CRM.");
  };

  return (
    <div className="min-h-screen bg-sky-50/60 font-sans text-slate-900">
      {/* Top Role Switcher */}
      <GlobalRoleBar
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        incomingCallCount={supportQueue.filter((c) => c.status === "calling").length}
      />

      {activeRole === "customer" ? (
        view === "dashboard" ? (
          <MainDashboard
            onSimulate={handleSimulateClick}
            queueItems={queueItems}
            onRemoveFromQueue={handleRemoveFromQueue}
            onBuyFromQueue={() => setView("processing")}
            goals={goals}
            onOpenAddGoal={() => setAddGoalModalOpen(true)}
            onDeleteGoal={handleDeleteGoal}
            onRequestAdvisorCall={handleRequestAdvisorCall}
          />
        ) : (
          <ProcessingView onReset={() => setView("dashboard")} />
        )
      ) : (
        /* Operator CRM Workspace */
        <KBCOperatorCRM
          supportQueue={supportQueue}
          goals={goals}
          queueItems={queueItems}
          onResolveCustomerCall={handleResolveCustomerCall}
        />
      )}

      {/* Soft Friction Modal */}
      {modalOpen && (
        <SoftFrictionModal
          onCancel={handleCancelPayment}
          onProceed={handleProceedAnyway}
          onAddToQueue={handleAddToQueue}
          primaryGoal={goals.length > 0 ? goals[0] : null}
        />
      )}

      {/* Add Personal Goal Modal */}
      {addGoalModalOpen && (
        <AddGoalModal
          onClose={() => setAddGoalModalOpen(false)}
          onAddGoal={handleAddGoal}
        />
      )}

      {/* Success Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </div>
  );
}
