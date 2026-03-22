import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const AUDIO_URL = "https://files.catbox.moe/t0wkb1.mp3";

const supabase = createClient(
  "https://vpxucajnzrwpskrluewi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweHVjYWpuenJ3cHNrcmx1ZXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDY2MDIsImV4cCI6MjA4OTcyMjYwMn0.vgRNP_ROlVy1M0uPpHCd0gmt6oc-Acup7IaFiMN0TK4"
);

const QUESTIONS = [
  { q:"What is Konnex?", opts:["A permissionless on-chain marketplace where robots use AI to perform and verify physical work","A centralized robot rental platform powered by Ethereum","A DeFi lending protocol for robotics hardware financing","A Layer 2 blockchain built specifically for IoT devices"], a:0, explanation:"Konnex is the permissionless market for robotic AI and verified physical work — a single on-chain fabric with stablecoin settlement." },
  { q:"What is the name of Konnex's unique consensus mechanism used to verify completed physical tasks?", opts:["Proof of Stake (PoS)","Proof of Physical Work (PoPW)","Proof of Authority (PoA)","Proof of History (PoH)"], a:1, explanation:"PoPW (Proof of Physical Work) is Konnex's mechanism where validators verify sensor data, video, and GPS logs to confirm real-world task completion." },
  { q:"What is the name of the standardized language that allows robots from different manufacturers to communicate tasks on Konnex?", opts:["RobotML","Universal Task Language (UTL)","OpenVLA Schema","TaskScript v2"], a:1, explanation:"UTL (Universal Task Language) describes tasks in JSON format, eliminating vendor lock-in and allowing any robot or AI model to read instructions uniformly." },
  { q:"Which smart contract in the Konnex protocol manages escrow funds, deadlines, and penalty conditions for each task?", opts:["StakeVault","PayoutRouter","TaskRegistry","RobotIdentity"], a:2, explanation:"TaskRegistry records each task's escrow funds, deadlines, and penalty conditions. PayoutRouter handles settlement; StakeVault manages validator stakes." },
  { q:"What are the primary utilities of the $KNX token within the Konnex protocol?", opts:["Used only to pay gas fees on Ethereum mainnet","Network fees, validator staking collateral, and governance voting rights","Exclusive medium of exchange for all task payments and settlements","A governance-only token with no fee utility"], a:1, explanation:"$KNX is used for network fees, security collateral for validators, and future governance voting. Task settlements are done in stablecoins for price stability." },
  { q:"In what currency are all task payments, escrows, penalties, and rewards processed on Konnex?", opts:["KNX token","ETH (Ether)","Stablecoins (e.g., USDC)","BTC (Bitcoin)"], a:2, explanation:"Stablecoins are the default settlement currency for all tasks, escrows, penalties, and rewards — ensuring predictable economics for all parties." },
  { q:"What type of network communication protocol does Konnex use for low-latency robot-to-robot messaging?", opts:["HTTP/2 REST API","QUIC/libp2p P2P mesh network","WebSockets over TCP","gRPC over TLS"], a:1, explanation:"Konnex uses a low-latency P2P mesh network based on QUIC/libp2p for robot-to-robot communication, ensuring fast and reliable task coordination." },
  { q:"According to the official Konnex roadmap, which phase focuses on Industrial Pilots with warehouse and agriculture trials?", opts:["Phase 0 — TestNet Sprint","Phase 1 — MainNet MVP","Phase 2 — Industrial Pilot","Phase 3 — Global Motion Ledger"], a:2, explanation:"Phase 2 (12–24 months) covers warehouse & agriculture field trials, university rover fleets, BondMatrix v1, and swarm composite bids." },
  { q:"How much did Konnex raise in its strategic funding round announced in January 2026?", opts:["$5 million","$50 million","$100 million","$15 million"], a:3, explanation:"Konnex secured $15M in January 2026 from strategic partners including Cogitent Ventures, Liquid Capital, Leland Ventures, Covey Network, M77 Ventures, and Block Maven LLC." },
  { q:"What is the estimated size of the physical labor economy that Konnex aims to transform?", opts:["~$500 billion","~$1 trillion","~$25 trillion","~$150 billion"], a:2, explanation:"Konnex targets the entire real-world labor economy, estimated at approximately $25 trillion — spanning logistics, manufacturing, agriculture, infrastructure, and services." },
];

