import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaRobot } from "react-icons/fa";

function bubbleClass(role, contradiction) {
  if (role === "ai") {
    return "self-start bg-[#191129] border border-violet-300/35 text-violet-50";
  }
  if (contradiction) {
    return "self-end bg-rose-500/20 border border-rose-300/50 text-rose-100";
  }
  return "self-end bg-[#24173a] border border-violet-200/20 text-violet-50";
}

function listFromMemory(value) {
  if (!value || value.length === 0) {
    return "-";
  }
  return value.join(", ");
}

function buildDemoFollowupAnswer({ scenarioId, mode, questionText }) {
  const q = (questionText || "").toLowerCase();

  const truthful = {
    theft: {
      who: "My manager and one colleague were around the storage section during that period.",
      where: "I was in the office storage corridor and then moved directly toward the exit.",
      time: "The main sequence was around 9:05 to 9:10 pm, and I reached home at about 10:10 pm.",
      action: "I picked up my charger, informed my manager, and then drove home.",
      default: "To be precise: office storage corridor at around 9:05-9:10 pm, then home by 10:10 pm.",
    },
    academic: {
      who: "No one helped me with answers; I worked independently during the exam.",
      where: "I prepared in the campus library and completed the exam in the exam hall.",
      time: "Preparation was 7 to 9 pm, and the exam timeline was 10:00 to 11:20 am.",
      action: "I revised my notes, attempted the paper alone, and submitted at 11:20 am.",
      default: "My account is: library prep, no answer-sharing, then a 10:00-11:20 am exam.",
    },
    workplace: {
      who: "My manager was the first person I spoke to immediately after the incident.",
      where: "I was in the office hallway just before the incident and stayed in that area.",
      time: "It occurred around 3:40 pm and I filed the report within about fifteen minutes.",
      action: "I informed my supervisor first and filed the report with the same timeline details.",
      default: "The sequence is consistent: hallway before event, manager informed, then report filed.",
    },
  };

  const deceptive = {
    theft: {
      who: "I was alone, but maybe my friend and brother were somewhere nearby.",
      where: "I was at home, and also outside near the storage side for a short time.",
      time: "It was around 9 pm, maybe closer to midnight, or maybe around 8.",
      action: "I did not enter there, though I may have used the access card once.",
      default: "I already explained it, but some details may sound different because it happened fast.",
    },
    academic: {
      who: "No one helped me, except my classmate may have sent me something.",
      where: "I prepared at home, but some discussion happened near campus too.",
      time: "I submitted around 10, then started around 10:20, I think.",
      action: "I did not communicate answers, but we may have followed similar steps.",
      default: "I am not sure of the exact sequence, but both statements could be true in context.",
    },
    workplace: {
      who: "No one spoke first, although my manager may have spoken first.",
      where: "I was not in the hallway, I was outside near parking, then close to hallway.",
      time: "It was around 3:40 pm, roughly around that window.",
      action: "I did nothing right after it, then I called my manager immediately.",
      default: "Some details changed because I was stressed, but the overall account is similar.",
    },
  };

  const bank = mode === "truthful" ? truthful[scenarioId] : deceptive[scenarioId];
  if (!bank) {
    return mode === "truthful"
      ? "Let me clarify with specific details: exact place, exact time, and exact sequence."
      : "I am not fully sure of every detail, but that is what I remember.";
  }

  if (q.includes("who")) return bank.who;
  if (q.includes("where") || q.includes("location")) return bank.where;
  if (q.includes("time") || q.includes("timeline") || q.includes("sequence")) return bank.time;
  if (q.includes("action") || q.includes("did") || q.includes("happened")) return bank.action;
  return bank.default;
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
      setAnswer(
        buildDemoFollowupAnswer({
          scenarioId: scenario.id,
          mode: demoMode,
          questionText: activeQuestion.text,
        })
      );
      return;
    }

    setAnswer(candidate);
  }, [activeQuestion, demoMode, scenario.demoTruthful, scenario.demoDeceptive]);

  const progress = useMemo(() => {
    const fraction = Math.min(1, (baseIndex + (activeQuestion.type === "followup" ? 0.6 : 0.15)) / scenario.questions.length);
    return fraction * 100;
  }, [activeQuestion.type, baseIndex, scenario.questions.length]);

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
    <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="rounded-2xl border border-white/10 bg-steel/60 p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between text-sm text-violet-100/80">
          <span>Scenario: {scenario.title}</span>
          <span>
            Base Question {Math.min(baseIndex + 1, scenario.questions.length)} / {scenario.questions.length}
          </span>
        </div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#10091a]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-neon to-ember"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        <div className="mb-4 flex h-[420px] flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-[#0c0917] p-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${bubbleClass(message.role, message.contradiction)}`}>
              <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-violet-100/70">
                {message.role === "ai" ? "AI Interrogator" : "Respondent"}
              </p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#130d20] p-3">
          <textarea
            value={answer}
            onChange={handleAnswerChange}
            rows={4}
            placeholder="Enter your response..."
            className="w-full rounded-lg border border-white/10 bg-[#0d0918] p-3 text-sm text-violet-50 outline-none ring-neon/50 transition focus:ring"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-violet-100/80">Typing duration: {(typingMs / 1000).toFixed(2)}s</div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={submitCurrentAnswer}
              className="inline-flex items-center gap-2 rounded-lg bg-neon px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {isSubmitting ? "Analyzing..." : "Submit Response"}
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-steel/60 p-5 shadow-panel">
        <div className="flex items-center gap-2 text-neon">
          <FaRobot />
          <h3 className="text-base font-semibold text-white">AI Analysis Panel</h3>
        </div>

        <div className="grid gap-2 text-sm">
          <div className="rounded-lg border border-white/10 bg-[#0d0918] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-violet-200/55">Semantic Consistency</p>
            <p className="mt-1 text-lg font-semibold text-white">{(analysis.semantic_consistency * 100).toFixed(1)}%</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0d0918] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-violet-200/55">Contradiction Count</p>
            <p className={`mt-1 text-lg font-semibold ${analysis.contradiction_count > 0 ? "text-rose-300" : "text-emerald-300"}`}>
              {analysis.contradiction_count}
            </p>
            <p className="mt-1 text-xs text-violet-100/70">{analysis.contradiction_types.join(", ") || "No active contradiction type"}</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0d0918] p-3 text-xs text-violet-100/80">
          <p className="mb-2 uppercase tracking-[0.12em] text-violet-200/55">Context Memory</p>
          <p>Location: {listFromMemory(analysis.memory?.location)}</p>
          <p>Time: {listFromMemory(analysis.memory?.time)}</p>
          <p>People: {listFromMemory(analysis.memory?.people)}</p>
          <p>Actions: {listFromMemory(analysis.memory?.actions)}</p>
        </div>

        {analysis.latest_contradiction_notes?.length > 0 && (
          <div className="rounded-lg border border-rose-300/40 bg-rose-500/10 p-3 text-xs text-rose-100">
            {analysis.latest_contradiction_notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-violet-100/65">
          This system estimates behavioral and linguistic patterns. It does not determine absolute truth.
        </p>
      </div>
    </section>
  );
}

export default QuestionFlow;
