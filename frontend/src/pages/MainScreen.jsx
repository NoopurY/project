import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";
import ScenarioSelector from "../components/ScenarioSelector";
import QuestionFlow from "../components/QuestionFlow";
import ResultDashboard from "../components/ResultDashboard";
import { ConsoleCard } from "../components/ui";

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
    <div className="pattern-grid min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <ConsoleCard className="overflow-hidden px-5 py-4 sm:px-6" glow="violet">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyanGlow/90">
                Behavioral Intelligence Suite
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                Behavioral Lie Detection System
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                Intelligence-grade interrogation console for contradiction detection,
                response analysis, and risk scoring in high-stakes reviews.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-3 text-cyanGlow shadow-[0_0_24px_rgba(34,211,238,0.12)]">
              <FaShieldAlt />
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyanGlow/75">System Status</p>
                <p className="text-sm font-medium text-white">For investigative decision support</p>
              </div>
            </div>
          </div>
        </ConsoleCard>

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
              className="rounded-[1.35rem] border border-white/10 bg-[#0f1724]/80 p-10 text-center shadow-glow backdrop-blur-xl"
            >
              <div className="mx-auto mb-5 flex w-16 gap-1">
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.2s]" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.4s]" />
                <span className="h-6 w-1 animate-pulseLine rounded bg-neon [animation-delay:0.6s]" />
              </div>
              <h2 className="text-xl font-semibold text-white">Analyzing behavioral signals</h2>
              <p className="mt-2 text-sm text-muted">
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
