import { motion, AnimatePresence } from "framer-motion";
import { FaClock, FaFingerprint, FaSearch, FaShieldAlt } from "react-icons/fa";
import ScenarioSelector from "../components/ScenarioSelector";
import QuestionFlow from "../components/QuestionFlow";
import ResultDashboard from "../components/ResultDashboard";

function MainScreen({
  phase,
  scenarios,
  selectedScenario,
  onSelectScenario,
  onQuestionnaireComplete,
  demoMode,
  apiBase,
  isLoading,
  result,
  onRestart,
}) {
  const isLanding = phase === "select";

  return (
    <div className="pattern-grid min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="relative overflow-hidden rounded-2xl border border-violet-300/20 bg-steel/65 p-6 shadow-panel backdrop-blur">
          <div className="pointer-events-none absolute -left-8 top-10 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 bottom-2 h-28 w-28 rounded-full bg-fuchsia-500/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-neon/90">Detective Command Console</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                TruthTrace Lie Detection Desk
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100/85">
                Interrogate statements like a field investigator: capture behavioral timing,
                detect contradictions, and uncover narrative drift across every response.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-black/30 px-3 py-1.5 text-violet-100">
                  <FaFingerprint className="text-neon" />
                  Linguistic Forensics
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-black/30 px-3 py-1.5 text-violet-100">
                  <FaSearch className="text-neon" />
                  Contradiction Tracing
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-black/30 px-3 py-1.5 text-violet-100">
                  <FaClock className="text-neon" />
                  Timing Pattern Analysis
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-violet-300/25 bg-black/30 p-4 text-sm text-violet-100/90 lg:w-72">
              <p className="text-[11px] uppercase tracking-[0.2em] text-neon/90">Live Protocol</p>
              <div className="mt-2 space-y-2">
                <p className="flex items-center gap-2">
                  <FaShieldAlt className="text-neon" />
                  Decision Support Mode Active
                </p>
                <p className="rounded-md border border-violet-300/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-100/85">
                  {isLanding
                    ? "Select a case file to begin interrogation sequence."
                    : "Interrogation sequence in progress."}
                </p>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35 }}
            >
              <ScenarioSelector scenarios={scenarios} onSelect={onSelectScenario} />
            </motion.div>
          )}

          {phase === "questions" && selectedScenario && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35 }}
            >
              <QuestionFlow
                scenario={selectedScenario}
                demoMode={demoMode}
                apiBase={apiBase}
                onComplete={onQuestionnaireComplete}
              />
            </motion.div>
          )}

          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-white/10 bg-steel/60 p-10 text-center shadow-panel"
            >
              <div className="mx-auto mb-5 flex w-16 gap-1">
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.2s]" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.4s]" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.6s]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Analyzing Behavioral Signals...</h2>
              <p className="mt-2 text-sm text-violet-100/80">
                Computing behavioral timing, semantic consistency, and contradiction signals.
              </p>
              {isLoading ? null : null}
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.35 }}
            >
              <ResultDashboard result={result} onRestart={onRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MainScreen;
