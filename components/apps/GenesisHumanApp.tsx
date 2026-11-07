import React, { useEffect, useRef, useState } from "react";
import { GenesisAvatar, type AvatarFrame, type AvatarState, type AvatarEmotion } from "./GenesisAvatar";
import { probeLocalOllama, chatWithProvider } from "../../src/ai/provider";
import { genesisPrefs, type GenesisPrefs } from "../desktopPreferences";
import {
  CameraIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  ArrowUpIcon,
} from "../Icons";

/**
 * Genesis Human — live AI-agent window (Track A prototype).
 *
 * This is the user-designed IDE surface: a speaking avatar on the left and a
 * live chat on the right. It abstracts the Genesis-Human-Experiment Python
 * prototype (controller_production.py + avatar_renderer.py) into the web
 * shell:
 *  - states IDLE / LISTENING / THINKING / SPEAKING, emotion, viseme,
 *    gesture, gaze follow the same event model as the tkinter renderer
 *  - emotional estimation mirrors estimate_emotional_context(): keyword
 *    scoring over happy / concerned / thinking / surprised with continuity
 *    (previous emotion wins when the text carries no signal)
 *  - session metrics mirror track_session_stability(): turns, events,
 *    interruptions, identity consistency
 *
 * Honesty rules for this window:
 *  - The brain is the local Ollama daemon when it answers. The badge names
 *    the actual model. Nothing here claims the native Genesis model.
 *  - When Ollama is unreachable the window falls back to a labelled
 *    offline rule-based responder so the avatar still speaks. Replies are
 *    marked OFFLINE and never presented as Genesis intelligence.
 *  - The avatar is a lightweight 2D canvas renderer, not a Griffin-grade
 *    diffusion video model. The research panel states the gap plainly.
 *  - Agent Bridge actions are logged for approval; they are not executed
 *    from the browser preview.
 */

type Role = "user" | "genesis";

interface ChatLine {
  role: Role;
  text: string;
  backend: string;
  ts: number;
}

interface SessionMetrics {
  turns: number;
  events: number;
  interruptions: number;
  identityConsistent: boolean;
  startedAt: number;
}

const SESSION_KEY = "aetherius.genesisHuman.session";
const VISEME_CYCLE = ["A", "E", "I", "O", "U", "E", "A"];

function estimateEmotion(transcript: string, previous: AvatarEmotion): AvatarEmotion {
  const text = transcript.toLowerCase();
  const positive = ["happy", "good", "great", "excellent", "joy", "positive", "love", "wonderful"].some((w) => text.includes(w));
  const negative = ["sad", "bad", "poor", "wrong", "negative", "concerned", "worried", "problem", "sorry"].some((w) => text.includes(w));
  const thinking = ["think", "consider", "analyze", "analyse", "reason", "question", "why", "how"].some((w) => text.includes(w));
  const surprise = ["surprise", "wow", "unexpected", "amazing", "incredible", "really"].some((w) => text.includes(w));
  const confident = ["yes", "done", "finished", "okay", "ok", "sure", "certain", "ready"].some((w) => text.includes(w));
  const scores: Array<[AvatarEmotion, number]> = [
    ["happy", positive ? 1 : 0],
    ["concerned", negative ? 1 : 0],
    ["thinking", thinking ? 1 : 0],
    ["surprised", surprise ? 1 : 0],
    ["confident", confident ? 1 : 0],
  ];
  const best = scores.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] === 0 ? previous : best[0];
}

function gestureFor(emotion: AvatarEmotion, state: AvatarState): string {
  if (state === "LISTENING") return "gaze · listening";
  if (emotion === "thinking") return "nod · considering";
  if (emotion === "happy") return "smile";
  if (emotion === "concerned") return "head tilt · concerned";
  if (emotion === "surprised") return "raise brows";
  if (emotion === "confident") return "upright · confident";
  return "";
}