const TIERS = [
  { min:900, label:"🤖 KNX Expert",    color:"#00e5ff", desc:"You know Konnex inside out. Impressive!" },
  { min:600, label:"⚡ AI Miner",       color:"#a78bfa", desc:"Strong knowledge. You're mining at full power!" },
  { min:300, label:"🔍 Validator Node", color:"#34d399", desc:"Decent understanding. Keep studying the docs!" },
  { min:0,   label:"📡 Rookie Node",    color:"#f59e0b", desc:"Just getting started. The whitepaper awaits!" },
];

const getTier = s => TIERS.find(t => s >= t.min);
const fmtDate = ts => new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

const buildShuffledQuestions = () =>
  shuffle(QUESTIONS).map(q => {
    const indexed = q.opts.map((opt, i) => ({ opt, correct: i === q.a }));
    const shuffled = shuffle(indexed);
    return { ...q, opts: shuffled.map(o => o.opt), a: shuffled.findIndex(o => o.correct) };
  });

export default function App() {
  const [screen, setScreen]       = useState("splash");
  const [splashOut, setSplashOut] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [checkingName, setCheckingName] = useState(false);
  const [name, setName]           = useState("");
  const [questions, setQuestions] = useState(() => buildShuffledQuestions());
  const [qIdx, setQIdx]           = useState(0);
  const [selected, setSelected]   = useState(null);
  const [score, setScore]         = useState(0);
  const [timeLeft, setTimeLeft]   = useState(20);
  const [answered, setAnswered]   = useState(false);
  const [results, setResults]     = useState([]);
  const [board, setBoard]         = useState([]);
  const [myRank, setMyRank]       = useState(null);
  const [playing, setPlaying]     = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
  const [feedback, setFeedback]   = useState([]);
  const [feedMsg, setFeedMsg]     = useState("");
  const [feedName, setFeedName]   = useState("");
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedSending, setFeedSending] = useState(false);
  const [feedError, setFeedError] = useState("");
  const [feedSuccess, setFeedSuccess] = useState(false);

  const audioRef    = useRef(null);
  const timerRef    = useRef(null);
  const scoreRef    = useRef(0);
  const answeredRef = useRef(false);

  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random()*100, y: Math.random()*100,
      size: Math.random()*3+1, dur: Math.random()*8+4, del: Math.random()*5,
    }))
  );

  useEffect(() => { loadBoard(); }, []);

  const loadBoard = async () => {
    setBoardLoading(true);
    try {
      const { data } = await supabase.from("leaderboard").select("*").order("score", { ascending:false }).limit(50);
      if (data) setBoard(data);
    } catch(_) {}
    setBoardLoading(false);
  };

  const loadFeedback = async () => {
    setFeedLoading(true);
    try {
      const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending:false }).limit(50);
      if (data) setFeedback(data);
    } catch(_) {}
    setFeedLoading(false);
  };

  const submitFeedback = async () => {
    if (!feedName.trim()) { setFeedError("⚠️ Please enter your name."); return; }
    if (!feedMsg.trim() || feedMsg.trim().length < 5) { setFeedError("⚠️ Message is too short."); return; }
    setFeedError(""); setFeedSending(true);
    try {
      await supabase.from("feedback").insert({ name: feedName.trim(), message: feedMsg.trim() });
      setFeedMsg(""); setFeedSuccess(true);
      setTimeout(() => setFeedSuccess(false), 3000);
      await loadFeedback();
    } catch(e) { setFeedError("❌ Error sending. Try again."); }
    setFeedSending(false);
  };

  const playAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.4; a.loop = true;
    a.play().then(() => setPlaying(true)).catch(console.error);
  };

  const toggleAudio = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)); }
  };

  const enterSite = () => {
    playAudio();
    setSplashOut(true);
    setTimeout(() => setScreen("home"), 800);
  };

  const saveScore = async (playerName, finalScore) => {
    try {
      const { data: existing } = await supabase.from("leaderboard").select("id, score").ilike("name", playerName).single();
      const tier = getTier(finalScore).label;
      if (existing) {
        if (finalScore > existing.score) await supabase.from("leaderboard").update({ score: finalScore, tier, created_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("leaderboard").insert({ name: playerName, score: finalScore, tier });
      }
      const { data } = await supabase.from("leaderboard").select("*").order("score", { ascending:false }).limit(50);
      if (data) {
        setBoard(data);
        setMyRank(data.findIndex(e => e.name.toLowerCase() === playerName.toLowerCase()) + 1);
      }
    } catch(e) { console.error(e); }
  };

  const startQuiz = async () => {
    if (!nameInput.trim()) { setNameError("⚠️ Please enter a name to continue."); return; }
    setNameError(""); setCheckingName(true);
    try {
      const { data } = await supabase.from("leaderboard").select("id").ilike("name", nameInput.trim()).limit(1);
      if (data && data.length > 0) {
        setNameError(`❌ "${nameInput.trim()}" is already taken. Please choose a different name.`);
        setCheckingName(false); return;
      }
    } catch(e) { console.error(e); }
    setCheckingName(false);
    setQuestions(buildShuffledQuestions());
    setName(nameInput.trim());
    setQIdx(0); setScore(0); scoreRef.current = 0;
    setResults([]); setSelected(null);
    setAnswered(false); answeredRef.current = false;
    setTimeLeft(20);
    setScreen("quiz");
  };

  useEffect(() => {
    if (screen !== "quiz") return;
    setTimeLeft(20); setSelected(null);
    setAnswered(false); answeredRef.current = false;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); if (!answeredRef.current) handleTimeout(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIdx, screen]);

  const handleTimeout = () => {
    if (answeredRef.current) return;
    answeredRef.current = true; setAnswered(true); setSelected(-1);
    setResults(r => [...r, { q:qIdx, picked:-1, correct:false, pts:0 }]);
    setTimeout(() => advance(), 2000);
  };

  const handleAnswer = (idx) => {
    if (answeredRef.current) return;
    clearInterval(timerRef.current);
    answeredRef.current = true; setAnswered(true); setSelected(idx);
    const correct = idx === questions[qIdx].a;
    const pts = correct ? Math.max(20, 100 - (20 - timeLeft) * 4) : 0;
    if (correct) { const ns = scoreRef.current + pts; scoreRef.current = ns; setScore(ns); }
    setResults(r => [...r, { q:qIdx, picked:idx, correct, pts }]);
    setTimeout(() => advance(), 2200);
  };

  const advance = () => {
    if (qIdx + 1 >= questions.length) { saveScore(name, scoreRef.current); setScreen("result"); }
    else setQIdx(i => i + 1);
  };

  const optClass = i => {
    if (!answered) return "opt-default";
    if (i === questions[qIdx].a) return "opt-correct";
    if (i === selected && selected !== questions[qIdx].a) return "opt-wrong";
    return "opt-dim";
  };

  const tier = getTier(score);

  return (
    <div style={{ minHeight:"100vh", background:"#050a14", color:"#e2e8f0", fontFamily:"'Inter',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .particle{position:absolute;border-radius:50%;background:rgba(0,229,255,0.15);animation:float linear infinite;pointer-events:none}
        @keyframes float{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) rotate(360deg);opacity:0}}
        .btn{cursor:pointer;border:none;border-radius:12px;font-weight:700;font-family:'Inter',sans-serif;transition:all 0.2s}
        .btn:hover{transform:translateY(-2px)}
        .btn-primary{background:linear-gradient(135deg,#00e5ff,#0066ff);color:#000;padding:14px 36px;font-size:16px;letter-spacing:1px}
        .btn-secondary{background:rgba(0,229,255,0.1);color:#00e5ff;border:1px solid rgba(0,229,255,0.3);padding:12px 28px;font-size:15px}
        .btn-secondary:hover{background:rgba(0,229,255,0.2)}
        .opt-default{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;cursor:pointer}
        .opt-default:hover{background:rgba(0,229,255,0.1);border-color:rgba(0,229,255,0.4)}
        .opt-correct{background:rgba(52,211,153,0.2);border:1px solid #34d399;color:#34d399}
        .opt-wrong{background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#ef4444}
        .opt-dim{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);color:#4a5568}
        .timer-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,#00e5ff,#0066ff);transition:width 1s linear}
        .card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;backdrop-filter:blur(10px)}
        .badge-creator{display:inline-flex;align-items:center;gap:8px;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.25);border-radius:50px;padding:8px 16px;font-size:13px;color:#94a3b8;text-decoration:none;transition:all 0.2s}
        .badge-creator:hover{background:rgba(0,229,255,0.15);border-color:rgba(0,229,255,0.5);color:#00e5ff}
        .rank-1{background:linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,165,0,0.05))!important;border-color:rgba(255,215,0,0.4)!important}
        .rank-2{background:linear-gradient(135deg,rgba(192,192,192,0.15),rgba(160,160,160,0.05))!important;border-color:rgba(192,192,192,0.4)!important}
        .rank-3{background:linear-gradient(135deg,rgba(205,127,50,0.15),rgba(180,100,30,0.05))!important;border-color:rgba(205,127,50,0.4)!important}
        @keyframes countUp{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
        .score-anim{animation:countUp 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards}
        @keyframes eq1{0%,100%{height:6px}50%{height:14px}}
        @keyframes eq2{0%,100%{height:14px}50%{height:4px}}
        @keyframes eq3{0%,100%{height:10px}33%{height:4px}66%{height:14px}}
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.5);opacity:0}}
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse-btn{0%,100%{box-shadow:0 0 0 0 rgba(0,229,255,0.4)}50%{box-shadow:0 0 0 20px rgba(0,229,255,0)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        input,textarea{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#e2e8f0;padding:14px 18px;font-size:16px;font-family:'Inter',sans-serif;width:100%;outline:none;transition:border 0.2s}
        input:focus,textarea:focus{border-color:rgba(0,229,255,0.5);box-shadow:0 0 0 3px rgba(0,229,255,0.1)}
        input::placeholder,textarea::placeholder{color:#4a5568}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(0,229,255,0.2);border-radius:3px}
      `}</style>

      <audio ref={audioRef} src={AUDIO_URL} preload="auto" />

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.size, height:p.size, animationDuration:`${p.dur}s`, animationDelay:`${p.del}s` }} />
      ))}

      {/* SPLASH */}
      {screen === "splash" && (
        <div style={{ position:"fixed", inset:0, background:"#050a14", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:999, opacity:splashOut?0:1, transform:splashOut?"scale(1.05)":"scale(1)", transition:"opacity 0.8s ease, transform 0.8s ease" }}>
          <div style={{ position:"relative", width:160, height:160, marginBottom:40 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#00e5ff", borderRightColor:"#0066ff", animation:"spin-slow 3s linear infinite" }} />
            <div style={{ position:"absolute", inset:10, borderRadius:"50%", border:"1px solid rgba(0,229,255,0.15)" }} />
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:52 }}>🤖</div>
            </div>
          </div>
          <div style={{ textAlign:"center", animation:"fade-up 0.8s ease forwards", marginBottom:48 }}>
            <div style={{ fontSize:11, color:"#00e5ff", letterSpacing:4, fontWeight:700, marginBottom:12 }}>🤖 ROBOTICS × BLOCKCHAIN</div>
            <h1 style={{ fontSize:"clamp(24px,5vw,42px)", fontWeight:900, lineHeight:1.1, background:"linear-gradient(135deg,#ffffff,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:12 }}>
              KONNEX KNOWLEDGE<br/>CHALLENGE
            </h1>
            <p style={{ color:"#64748b", fontSize:14 }}>Test your knowledge. Compete globally.</p>
          </div>
          <button onClick={enterSite} className="btn btn-primary" style={{ fontSize:16, letterSpacing:3, padding:"16px 48px", animation:"pulse-btn 2s ease infinite", borderRadius:50 }}>
            ▶ &nbsp; ENTER
          </button>
          <div style={{ marginTop:24, fontSize:11, color:"#334155", letterSpacing:1 }}>🎵 Sound on for best experience</div>
          <div style={{ position:"absolute", bottom:24 }}>
            <a href="https://x.com/gusttavocripto" target="_blank" rel="noopener noreferrer" className="badge-creator">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>Created by <strong style={{ color:"#00e5ff" }}>@gusttavocripto</strong></span>
              <span style={{ background:"rgba(0,229,255,0.15)", color:"#00e5ff", fontSize:10, padding:"2px 6px", borderRadius:20, fontWeight:700 }}>CRYPTO RESEARCHER</span>
            </a>
          </div>
        </div>
      )}

      {/* CREATOR BADGE */}
      <div style={{ position:"fixed", top:16, right:16, zIndex:100 }}>
        <a href="https://x.com/gusttavocripto" target="_blank" rel="noopener noreferrer" className="badge-creator">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <span>Created by <strong style={{ color:"#00e5ff" }}>@gusttavocripto</strong></span>
          <span style={{ background:"rgba(0,229,255,0.15)", color:"#00e5ff", fontSize:10, padding:"2px 6px", borderRadius:20, fontWeight:700 }}>CRYPTO RESEARCHER</span>
        </a>
      </div>

      {/* MUSIC PLAYER */}
      <div style={{ position:"fixed", bottom:16, left:16, zIndex:100 }}>
        <div onClick={toggleAudio} style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(5,10,20,0.92)", border:`1px solid ${playing?"rgba(0,229,255,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:50, padding:"9px 16px", backdropFilter:"blur(12px)", cursor:"pointer", boxShadow:playing?"0 0 20px rgba(0,229,255,0.15)":"none", transition:"all 0.3s", userSelect:"none" }}>
          <div style={{ position:"relative", width:28, height:28, flexShrink:0 }}>
            {playing && <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,229,255,0.3)", animation:"pulse-ring 1.2s ease-out infinite" }} />}
            <div style={{ width:28, height:28, borderRadius:"50%", background:playing?"linear-gradient(135deg,#00e5ff,#0066ff)":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", zIndex:1, transition:"all 0.3s" }}>
              {playing
                ? <svg width="10" height="12" viewBox="0 0 10 12" fill="#000"><rect x="0" y="0" width="3" height="12"/><rect x="6" y="0" width="3" height="12"/></svg>
                : <svg width="10" height="12" viewBox="0 0 10 12" fill="#94a3b8"><path d="M0 0l10 6-10 6z"/></svg>}
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:playing?"#e2e8f0":"#64748b", letterSpacing:0.5, transition:"color 0.3s" }}>PROOF OF WORK</div>
            <div style={{ fontSize:10, color:"#64748b" }}>by @gusttavocripto · OST</div>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:2, height:16 }}>
            {[["eq1","0s"],["eq2","0.2s"],["eq3","0.1s"],["eq1","0.3s"],["eq2","0.15s"]].map(([a,d],i) => (
              <div key={i} style={{ width:3, borderRadius:2, background:playing?"#00e5ff":"#1e3a4a", animation:playing?`${a} 0.8s ease-in-out ${d} infinite`:"none", height:6, transition:"background 0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"80px 20px", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>

        {/* HOME */}
        {screen === "home" && (
          <div style={{ width:"100%", textAlign:"center" }}>
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"inline-block", background:"linear-gradient(135deg,rgba(0,229,255,0.1),rgba(0,102,255,0.1))", border:"1px solid rgba(0,229,255,0.2)", borderRadius:16, padding:"6px 18px", fontSize:12, color:"#00e5ff", letterSpacing:3, fontWeight:700, marginBottom:20 }}>
                🤖 ROBOTICS × BLOCKCHAIN
              </div>
              <h1 style={{ fontSize:"clamp(28px,6vw,52px)", fontWeight:900, lineHeight:1.1, marginBottom:16, background:"linear-gradient(135deg,#ffffff,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                KONNEX KNOWLEDGE<br/>CHALLENGE
              </h1>
              <p style={{ color:"#64748b", fontSize:15, maxWidth:480, margin:"0 auto 32px", lineHeight:1.7 }}>
                Think you know the future of robotic physical work on the blockchain? Prove it. 10 questions. Compete globally. Only real KNX holders will make it to the top.
              </p>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginBottom:36 }}>
              {[["10","Questions"],["20s","Per Question"],[board.length||"∞","Players"],["$25T","Market"]].map(([v,l]) => (
                <div key={l} className="card" style={{ padding:"14px 20px", textAlign:"center", minWidth:80 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:"#00e5ff" }}>{v}</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:28, maxWidth:420, margin:"0 auto 24px" }}>
              <label style={{ display:"block", fontSize:12, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:10 }}>YOUR HANDLE / NAME</label>
              <input
                placeholder="e.g. CryptoNinja, 0xRobo..."
                value={nameInput}
                onChange={e=>{ setNameInput(e.target.value); setNameError(""); }}
                onKeyDown={e=>e.key==="Enter"&&startQuiz()}
                maxLength={24}
                style={{ borderColor:nameError?"rgba(239,68,68,0.6)":undefined }}
              />
              {nameError && <div style={{ fontSize:12, color:"#ef4444", marginTop:8, lineHeight:1.5 }}>{nameError}</div>}
              <button
                className="btn btn-primary"
                onClick={startQuiz}
                disabled={checkingName}
                style={{ width:"100%", marginTop:16, fontSize:15, letterSpacing:2, opacity:checkingName?0.7:1 }}
              >
                {checkingName ? "⏳ CHECKING..." : "🚀 LAUNCH CHALLENGE"}
              </button>
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-secondary" onClick={()=>{ loadBoard(); setScreen("board"); }}>🏆 Leaderboard</button>
              <button className="btn btn-secondary" onClick={()=>{ loadFeedback(); setScreen("community"); }}>💬 Community</button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {screen === "quiz" && (
          <div style={{ width:"100%" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#64748b", letterSpacing:2, fontWeight:700 }}>QUESTION {qIdx+1} / {questions.length}</div>
              <div style={{ background:"rgba(0,229,255,0.1)", border:"1px solid rgba(0,229,255,0.2)", borderRadius:50, padding:"6px 14px" }}>
                <span style={{ fontSize:14, fontWeight:900, color:timeLeft<=5?"#ef4444":"#00e5ff" }}>{timeLeft}s</span>
              </div>
            </div>
            <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, marginBottom:24, overflow:"hidden" }}>
              <div className="timer-bar" style={{ width:`${(timeLeft/20)*100}%`, background:timeLeft<=5?"linear-gradient(90deg,#ef4444,#f97316)":undefined }} />
            </div>
            <div style={{ display:"flex", gap:4, marginBottom:24 }}>
              {questions.map((_,i) => (
                <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<qIdx?"#00e5ff":i===qIdx?"rgba(0,229,255,0.4)":"rgba(255,255,255,0.06)" }} />
              ))}
            </div>
            <div className="card" style={{ padding:28, marginBottom:16 }}>
              <p style={{ fontSize:"clamp(15px,2.5vw,19px)", fontWeight:700, lineHeight:1.5, color:"#f1f5f9" }}>{questions[qIdx].q}</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              {questions[qIdx].opts.map((opt,i) => (
                <button key={i} className={`btn ${optClass(i)}`} onClick={()=>handleAnswer(i)}
                  style={{ padding:"14px 18px", borderRadius:12, textAlign:"left", fontSize:14, lineHeight:1.5, width:"100%", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ minWidth:28, height:28, borderRadius:8, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#64748b" }}>
                    {String.fromCharCode(65+i)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            {answered && (
              <div className="card" style={{ padding:16, borderColor:selected===questions[qIdx].a?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)", background:selected===questions[qIdx].a?"rgba(52,211,153,0.06)":"rgba(239,68,68,0.06)" }}>
                <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6 }}>
                  {selected===-1?"⏱️ Time's up! ":selected===questions[qIdx].a?`✅ Correct! +${results[results.length-1]?.pts} pts — `:"❌ Wrong! "}
                  <span style={{ color:"#e2e8f0" }}>{questions[qIdx].explanation}</span>
                </p>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20 }}>
              <div style={{ fontSize:13, color:"#64748b" }}>Player: <strong style={{ color:"#e2e8f0" }}>{name}</strong></div>
              <div style={{ fontSize:13 }}>Score: <strong style={{ color:"#00e5ff" }}>{score}</strong></div>
            </div>
          </div>
        )}

        {/* RESULT */}
        {screen === "result" && (
          <div style={{ width:"100%", textAlign:"center" }}>
            <div style={{ marginBottom:32 }}>
              <div style={{ fontSize:64, marginBottom:16 }}>{score>=900?"🤖":score>=600?"⚡":score>=300?"🔍":"📡"}</div>
              <div className="score-anim" style={{ fontSize:"clamp(48px,10vw,80px)", fontWeight:900, color:tier.color, lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:13, color:"#64748b", letterSpacing:3, marginTop:4, marginBottom:16 }}>POINTS</div>
              <div style={{ fontSize:22, fontWeight:800, color:tier.color, marginBottom:8 }}>{tier.label}</div>
              <p style={{ color:"#64748b", fontSize:14, maxWidth:360, margin:"0 auto 24px" }}>{tier.desc}</p>
              {myRank && (
                <div style={{ display:"inline-block", background:"rgba(0,229,255,0.1)", border:"1px solid rgba(0,229,255,0.2)", borderRadius:50, padding:"8px 20px", fontSize:14, color:"#00e5ff", marginBottom:24 }}>
                  🏆 Global Rank: <strong>#{myRank}</strong> out of {board.length}
                </div>
              )}
            </div>
            <div className="card" style={{ padding:20, marginBottom:28, textAlign:"left" }}>
              <div style={{ fontSize:12, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:14 }}>QUESTION BREAKDOWN</div>
              {results.map((r,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<results.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:13, color:"#94a3b8" }}>Q{i+1}. {questions[i].q.slice(0,42)}...</span>
                  <span style={{ fontSize:13, fontWeight:700, color:r.correct?"#34d399":"#ef4444", minWidth:60, textAlign:"right" }}>{r.correct?`+${r.pts}`:"✗ 0"}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-primary" onClick={()=>{ loadBoard(); setScreen("board"); }}>🏆 Leaderboard</button>
              <button className="btn btn-secondary" onClick={()=>{ setScore(0); scoreRef.current=0; setResults([]); setQIdx(0); setNameInput(""); setScreen("home"); }}>↺ Play Again</button>
              <button className="btn btn-secondary" onClick={()=>setScreen("home")}>⌂ Home</button>
            </div>
          </div>
        )}

        {/* COMMUNITY */}
        {screen === "community" && (
          <div style={{ width:"100%" }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ display:"inline-block", background:"rgba(0,229,255,0.08)", border:"1px solid rgba(0,229,255,0.2)", borderRadius:50, padding:"6px 18px", fontSize:11, color:"#00e5ff", letterSpacing:3, fontWeight:700, marginBottom:16 }}>
                💬 COMMUNITY FEED
              </div>
              <h2 style={{ fontSize:32, fontWeight:900, background:"linear-gradient(135deg,#fff,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Community</h2>
              <p style={{ color:"#64748b", fontSize:14, marginTop:8 }}>Share your thoughts about Konnex with the community</p>
            </div>
            <div className="card" style={{ padding:24, marginBottom:24 }}>
              <div style={{ fontSize:12, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:16 }}>LEAVE A MESSAGE</div>
              <input placeholder="Your name or handle..." value={feedName} onChange={e=>{ setFeedName(e.target.value); setFeedError(""); }} maxLength={24} style={{ marginBottom:10 }} />
              <textarea
                placeholder="What do you think about Konnex? Share your thoughts, predictions, questions..."
                value={feedMsg}
                onChange={e=>{ setFeedMsg(e.target.value); setFeedError(""); }}
                maxLength={280} rows={3}
                style={{ resize:"none", lineHeight:1.6 }}
              />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:6, marginBottom:12 }}>
                {feedError && <div style={{ fontSize:12, color:"#ef4444" }}>{feedError}</div>}
                {feedSuccess && <div style={{ fontSize:12, color:"#34d399" }}>✅ Message sent!</div>}
                {!feedError && !feedSuccess && <div />}
                <div style={{ fontSize:11, color:"#4a5568" }}>{feedMsg.length}/280</div>
              </div>
              <button className="btn btn-primary" onClick={submitFeedback} disabled={feedSending} style={{ width:"100%", fontSize:14, letterSpacing:1, opacity:feedSending?0.7:1 }}>
                {feedSending ? "⏳ SENDING..." : "📤 SEND MESSAGE"}
              </button>
            </div>
            {feedLoading ? (
              <div className="card" style={{ padding:40, textAlign:"center" }}>
                <div style={{ color:"#00e5ff", fontSize:14, letterSpacing:2 }}>⏳ LOADING MESSAGES...</div>
              </div>
            ) : feedback.length === 0 ? (
              <div className="card" style={{ padding:40, textAlign:"center", color:"#4a5568" }}>No messages yet. Be the first to share your thoughts!</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
                {feedback.map((f,i) => (
                  <div key={i} className="card" style={{ padding:"16px 20px", borderRadius:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#00e5ff22,#0066ff22)", border:"1px solid rgba(0,229,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:900, color:"#00e5ff" }}>
                          {f.name[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight:700, fontSize:14, color:"#e2e8f0" }}>{f.name}</span>
                      </div>
                      <span style={{ fontSize:11, color:"#4a5568" }}>{fmtDate(f.created_at)}</span>
                    </div>
                    <p style={{ fontSize:14, color:"#94a3b8", lineHeight:1.6 }}>{f.message}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-primary" onClick={()=>setScreen("home")}>⌂ Home</button>
              <button className="btn btn-secondary" onClick={()=>{ loadBoard(); setScreen("board"); }}>🏆 Leaderboard</button>
              <button className="btn btn-secondary" onClick={loadFeedback}>↺ Refresh</button>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {screen === "board" && (
          <div style={{ width:"100%" }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ display:"inline-block", background:"rgba(0,229,255,0.08)", border:"1px solid rgba(0,229,255,0.2)", borderRadius:50, padding:"6px 18px", fontSize:11, color:"#00e5ff", letterSpacing:3, fontWeight:700, marginBottom:16 }}>
                🏆 GLOBAL RANKINGS
              </div>
              <h2 style={{ fontSize:32, fontWeight:900, background:"linear-gradient(135deg,#fff,#00e5ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Leaderboard</h2>
              <p style={{ color:"#64748b", fontSize:14, marginTop:8 }}>{board.length} total competitors worldwide</p>
            </div>
            {boardLoading ? (
              <div className="card" style={{ padding:40, textAlign:"center" }}>
                <div style={{ color:"#00e5ff", fontSize:14, letterSpacing:2 }}>⏳ LOADING RANKINGS...</div>
              </div>
            ) : board.length === 0 ? (
              <div className="card" style={{ padding:40, textAlign:"center", color:"#4a5568" }}>No entries yet. Be the first to conquer the challenge!</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:28 }}>
                {board.slice(0,50).map((e,i) => (
                  <div key={i} className={`card ${i===0?"rank-1":i===1?"rank-2":i===2?"rank-3":""}`}
                    style={{ padding:"14px 20px", display:"flex", alignItems:"center", gap:14, border:"1px solid rgba(255,255,255,0.07)", borderRadius:14 }}>
                    <div style={{ minWidth:36, fontSize:i<3?24:15, fontWeight:900, color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"#4a5568", textAlign:"center" }}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:e.name.toLowerCase()===name.toLowerCase()?"#00e5ff":"#e2e8f0" }}>
                        {e.name}{e.name.toLowerCase()===name.toLowerCase()&&<span style={{ fontSize:11, color:"#00e5ff", background:"rgba(0,229,255,0.1)", borderRadius:20, padding:"2px 8px", marginLeft:8 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{e.tier} · {fmtDate(e.created_at)}</div>
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:i===0?"#ffd700":i===1?"#c0c0c0":i===2?"#cd7f32":"#00e5ff" }}>{e.score}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button className="btn btn-primary" onClick={()=>setScreen("home")}>⚡ Play Now</button>
              <button className="btn btn-secondary" onClick={()=>{ loadBoard(); setScreen("board"); }}>↺ Refresh</button>
              <button className="btn btn-secondary" onClick={()=>setScreen("home")}>⌂ Home</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
