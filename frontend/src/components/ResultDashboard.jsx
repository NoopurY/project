import { motion } from "framer-motion";
import { FaRedoAlt, FaRobot } from "react-icons/fa";

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
    return "text-violet-200 border-violet-400/40 bg-violet-500/15";
  }
  return "text-emerald-300 border-emerald-400/40 bg-emerald-500/10";
}

function ResultDashboard({ result, onRestart }) {
  const percent = Math.round(result.probability * 100);

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-steel/60 p-6 shadow-panel">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neon/80">Assessment Complete</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Interrogation Risk Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-violet-100/80">{result.disclaimer}</p>
          <p className="mt-2 text-sm text-violet-200">Contradictions detected: {result.contradictions ?? 0}</p>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-white/20 bg-[#10091a] px-4 py-2 text-sm text-white transition hover:border-neon/50"
        >
          <FaRedoAlt size={13} />
          Run New Assessment
        </button>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-[#0d0918] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-violet-100/80">Deception Probability</p>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles(result.risk)}`}>
              {result.risk}
            </span>
          </div>

          <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[#170d29]">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#a855f7 ${percent * 3.6}deg, #2b1b45 0deg)`,
              }}
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-[#0d0918] text-center">
              <span className="text-2xl font-bold text-white">{percent}%</span>
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-violet-100/80">Model used: {result.model_used}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/10 bg-[#0d0918] p-5"
        >
          <div className="mb-4 flex items-center gap-2 text-neon">
            <FaRobot />
            <h3 className="text-lg font-semibold text-white">Interpretation Summary</h3>
          </div>

          <ul className="space-y-3 text-sm text-violet-100/80">
            {result.explanation?.map((line) => (
              <li key={line} className="rounded-lg border border-violet-200/20 bg-white/5 p-3">
                {line}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(result.metrics).map(([key, value], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-xl border border-white/10 bg-[#0d0918] p-4"
          >
            <p className="text-xs uppercase tracking-[0.12em] text-violet-200/55">{metricLabel(key)}</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {Array.isArray(value) ? value.join(", ") : value}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default ResultDashboard;
