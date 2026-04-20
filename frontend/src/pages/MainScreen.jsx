import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";
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
  return (
    <div className="pattern-grid min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-2xl border border-white/10 bg-steel/60 p-6 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-neon/80">Behavioral Intelligence Suite</p>
              <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Behavioral Lie Detection System
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                AI-driven interrogation assistant with adaptive counter-questioning,
                contradiction detection, and semantic consistency analysis.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-neon/40 bg-neon/10 px-4 py-2 text-neon">
              <FaShieldAlt />
              <span className="text-sm font-medium">For Investigative Decision Support</span>
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
              <p className="mt-2 text-sm text-slate-300">
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
