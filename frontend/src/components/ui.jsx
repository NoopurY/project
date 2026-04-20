import { motion } from "framer-motion";

export function ConsoleCard({ className = "", children, glow = "blue", ...props }) {
  const glowClass =
    glow === "violet"
      ? "from-violetGlow/18 via-panel/80 to-panelDeep/95 border-violetGlow/25"
      : glow === "cyan"
        ? "from-cyanGlow/18 via-panel/80 to-panelDeep/95 border-cyanGlow/25"
        : "from-neon/18 via-panel/80 to-panelDeep/95 border-neon/25";

  return (
    <div
      className={`rounded-[1.35rem] border bg-gradient-to-br shadow-glow backdrop-blur-xl ${glowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ConsoleButton({ className = "", variant = "primary", children, ...props }) {
  const styles =
    variant === "ghost"
      ? "border border-white/10 bg-white/5 text-text hover:border-white/20 hover:bg-white/10"
      : variant === "danger"
        ? "border border-danger/30 bg-danger/10 text-rose-100 hover:border-danger/50 hover:bg-danger/20"
        : "border border-neon/25 bg-gradient-to-r from-neon/95 via-cyanGlow/90 to-violetGlow/90 text-white hover:brightness-110";

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyanGlow/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function MetricCard({ title, value, detail, tone = "neutral" }) {
  const toneClass =
    tone === "danger"
      ? "text-rose-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "success"
          ? "text-emerald-300"
          : "text-text";

  return (
    <ConsoleCard className="p-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-muted">{title}</p>
      <div className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</div>
      {detail ? <p className="mt-2 text-sm text-muted">{detail}</p> : null}
    </ConsoleCard>
  );
}

export function ChatBubble({ role, text, contradiction = false, timeLabel }) {
  const isAI = role === "ai";
  const bubbleClass = isAI
    ? "self-start border-cyanGlow/20 bg-[#0c1623]/95 text-text shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_12px_28px_rgba(0,0,0,0.35)]"
    : contradiction
      ? "self-end border-danger/25 bg-danger/10 text-rose-100 shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_12px_28px_rgba(0,0,0,0.32)]"
      : "self-end border-white/10 bg-white/5 text-text shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_28px_rgba(0,0,0,0.3)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24 }}
      className={`max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-6 sm:max-w-[78%] ${bubbleClass}`}
    >
      <div className="mb-2 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-muted">
        <span>{isAI ? "AI Interrogator" : "Subject Response"}</span>
        {timeLabel ? <span className="font-mono text-[9px] text-muted/80">{timeLabel}</span> : null}
      </div>
      <p className="whitespace-pre-wrap">{text}</p>
      {contradiction ? (
        <div className="mt-3 inline-flex rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-200">
          Contradiction flagged
        </div>
      ) : null}
    </motion.div>
  );
}

export function ProgressBar({ value = 0, label, tone = "blue" }) {
  const fillClass =
    tone === "violet"
      ? "from-violetGlow via-cyanGlow to-neon"
      : tone === "success"
        ? "from-success via-cyanGlow to-neon"
        : tone === "warning"
          ? "from-warning via-amber-300 to-rose-400"
          : "from-neon via-cyanGlow to-violetGlow";

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-muted">
          <span>{label}</span>
          <span className="font-mono text-[11px] text-text">{Math.round(value)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/6 ring-1 ring-white/8">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${fillClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}