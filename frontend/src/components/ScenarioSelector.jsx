import { motion } from "framer-motion";
import { FaBriefcase, FaGraduationCap, FaUserSecret } from "react-icons/fa";

const iconMap = {
  theft: <FaUserSecret className="text-2xl text-violet-300" />,
  academic: <FaGraduationCap className="text-2xl text-purple-300" />,
  workplace: <FaBriefcase className="text-2xl text-fuchsia-300" />,
};

const caseTone = {
  theft: "border-violet-300/30 bg-violet-500/10 text-violet-100",
  academic: "border-purple-300/30 bg-purple-500/10 text-purple-100",
  workplace: "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100",
};

function ScenarioSelector({ scenarios, onSelect }) {
  return (
    <section className="rounded-2xl border border-violet-300/20 bg-steel/60 p-6 shadow-panel">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-neon/85">Caseboard Intake</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Choose Your First Case File</h2>
          <p className="mt-2 text-sm text-violet-100/80">
            Start with a scenario and let the detective engine probe for inconsistencies.
          </p>
        </div>
        <span className="self-start rounded-full border border-violet-300/30 bg-black/30 px-3 py-1 text-xs text-violet-100/80">
          {scenarios.length} active investigations
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario, index) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            whileHover={{ y: -6, rotate: -0.3, scale: 1.01 }}
            className="group relative overflow-hidden rounded-xl border border-violet-300/15 bg-[#0f0919] p-5 text-left transition hover:border-neon/60"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />

            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg border border-violet-200/20 bg-black/30 p-2">{iconMap[scenario.id]}</div>
              <span className={`rounded-full border px-3 py-1 text-xs ${caseTone[scenario.id]}`}>
                {scenario.questions.length} Questions
              </span>
            </div>

            <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-violet-200/65">Case File 0{index + 1}</p>
            <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
            <p className="mt-2 text-sm text-violet-100/80">{scenario.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelect(scenario, "manual")}
                className="rounded-lg bg-neon px-3 py-2 text-xs font-semibold text-black transition hover:brightness-110"
              >
                Start Manual Interrogation
              </button>
              <button
                type="button"
                onClick={() => onSelect(scenario, "truthful")}
                className="rounded-lg border border-violet-300/50 bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-100"
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
