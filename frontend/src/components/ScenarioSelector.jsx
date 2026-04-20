import { motion } from "framer-motion";
import { FaBriefcase, FaGraduationCap, FaUserSecret } from "react-icons/fa";

const iconMap = {
  theft: <FaUserSecret className="text-2xl text-rose-400" />,
  academic: <FaGraduationCap className="text-2xl text-amber-300" />,
  workplace: <FaBriefcase className="text-2xl text-cyan-300" />,
};

function ScenarioSelector({ scenarios, onSelect }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-steel/55 p-6 shadow-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Select Case Scenario</h2>
        <p className="mt-2 text-sm text-slate-300">
          Choose one investigative context to begin behavioral response analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group rounded-xl border border-white/10 bg-[#0a1a2a] p-5 text-left transition hover:border-neon/60"
          >
            <div className="mb-4 flex items-center justify-between">
              {iconMap[scenario.id]}
              <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300">
                {scenario.questions.length} Questions
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{scenario.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(scenario, "manual")}
                className="rounded-lg bg-neon px-3 py-2 text-xs font-semibold text-[#05212a]"
              >
                Start Manual Interrogation
              </button>
              <button
                type="button"
                onClick={() => onSelect(scenario, "truthful")}
                className="rounded-lg border border-emerald-300/50 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200"
              >
                Demo: Truthful
              </button>
              <button
                type="button"
                onClick={() => onSelect(scenario, "deceptive")}
                className="rounded-lg border border-rose-300/50 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
              >
                Demo: Deceptive
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default ScenarioSelector;