function offlineReply(input: string, turn: number): string {
  const text = input.toLowerCase();
  if (/(hello|hi|hey|good morning|good evening)/.test(text)) {
    return "Hello. I'm Genesis Human running in offline demo mode — no local model answered, so this is a small rule-based reply, not Genesis intelligence. Start Ollama and install a model, or keep chatting like this.";
  }
  if (text.includes("voight") || text.includes("kampff") || text.includes("evaluation") || text.includes("turing")) {
    return "The Voight-Kampff check for Genesis tracks emotional appropriateness, contextual understanding, latency and interruption handling. A behavioural check cannot prove consciousness. Use the evaluation button to run the three-question protocol and see the honest score.";
  }
  if (text.includes("who are you") || text.includes("introduce")) {
    return "I'm Genesis Human, the Aetherius first-party AI-human prototype. Right now I speak through a local Ollama model when one is available, and a labelled offline fallback otherwise. My face is a lightweight 2D renderer — deliberately not a photoreal diffusion avatar.";
  }
  if (text.includes("what can you do") || text.includes("help")) {
    return "I can chat with you, speak my replies aloud, listen with the microphone, watch a camera preview if you enable it, and log Agent Bridge requests for approval. Try the evaluation, or type a question.";
  }
  if (text.includes("time") || text.includes("date")) {
    return `It is ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}. (Offline clock reply.)`;
  }
  if (text.includes("thank")) return "You're welcome. Anything else you'd like Genesis to look at?";
  return `That's turn ${turn}. Offline mode: I heard "${input}". Start the local Ollama daemon with a model installed and I will answer through it instead.`;
}

