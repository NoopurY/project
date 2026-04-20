import { useState } from "react";
import MainScreen from "./pages/MainScreen";

const SCENARIOS = [
  {
    id: "theft",
    title: "Theft Investigation",
    description: "Interview concerning missing cash and access timelines.",
    questions: [
      "Where were you when the missing items were last seen?",
      "Who else had access to the storage area during your shift?",
      "Explain why your access logs show a late entry that night.",
      "What did you do after leaving the storage area?",
      "What time did you finally return home?",
    ],
    demoTruthful: [
      "I was in the office storage corridor around 9:05 pm when the issue was reported.",
      "My manager and one colleague also had storage access during that period.",
      "I entered once at 9:10 pm to pick up my charger from the same office area.",
      "After leaving the office area, I informed my manager and then drove straight home.",
      "I reached home at around 10:10 pm and remained there for the rest of the night.",
    ],
    demoDeceptive: [
      "I was at home around 9 pm, completely alone.",
      "My friend and brother were with me near the office storage room.",
      "I never entered that area, and I also used my access card once.",
      "I stayed outside the whole time, not at home.",
      "I reached home after midnight, maybe around 8 pm.",
    ],
  },
  {
    id: "academic",
    title: "Academic Dishonesty",
    description: "Inquiry into unusual similarities in submitted exam responses.",
    questions: [
      "Describe how you prepared for the exam in your own words.",
      "Did you communicate with anyone about exam questions before or during the test?",
      "How do you explain identical mistakes found in your and another student's paper?",
      "Walk through your timeline between receiving and submitting the exam.",
      "Who sat near you during the test?",
    ],
    demoTruthful: [
      "I studied in the campus library from 7 pm to 9 pm using my revision notes.",
      "No, I did not communicate about exam answers before or during the test.",
      "The similar mistakes likely came from using the same revision notes from class.",
      "I began at 10:00 am and submitted my exam at 11:20 am.",
      "My classmate was seated two rows away and we did not interact during the test.",
    ],
    demoDeceptive: [
      "I prepared at home last night and did not study with anyone.",
      "I never communicated with anyone, but my classmate sent me the answers.",
      "I never saw the other paper, yet we wrote the same steps together.",
      "I submitted at 10 am, then I started the exam at 10:20 am.",
      "I was alone, though my friend was sitting right next to me.",
    ],
  },
  {
    id: "workplace",
    title: "Workplace Incident",
    description: "Internal interview about conflicting accounts during an incident.",
    questions: [
      "What happened in the minutes before the incident occurred?",
      "Why does your report differ from other team members' statements?",
      "What actions did you take immediately after the event?",
      "Did you withhold any detail when filing your initial report?",
      "Who first spoke to you after the incident?",
    ],
    demoTruthful: [
      "I was in the office hallway at around 3:40 pm immediately before the incident.",
      "My report emphasized the safety steps and timing from that same hallway location.",
      "I informed my supervisor and filed the incident report within fifteen minutes.",
      "No, I did not withhold details and my report matched the timeline I provided.",
      "My manager was the first person I spoke to after the incident.",
    ],
    demoDeceptive: [
      "I was in the office hallway at 3:40 pm and alone.",
      "I was not in that hallway; I was outside near parking.",
      "I did nothing after the event, then I called my manager immediately.",
      "I included all details, except the part I intentionally skipped.",
      "No one spoke to me first, my manager spoke to me first.",
    ],
  },
];

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function App() {
  const [phase, setPhase] = useState("select");
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [demoMode, setDemoMode] = useState("manual");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectScenario = (scenario, mode = "manual") => {
    setSelectedScenario(scenario);
    setDemoMode(mode);
    setResult(null);
    setPhase("questions");
  };

  const handleQuestionnaireComplete = async (session) => {
    setPhase("loading");
    setIsLoading(true);

    try {
      const records = session.records;
      const payload = {
        responses: records.map((record) => record.response),
        times: records.map((record) => record.responseTime),
        typing_durations: records.map((record) => record.typingDuration),
        demo_mode: session.demoMode || demoMode,
      };

      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to process prediction.");
      }

      const data = await response.json();
      setResult(data);
      setPhase("result");
    } catch (error) {
      setResult({
        probability: 0,
        risk: "Medium",
        contradictions: 0,
        metrics: {},
        explanation: [
          "The API could not be reached. Ensure FastAPI is running on http://127.0.0.1:8000.",
        ],
        model_used: "Unavailable",
        disclaimer:
          "This system estimates behavioral and linguistic patterns. It does not determine absolute truth.",
      });
      setPhase("result");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setSelectedScenario(null);
    setDemoMode("manual");
    setResult(null);
    setPhase("select");
  };

  return (
    <MainScreen
      phase={phase}
      scenarios={SCENARIOS}
      selectedScenario={selectedScenario}
      onSelectScenario={handleSelectScenario}
      onQuestionnaireComplete={handleQuestionnaireComplete}
      demoMode={demoMode}
      apiBase={API_BASE}
      isLoading={isLoading}
      result={result}
      onRestart={handleRestart}
    />
  );
}

export default App;
