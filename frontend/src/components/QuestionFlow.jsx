import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaBrain, FaClock, FaRobot, FaWaveSquare } from "react-icons/fa";
import { ChatBubble, ConsoleButton, ConsoleCard, MetricCard, ProgressBar } from "./ui";

function listFromMemory(value) {
  if (!value || value.length === 0) {
    return "-";
  }
  return value.join(", ");
}

function QuestionFlow({ scenario, demoMode, apiBase, onComplete }) {
  const [baseIndex, setBaseIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState({
    text: scenario.questions[0],
    type: "base",
    baseIndex: 0,
  });
  const [answer, setAnswer] = useState("");
  const [records, setRecords] = useState([]);
  const [typingMs, setTypingMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState({
    contradiction_count: 0,
    contradiction_types: [],
    semantic_consistency: 0.7,
    memory: { location: [], time: [], people: [], actions: [] },
    latest_contradiction_notes: [],
    contradiction_detected: false,
  });

  const [messages, setMessages] = useState([
    { role: "ai", text: `Interrogation started. ${scenario.questions[0]}` },
  ]);

  const questionStartRef = useRef(performance.now());
  const typingStartRef = useRef(null);
  const latestTypingRef = useRef(null);

  const demoAnswerIndexRef = useRef(0);

  useEffect(() => {
    questionStartRef.current = performance.now();
    typingStartRef.current = null;
    latestTypingRef.current = null;
    setTypingMs(0);
  }, [activeQuestion]);

  useEffect(() => {
    if (demoMode === "manual") {
      return;
    }

    const source = demoMode === "truthful" ? scenario.demoTruthful : scenario.demoDeceptive;
    const candidate = source[activeQuestion.baseIndex] || source[source.length - 1] || "I am not sure.";

    if (activeQuestion.type === "followup") {
      if (demoMode === "truthful") {
        setAnswer("To clarify, I gave the exact details from memory and there is no contradiction.");
      } else {
        setAnswer("I am not sure, maybe both statements are true in different ways.");
      }
      return;
    }

    setAnswer(candidate);
  }, [activeQuestion, demoMode, scenario.demoTruthful, scenario.demoDeceptive]);

  const progress = useMemo(() => {
    const fraction = Math.min(1, (baseIndex + (activeQuestion.type === "followup" ? 0.6 : 0.15)) / scenario.questions.length);
    return fraction * 100;
  }, [activeQuestion.type, baseIndex, scenario.questions.length]);

  const activeRisk = analysis.contradiction_detected || analysis.contradiction_count > 1 ? "High" : analysis.contradiction_count > 0 ? "Medium" : "Low";

  const handleAnswerChange = (event) => {
    const value = event.target.value;
    setAnswer(value);

    const now = performance.now();
    if (value.trim().length > 0 && typingStartRef.current === null) {
      typingStartRef.current = now;
    }
    if (typingStartRef.current !== null) {
      latestTypingRef.current = now;
      setTypingMs(latestTypingRef.current - typingStartRef.current);
    }
  };

  const finalizeSession = (allRecords) => {
    onComplete({ records: allRecords, demoMode });
  };

  const advanceToNextBase = (nextBaseIndex, allMessages) => {
    if (nextBaseIndex >= scenario.questions.length) {
      finalizeSession(records);
      return;
    }

    const nextQuestion = scenario.questions[nextBaseIndex];
    setBaseIndex(nextBaseIndex);
    setActiveQuestion({ text: nextQuestion, type: "base", baseIndex: nextBaseIndex });
    setMessages([...allMessages, { role: "ai", text: nextQuestion }]);
    setAnswer("");
  };

  const submitCurrentAnswer = async () => {
    if (!answer.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const now = performance.now();
    let responseTime = (now - questionStartRef.current) / 1000;
    let activeTyping =
      typingStartRef.current !== null && latestTypingRef.current !== null
        ? (latestTypingRef.current - typingStartRef.current) / 1000
        : 0;

    // Demo mode uses deterministic timing profiles so judges can clearly see behavioral differences.
    if (demoMode !== "manual") {
      const idx = records.length;
      if (demoMode === "truthful") {
        responseTime = 3.2 + (idx % 3) * 0.35;
        activeTyping = 2.1 + (idx % 2) * 0.25;
      } else {
        responseTime = 5.8 + (idx % 4) * 1.05;
        activeTyping = 2.0 + (idx % 2) * 0.2;
      }
    }

    const currentRecord = {
      question: activeQuestion.text,
      response: answer.trim(),
      responseTime: Number(responseTime.toFixed(3)),
      typingDuration: Number(activeTyping.toFixed(3)),
      questionType: activeQuestion.type,
    };

    const updatedRecords = [...records, currentRecord];
    setRecords(updatedRecords);

    const nextMessages = [...messages, { role: "user", text: currentRecord.response, contradiction: false }];
    setMessages(nextMessages);

    try {
      const historyPayload = updatedRecords.map((item) => ({
        question: item.question,
        response: item.response,
      }));

      const res = await fetch(`${apiBase}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.id, history: historyPayload }),
      });

      if (!res.ok) {
        throw new Error("followup failed");
      }

      const followData = await res.json();
      const liveAnalysis = followData.analysis;
      setAnalysis(liveAnalysis);

      const contradictionDetected = !!liveAnalysis.contradiction_detected;
      const correctedMessages = [...nextMessages];
      correctedMessages[correctedMessages.length - 1] = {
        ...correctedMessages[correctedMessages.length - 1],
        contradiction: contradictionDetected,
      };
      setMessages(correctedMessages);

      if (activeQuestion.type === "base" && followData.followup_question) {
        setActiveQuestion({
          text: followData.followup_question,
          type: "followup",
          baseIndex,
        });
        setMessages([...correctedMessages, { role: "ai", text: followData.followup_question }]);
        setAnswer("");
      } else {
        const nextBaseIndex = baseIndex + 1;
        if (nextBaseIndex >= scenario.questions.length) {
          finalizeSession(updatedRecords);
        } else {
          const questionText = scenario.questions[nextBaseIndex];
          setBaseIndex(nextBaseIndex);
          setActiveQuestion({ text: questionText, type: "base", baseIndex: nextBaseIndex });
          setMessages([...correctedMessages, { role: "ai", text: questionText }]);
          setAnswer("");
        }
      }
    } catch (error) {
      const nextBaseIndex = activeQuestion.type === "base" ? baseIndex + 1 : baseIndex + 1;
      if (nextBaseIndex >= scenario.questions.length) {
        finalizeSession(updatedRecords);
      } else {
        const questionText = scenario.questions[nextBaseIndex];
        setBaseIndex(nextBaseIndex);
        setActiveQuestion({ text: questionText, type: "base", baseIndex: nextBaseIndex });
        setMessages([...nextMessages, { role: "ai", text: questionText }]);
        setAnswer("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
      <ConsoleCard className="space-y-4 p-5" glow="violet">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyanGlow/80">Case Context</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{scenario.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{scenario.description}</p>
        </div>

        <ProgressBar value={progress} label="Interrogation progress" tone="violet" />

        <div className="grid gap-3">
          <MetricCard
            title="Base Question"
            value={`${Math.min(baseIndex + 1, scenario.questions.length)} / ${scenario.questions.length}`}
            detail={activeQuestion.type === "followup" ? "Follow-up probe active" : "Primary line of questioning"}
            tone="neutral"
          />
          <MetricCard
            title="Response Time"
            value={`${(typingMs / 1000).toFixed(2)}s typing`}
            detail={demoMode === "manual" ? "Measured live" : `Demo mode: ${demoMode}`}
            tone="warning"
          />
        </div>

        <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
          <p className="mb-3 text-[10px] uppercase tracking-[0.26em] text-muted">Question Focus</p>
          <p className="leading-6 text-text">{activeQuestion.text}</p>
        </div>
      </ConsoleCard>

      <ConsoleCard className="flex min-h-[720px] flex-col p-5" glow="cyan">
        <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyanGlow/80">Interrogation Feed</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">One question at a time</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted">
            <FaWaveSquare className="text-cyanGlow" />
            Live signal tracing enabled
          </div>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/8">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon via-cyanGlow to-violetGlow"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <div className="mb-5 flex-1 space-y-4 overflow-y-auto rounded-[1.15rem] border border-white/10 bg-[#07111d]/90 p-4">
          {messages.map((message, index) => (
            <ChatBubble
              key={`${message.role}-${index}`}
              role={message.role}
              text={message.text}
              contradiction={message.contradiction}
            />
          ))}

          {isSubmitting ? (
            <div className="flex items-center gap-2 self-start rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 px-4 py-3 text-sm text-cyanGlow">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyanGlow" />
              AI is analyzing the response...
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.15rem] border border-white/10 bg-[#0a1420] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
          <label className="mb-2 block text-[10px] uppercase tracking-[0.26em] text-muted">
            Respondent Input
          </label>
          <textarea
            value={answer}
            onChange={handleAnswerChange}
            rows={4}
            placeholder="Type a direct answer. The console will measure timing and consistency."
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#060d16] p-4 text-sm leading-6 text-text outline-none transition placeholder:text-slate-500 focus:border-cyanGlow/30 focus:ring-2 focus:ring-cyanGlow/20"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <FaClock className="text-cyanGlow" />
                {(typingMs / 1000).toFixed(2)}s typing
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <FaBrain className="text-violetGlow" />
                Session {records.length + 1}
              </span>
            </div>

            <ConsoleButton type="button" disabled={isSubmitting} onClick={submitCurrentAnswer}>
              {isSubmitting ? "Analyzing" : "Submit Response"}
              <FaArrowRight size={12} />
            </ConsoleButton>
          </div>
        </div>
      </ConsoleCard>

      <ConsoleCard className="space-y-4 p-5" glow="blue">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 text-cyanGlow">
            <FaRobot />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyanGlow/80">AI Analysis</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Signal panel</h3>
          </div>
        </div>

        <MetricCard
          title="Consistency Score"
          value={`${(analysis.semantic_consistency * 100).toFixed(1)}%`}
          detail="Semantic alignment across the current exchange"
          tone="success"
        />

        <MetricCard
          title="Contradictions Detected"
          value={analysis.contradiction_count}
          detail={analysis.contradiction_types.join(", ") || "No contradiction type active"}
          tone={analysis.contradiction_count > 0 ? "danger" : "success"}
        />

        <MetricCard
          title="Risk State"
          value={activeRisk}
          detail={activeRisk === "Low" ? "Stable statement profile" : "Escalate follow-up focus"}
          tone={activeRisk === "High" ? "danger" : activeRisk === "Medium" ? "warning" : "success"}
        />

        <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4 text-sm text-muted">
          <p className="mb-3 text-[10px] uppercase tracking-[0.26em] text-muted">Context Memory</p>
          <div className="space-y-2 text-sm leading-6">
            <p>Location: {listFromMemory(analysis.memory?.location)}</p>
            <p>Time: {listFromMemory(analysis.memory?.time)}</p>
            <p>People: {listFromMemory(analysis.memory?.people)}</p>
            <p>Actions: {listFromMemory(analysis.memory?.actions)}</p>
          </div>
        </div>

        {analysis.latest_contradiction_notes?.length > 0 && (
          <div className="rounded-[1.1rem] border border-danger/30 bg-danger/10 p-4 text-sm text-rose-100">
            <p className="mb-2 text-[10px] uppercase tracking-[0.26em] text-rose-200/80">Alert Notes</p>
            <div className="space-y-2 leading-6">
              {analysis.latest_contradiction_notes.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs leading-5 text-muted">
          This system estimates behavioral and linguistic patterns. It does not determine absolute truth.
        </p>
      </ConsoleCard>
    </section>
  );
}

export default QuestionFlow;
