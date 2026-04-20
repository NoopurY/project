import { motion } from "framer-motion";
import { FaBriefcase, FaGraduationCap, FaUserSecret } from "react-icons/fa";
import { ConsoleButton, ConsoleCard, ProgressBar } from "./ui";

const iconMap = {
  theft: <FaUserSecret className="text-2xl text-rose-400" />,
  academic: <FaGraduationCap className="text-2xl text-amber-300" />,
  workplace: <FaBriefcase className="text-2xl text-cyan-300" />,
};

function ScenarioSelector({ scenarios, onSelect }) {
  return (
    <section className="space-y-5">
      <ConsoleCard className="p-6" glow="cyan">
        <div className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyanGlow/80">Operational Start</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Select case scenario</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
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
              className="group rounded-[1.2rem] border border-white/10 bg-[#0c1623]/90 p-5 text-left transition duration-200 hover:border-cyanGlow/40 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.12),0_16px_35px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-4 flex items-center justify-between">
                {iconMap[scenario.id]}
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-muted">
                  {scenario.questions.length} Questions
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{scenario.description}</p>

              <div className="mt-4 space-y-3">
                <ProgressBar value={scenario.questions.length * 12.5} label="Session depth" tone="violet" />
                <div className="flex flex-wrap gap-2 pt-1">
                  <ConsoleButton type="button" onClick={() => onSelect(scenario, "manual")} className="text-xs">
                    Start Manual Interrogation
                  </ConsoleButton>
                  <ConsoleButton type="button" variant="ghost" onClick={() => onSelect(scenario, "truthful")} className="text-xs">
                    Demo: Truthful
                  </ConsoleButton>
                  <ConsoleButton type="button" variant="danger" onClick={() => onSelect(scenario, "deceptive")} className="text-xs">
                    Demo: Deceptive
                  </ConsoleButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </ConsoleCard>

      <div className="grid gap-3 md:grid-cols-3">
        <ConsoleCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Focus</p>
          <p className="mt-2 text-sm text-text">One scenario, one stream of questions, one decision surface.</p>
        </ConsoleCard>
        <ConsoleCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Analysis</p>
          <p className="mt-2 text-sm text-text">Consistency, timing, and contradiction signals update live.</p>
        </ConsoleCard>
        <ConsoleCard className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted">Output</p>
          <p className="mt-2 text-sm text-text">A concise risk summary replaces a generic form submission flow.</p>
        </ConsoleCard>
      </div>
    </section>
  );
}

export default ScenarioSelector;
