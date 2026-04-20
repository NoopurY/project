import { motion } from "framer-motion";
import { FaRedoAlt, FaRobot } from "react-icons/fa";
import { ConsoleButton, ConsoleCard, MetricCard, ProgressBar } from "./ui";

function metricLabel(key) {
  return key
    .split("_")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function riskStyles(risk) {
  if (risk === "High") {
    return "text-rose-300 border-rose-400/40 bg-rose-500/10";
  }
  if (risk === "Medium") {
    return "text-amber-300 border-amber-400/40 bg-amber-500/10";
  }
  return "text-emerald-300 border-emerald-400/40 bg-emerald-500/10";
}

function Gauge({ value }) {
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[220px] w-[220px] -rotate-90 drop-shadow-[0_0_18px_rgba(34,211,238,0.14)]">
        <defs>
          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="55%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#riskGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full border border-white/8 bg-[#060d16]/90 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Probability</span>
        <span className="mt-2 text-5xl font-semibold text-white">{Math.round(value)}%</span>
        <span className="mt-2 text-xs uppercase tracking-[0.24em] text-cyanGlow/80">Behavioral risk</span>
      </div>
    </div>
  );
}

function ResultDashboard({ result, onRestart }) {
  const percent = Math.round(result.probability * 100);

  return (
    <section className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyanGlow/80">Assessment Complete</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Interrogation risk dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{result.disclaimer}</p>
          <p className="mt-3 text-sm text-rose-200">Contradictions detected: {result.contradictions ?? 0}</p>
        </div>

        <ConsoleButton
          type="button"
          onClick={onRestart}
          className="self-start"
        >
          <FaRedoAlt size={13} />
          Run New Assessment
        </ConsoleButton>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <ConsoleCard className="p-5" glow="violet">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">Deception Probability</p>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles(result.risk)}`}>
              {result.risk}
            </span>
          </div>

          <Gauge value={percent} />
          <p className="mt-4 text-center text-sm text-muted">Model used: {result.model_used}</p>
        </ConsoleCard>

        <div className="space-y-5">
          <ConsoleCard className="p-5" glow="cyan">
            <div className="mb-4 flex items-center gap-2 text-cyanGlow">
              <FaRobot />
              <h3 className="text-lg font-semibold text-white">Interpretation summary</h3>
            </div>

            <div className="space-y-3 text-sm text-text">
              {result.explanation?.map((line) => (
                <div key={line} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 leading-6 text-muted">
                  {line}
                </div>
              ))}
            </div>
          </ConsoleCard>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(result.metrics).map(([key, value], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MetricCard
                  title={metricLabel(key)}
                  value={value}
                  detail="Captured during the completed interrogation sequence"
                  tone="neutral"
                />
              </motion.div>
            ))}
          </div>

          <ConsoleCard className="p-5" glow="blue">
            <ProgressBar value={percent} label="Probability intensity" tone={result.risk === "High" ? "warning" : "violet"} />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MetricCard title="Risk Label" value={result.risk} detail="Low / Medium / High classification" tone={result.risk === "High" ? "danger" : result.risk === "Medium" ? "warning" : "success"} />
              <MetricCard title="Contradictions" value={result.contradictions ?? 0} detail="Detected across response history" tone={result.contradictions > 0 ? "danger" : "success"} />
              <MetricCard title="Response Count" value={Object.keys(result.metrics || {}).length} detail="Signals summarized in this report" tone="neutral" />
            </div>
          </ConsoleCard>
        </div>
      </div>
    </section>
  );
}

export default ResultDashboard;