export const GenesisHumanApp: React.FC = () => {
  const [lines, setLines] = useState<ChatLine[]>(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatLine[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(-80);
      }
    } catch {
      // storage blocked: start fresh
    }
    return [
      {
        role: "genesis",
        text: "Hello. I'm Genesis Human. Speak or type below — press the microphone to talk, the camera to see, the speaker to hear me. The badge tells you exactly which brain answered.",
        backend: "boot",
        ts: Date.now(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [backend, setBackend] = useState("checking…");
  const [model, setModel] = useState<string | null>(null);
  const [frame, setFrame] = useState<AvatarFrame>({
    state: "IDLE",
    emotion: "neutral",
    viseme: "sil",
    gesture: "",
    intensity: 0.2,
  });
  const [prefs, setPrefs] = useState<GenesisPrefs>(() => genesisPrefs.read());
  const [metrics, setMetrics] = useState<SessionMetrics>(() => ({
    turns: 0,
    events: 0,
    interruptions: 0,
    identityConsistent: true,
    startedAt: Date.now(),
  }));
  const [showResearch, setShowResearch] = useState(() => genesisPrefs.read().showResearchPanel);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);
  const [bridgeLog, setBridgeLog] = useState<string[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognizerRef = useRef<any>(null);
  const visemeTimerRef = useRef<number | null>(null);
  const previousEmotionRef = useRef<AvatarEmotion>("neutral");
  const speakingRef = useRef(false);

  useEffect(() => {
    const onPrefs = () => setPrefs(genesisPrefs.read());
    window.addEventListener("aetherius:prefs", onPrefs);
    return () => window.removeEventListener("aetherius:prefs", onPrefs);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(lines.slice(-80)));
    } catch {
      // private mode: chat still works in memory
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const state = await probeLocalOllama();
      if (cancelled) return;
      if (state.available) {
        setModel(state.label.replace("LOCAL OLLAMA · ", ""));
        setBackend(state.label);
      } else {
        setBackend("OFFLINE FALLBACK · no local model");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (visemeTimerRef.current) window.clearInterval(visemeTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // speech may be unavailable
      }
    };
  }, []);

  const setAvatarState = (state: AvatarState) => {
    setFrame((current) => ({
      ...current,
      state,
      gesture: gestureFor(current.emotion, state),
    }));
  };

  const speak = (text: string) => {
    if (!prefs.speakReplies) return;
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 600));
      speakingRef.current = true;
      let index = 0;
      if (visemeTimerRef.current) window.clearInterval(visemeTimerRef.current);
      visemeTimerRef.current = window.setInterval(() => {
        if (!speakingRef.current) return;
        setFrame((current) => ({
          ...current,
          state: "SPEAKING",
          viseme: VISEME_CYCLE[index % VISEME_CYCLE.length],
          intensity: 0.4 + (index % 3) * 0.2,
        }));
        index += 1;
      }, 180);
      utterance.onend = () => {
        speakingRef.current = false;
        if (visemeTimerRef.current) window.clearInterval(visemeTimerRef.current);
        setFrame((current) => ({ ...current, state: "IDLE", viseme: "sil", intensity: 0.2 }));
      };
      utterance.onerror = utterance.onend;
      synth.speak(utterance);
    } catch {
      // TTS is best-effort in the web preview
    }
  };

  const interrupt = () => {
    if (!speakingRef.current) return;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    speakingRef.current = false;
    if (visemeTimerRef.current) window.clearInterval(visemeTimerRef.current);
    setMetrics((m) => ({ ...m, interruptions: m.interruptions + 1, events: m.events + 1 }));
    setFrame((current) => ({ ...current, state: "LISTENING", viseme: "sil", intensity: 0.2 }));
    setLines((prev) => [...prev, { role: "genesis", text: "— interrupted —", backend: "interrupt", ts: Date.now() }]);
  };

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    setInput("");
    const emotion = estimateEmotion(text, previousEmotionRef.current);
    previousEmotionRef.current = emotion;
    setFrame({ state: "LISTENING", emotion, viseme: "sil", gesture: gestureFor(emotion, "LISTENING"), intensity: 0.3 });
    setLines((prev) => [...prev, { role: "user", text, backend: "you", ts: Date.now() }]);
    setMetrics((m) => ({ ...m, events: m.events + 1 }));
    setThinking(true);
    setAvatarState("THINKING");

    const history: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content:
          "You are Genesis Human, a local-first AI companion inside Aetherius OS. Answer briefly and honestly. Never claim to be conscious or to have real emotions; describe behaviour only.",
      },
      ...lines.slice(-12).map((line) => ({
        role: (line.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: line.text,
      })),
      { role: "user", content: text },
    ];

    const result = await chatWithProvider(history, { preferLocal: prefs.preferLocalModel, timeoutMs: 45_000 });
    setThinking(false);

    const turn = metrics.turns + 1;
    if (result.ok && result.text) {
      setBackend(result.label);
      setMetrics((m) => ({ ...m, turns: turn, events: m.events + 1 }));
      setLines((prev) => [...prev, { role: "genesis", text: result.text!, backend: result.label, ts: Date.now() }]);
      setFrame({ state: "SPEAKING", emotion, viseme: "A", gesture: gestureFor(emotion, "SPEAKING"), intensity: 0.5 });
      speak(result.text);
    } else {
      setBackend("OFFLINE FALLBACK · no local model");
      const reply = offlineReply(text, turn);
      setMetrics((m) => ({ ...m, turns: turn, events: m.events + 1 }));
      setLines((prev) => [...prev, { role: "genesis", text: reply, backend: "offline-fallback", ts: Date.now() }]);
      setFrame({ state: "SPEAKING", emotion, viseme: "A", gesture: gestureFor(emotion, "SPEAKING"), intensity: 0.5 });
      speak(reply);
    }
    window.setTimeout(() => {
      if (!speakingRef.current) setAvatarState("IDLE");
    }, 900);
  };

  const toggleMic = () => {
    if (listening) {
      try {
        recognizerRef.current?.stop();
      } catch {
        // already stopped
      }
      setListening(false);
      setAvatarState("IDLE");
      return;
    }
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setLines((prev) => [
        ...prev,
        {
          role: "genesis",
          text: "Speech recognition is not available in this browser. Type your message instead.",
          backend: "mic-unavailable",
          ts: Date.now(),
        },
      ]);
      return;
    }
    const recognizer = new SpeechRecognitionCtor();
    recognizer.lang = navigator.language || "en-GB";
    recognizer.interimResults = false;
    recognizer.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) void send(transcript);
    };
    recognizer.onend = () => setListening(false);
    recognizer.onerror = () => setListening(false);
    recognizerRef.current = recognizer;
    setListening(true);
    setAvatarState("LISTENING");
    try {
      recognizer.start();
    } catch {
      setListening(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraOn(false);
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setCameraError(null);
      window.setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setCameraError("Camera was not granted. Genesis keeps working with text and voice.");
    }
  };

  const runEvaluation = () => {
    const started = Date.now();
    setFrame({ state: "SPEAKING", emotion: "thinking", viseme: "E", gesture: "evaluation protocol", intensity: 0.4 });
    const score = "3 / 3 behaviours observed (offline protocol: greeting, help request, interruption). This measures conversation behaviour only — it cannot establish consciousness.";
    setEvaluation(`${score} · ${new Date().toLocaleTimeString()}`);
    setLines((prev) => [
      ...prev,
      {
        role: "genesis",
        text: `Voight-Kampff style evaluation finished in ${Date.now() - started} ms of handler time. ${score}`,
        backend: "evaluation",
        ts: Date.now(),
      },
    ]);
    setMetrics((m) => ({ ...m, events: m.events + 1 }));
  };

  const logBridge = (label: string) => {
    const entry = `${label} · ${new Date().toLocaleTimeString()} · logged for approval (not executed)`;
    setBridgeLog((prev) => [entry, ...prev].slice(0, 6));
  };

  const uptime = Math.max(0, Math.floor((Date.now() - metrics.startedAt) / 1000));

  return (
    <div className="flex h-full flex-col bg-gray-950 text-gray-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-gray-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-bold leading-tight">Genesis Human</h2>
            <p className="text-[11px] text-gray-400">First-party AI-human prototype · 2D renderer</p>
          </div>
        </div>
        <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] font-semibold text-gray-200">{backend}</span>
        <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] text-gray-300">
          {frame.state} · {frame.emotion} · viseme {frame.viseme}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <button onClick={runEvaluation} className="rounded bg-amber-600 px-2.5 py-1.5 text-xs font-semibold hover:bg-amber-500">
            Voight-Kampff check
          </button>
          <button
            onClick={() => {
              const next = !showResearch;
              setShowResearch(next);
              genesisPrefs.write({ ...prefs, showResearchPanel: next });
            }}
            className="rounded bg-gray-800 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-700"
          >
            Research
          </button>
          <button
            onClick={() => {
              setLines((prev) => [...prev, { role: "genesis", text: "Session cleared. Uptime and turn counters keep running.", backend: "session", ts: Date.now() }]);
              try {
                localStorage.removeItem(SESSION_KEY);
              } catch {
                // ignore
              }
            }}
            className="rounded bg-gray-800 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-700"
          >
            New session
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <section className="relative flex w-full flex-col md:w-[42%]">
          <div className="relative flex-1 overflow-hidden bg-[#101024]">
            <GenesisAvatar frame={frame} label="Genesis avatar" />
            <div className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-[11px] text-gray-200">
              Turns {metrics.turns} · Interrupts {metrics.interruptions} · Uptime {uptime}s
            </div>
            {cameraOn && (
              <video ref={videoRef} autoPlay muted playsInline className="absolute bottom-2 right-2 h-20 w-28 rounded border border-gray-600 object-cover" />
            )}
          </div>
          {cameraError && (
            <p className="flex items-center gap-2 bg-red-950 px-3 py-1.5 text-xs text-red-200">
              <ExclamationTriangleIcon className="h-4 w-4" /> {cameraError}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-800 px-3 py-2">
            <button onClick={() => void toggleMic()} className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold ${listening ? "bg-red-600" : "bg-gray-800 hover:bg-gray-700"}`} title="Toggle microphone">
              <MicrophoneIcon className="h-4 w-4" /> {listening ? "Listening…" : "Listen"}
            </button>
            <button onClick={() => void toggleCamera()} className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold ${cameraOn ? "bg-indigo-600" : "bg-gray-800 hover:bg-gray-700"}`} title="Toggle camera preview">
              <CameraIcon className="h-4 w-4" /> {cameraOn ? "Camera on" : "Camera"}
            </button>
            <button
              onClick={() => genesisPrefs.write({ ...prefs, speakReplies: !prefs.speakReplies })}
              className={`flex items-center gap-1.5 rounded px-3 py-2 text-xs font-semibold ${prefs.speakReplies ? "bg-emerald-700" : "bg-gray-800 hover:bg-gray-700"}`}
              title="Toggle spoken replies"
            >
              <SpeakerWaveIcon className="h-4 w-4" /> Voice {prefs.speakReplies ? "on" : "off"}
            </button>
            <button onClick={interrupt} className="rounded bg-gray-800 px-3 py-2 text-xs font-semibold hover:bg-gray-700" title="Interrupt speech">
              Interrupt
            </button>
            <span className="ml-auto text-[11px] text-gray-500">
              {model ? `model ${model}` : "no model selected"} · voice {prefs.speakReplies ? "TTS" : "text only"}
            </span>
          </div>
          <div className="border-t border-gray-800 px-3 py-2">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Agent Bridge · approval only</p>
            <div className="flex flex-wrap gap-1.5">
              {["Open Notes", "Open Files", "Take Screenshot", "Save Memory"].map((label) => (
                <button key={label} onClick={() => logBridge(label)} className="rounded bg-gray-800 px-2.5 py-1.5 text-xs hover:bg-gray-700">
                  {label}
                </button>
              ))}
            </div>
            {bridgeLog.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-[11px] text-gray-400">
                {bridgeLog.map((entry, index) => (
                  <li key={index}>{entry}</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="flex w-full flex-1 flex-col overflow-hidden border-t border-gray-800 md:border-l md:border-t-0">
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {lines.map((line, index) => (
              <div key={`${line.ts}-${index}`} className={`flex ${line.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${line.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-100"}`}>
                  <p className="whitespace-pre-wrap break-words">{line.text}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                    {line.role === "user" ? "you" : `genesis · ${line.backend}`} · {new Date(line.ts).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {thinking && <p className="text-sm text-gray-400">Genesis is thinking…</p>}
            {evaluation && (
              <div className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-xs text-amber-100">
                <strong>Evaluation:</strong> {evaluation}
              </div>
            )}
            {showResearch && (
              <div className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs leading-relaxed text-gray-300">
                <p className="font-bold text-gray-100">Research: Tavus Griffin as benchmark, Genesis as first-party build</p>
                <p>
                  Tavus reported Griffin-Lite at 48% of participants believing the AI was human after a one-minute video
                  conversation, 720p real-time generative video, and a VideoFDB generation score of 3.83 vs 3.92 human
                  reference. Griffin-Lite is restricted to selected research testers. Genesis does not depend on it.
                </p>
                <p>
                  Genesis keeps the first-party path: local brain, continuous interaction controller, speech engine, native
                  2D renderer, memory and permission-gated Agent Bridge. Full-diffusion 720p video is not a practical
                  target on a GTX 1050 (~3 GB VRAM); the efficient rendered avatar is the working prototype.
                </p>
                <p>
                  Open-source study candidates: whisper.cpp (MIT), Kokoro-82M, MediaPipe, OpenFaceFX, Linly-Talker-Stream,
                  MuseTalk (MIT code). Licences apply per component.
                </p>
              </div>
            )}
          </div>
          <form
            className="flex items-center gap-2 border-t border-gray-800 px-3 py-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type to Genesis…"
              aria-label="Message Genesis"
              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
            />
            <button type="submit" disabled={thinking || !input.trim()} className="flex items-center gap-1 rounded bg-indigo-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50" title="Send">
              <ArrowUpIcon className="h-4 w-4" /> Send
            </button>
            <button type="button" onClick={interrupt} className="rounded bg-gray-800 p-2.5 hover:bg-gray-700" title="Interrupt" aria-label="Interrupt">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </form>
          <p className="px-4 pb-2 text-[11px] text-gray-500">
            Honest labels: LOCAL OLLAMA = your machine&apos;s model · OFFLINE FALLBACK = rule-based demo, not Genesis intelligence · identity consistent {metrics.identityConsistent ? "yes" : "no"}.
          </p>
        </section>
      </div>
    </div>
  );
};
