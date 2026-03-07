
import { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MOODS = ["😊 Happy", "😐 Neutral", "😢 Sad", "😤 Irritable", "😴 Tired", "🤩 Energetic"];
const SYMPTOMS = ["Cramps", "Headache", "Fatigue", "Bloating", "Back Pain", "Nausea", "Tender Breasts"];
const CYCLE_PHASES = {
  menstrual: { color: "#f472b6", label: "Menstrual" },
  follicular: { color: "#a78bfa", label: "Follicular" },
  ovulation: { color: "#34d399", label: "Ovulation" },
  luteal: { color: "#fb923c", label: "Luteal" },
};

const HEALTH_TIPS = [
  { category: "Nutrition", icon: "🥗", tip: "Iron-rich foods like spinach and lentils help replenish during menstruation.", color: "#34d399" },
  { category: "Exercise", icon: "🧘", tip: "Gentle yoga and walking reduce cramps and boost endorphins during your period.", color: "#a78bfa" },
  { category: "Mental Health", icon: "🧠", tip: "Journaling your mood across your cycle reveals powerful emotional patterns.", color: "#60a5fa" },
  { category: "Period Care", icon: "🌸", tip: "Heat therapy on your lower abdomen can significantly reduce menstrual cramps.", color: "#f472b6" },
  { category: "Hydration", icon: "💧", tip: "Drink at least 2L of water daily. Hydration reduces bloating and fatigue.", color: "#38bdf8" },
  { category: "Sleep", icon: "🌙", tip: "Progesterone in the luteal phase can disrupt sleep — maintain a consistent bedtime.", color: "#c084fc" },
];

const PREGNANCY_TIPS = {
  1: "Your baby is the size of a poppy seed. Take folic acid daily.",
  4: "Heart begins to beat. Avoid alcohol and smoking completely.",
  8: "Baby is the size of a raspberry. Morning sickness peaks this week.",
  12: "End of first trimester! Risk of miscarriage drops significantly.",
  16: "You may feel first movements (quickening) soon!",
  20: "Halfway there! Anatomy scan this week reveals baby's development.",
  24: "Baby can hear your voice now. Talk and sing to them!",
  28: "Third trimester begins. Start preparing your birth plan.",
  32: "Baby is practicing breathing. Sleep on your left side.",
  36: "Baby is considered early term. Pack your hospital bag!",
  40: "Full term! Your baby could arrive any day now. ✨",
};

// ─── CYCLE PREDICTION LOGIC ───────────────────────────────────────────────────
function predictCycle(lastPeriodStart, cycleLength = 28, periodDuration = 5) {
  const last = new Date(lastPeriodStart);
  const nextPeriod = new Date(last);
  nextPeriod.setDate(last.getDate() + cycleLength);
  const ovulation = new Date(last);
  ovulation.setDate(last.getDate() + cycleLength - 14);
  const fertileStart = new Date(ovulation);
  fertileStart.setDate(ovulation.getDate() - 5);
  const fertileEnd = new Date(ovulation);
  fertileEnd.setDate(ovulation.getDate() + 1);
  return { nextPeriod, ovulation, fertileStart, fertileEnd };
}

function getDayPhase(dayOffset, cycleLength = 28, periodDuration = 5) {
  if (dayOffset < 0) return null;
  const day = dayOffset % cycleLength;
  if (day < periodDuration) return "menstrual";
  if (day < 13) return "follicular";
  if (day < 16) return "ovulation";
  return "luteal";
}

// ─── 3D SCENE COMPONENT ───────────────────────────────────────────────────────
function ThreeScene({ activePhase }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const W = mount.clientWidth, H = mount.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Ambient + directional light
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffc0eb, 1.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // Central glowing orb (main sphere)
    const orbGeo = new THREE.SphereGeometry(1.4, 64, 64);
    const orbMat = new THREE.MeshPhongMaterial({
      color: 0xf9a8d4,
      emissive: 0xfb7185,
      emissiveIntensity: 0.3,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    scene.add(orb);

    // Outer ring
    const ringGeo = new THREE.TorusGeometry(2.2, 0.05, 16, 100);
    const ringMat = new THREE.MeshPhongMaterial({ color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Second ring
    const ring2Geo = new THREE.TorusGeometry(2.8, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshPhongMaterial({ color: 0x60a5fa, emissive: 0x3b82f6, emissiveIntensity: 0.4 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 5;
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // Floating particles
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0xf9a8d4, size: 0.07, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Floating small spheres (health metric icons in 3D)
    const smallSpheres = [];
    const colors = [0xf472b6, 0xa78bfa, 0x34d399, 0x60a5fa, 0xfb923c];
    const positions3D = [
      [3, 1.5, 0], [-3, 1.5, 0], [3, -1.5, 0], [-3, -1.5, 0], [0, 3, 0]
    ];
    positions3D.forEach(([x, y, z], i) => {
      const geo = new THREE.SphereGeometry(0.25, 32, 32);
      const mat = new THREE.MeshPhongMaterial({
        color: colors[i],
        emissive: colors[i],
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.userData = { ox: x, oy: y, phase: Math.random() * Math.PI * 2 };
      scene.add(mesh);
      smallSpheres.push(mesh);
    });

    sceneRef.current = { scene, camera, renderer, orb, ring, ring2, particles, smallSpheres };

    // Animation loop
    let frame;
    const animate = (t) => {
      frame = requestAnimationFrame(animate);
      const time = t * 0.001;
      orb.rotation.y = time * 0.3;
      orb.rotation.x = Math.sin(time * 0.2) * 0.1;
      ring.rotation.z = time * 0.15;
      ring2.rotation.z = -time * 0.1;
      ring2.rotation.y = time * 0.08;
      particles.rotation.y = time * 0.02;
      particles.rotation.x = time * 0.01;
      smallSpheres.forEach((s, i) => {
        const { ox, oy, phase } = s.userData;
        s.position.x = ox + Math.sin(time * 0.6 + phase) * 0.3;
        s.position.y = oy + Math.cos(time * 0.5 + phase) * 0.3;
        s.rotation.y = time * 0.5;
      });
      renderer.render(scene, camera);
    };
    animate(0);

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update orb color based on phase
  useEffect(() => {
    if (!sceneRef.current) return;
    const phaseColors = {
      menstrual: 0xf472b6,
      follicular: 0xa78bfa,
      ovulation: 0x34d399,
      luteal: 0xfb923c,
      default: 0xf9a8d4,
    };
    const color = phaseColors[activePhase] || phaseColors.default;
    sceneRef.current.orb.material.color.setHex(color);
    sceneRef.current.orb.material.emissive.setHex(color);
  }, [activePhase]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%", borderRadius: "24px" }} />;
}

// ─── CALENDAR COMPONENT ───────────────────────────────────────────────────────
function CycleCalendar({ logs, profile, onDayClick }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const prediction = profile.lastPeriod
    ? predictCycle(profile.lastPeriod, profile.cycleLength, profile.periodDuration)
    : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const getDayInfo = (day) => {
    const date = new Date(viewYear, viewMonth, day);
    const dateStr = date.toISOString().split("T")[0];
    const hasLog = logs[dateStr];
    const isToday = date.toDateString() === today.toDateString();

    let phase = null;
    if (profile.lastPeriod) {
      const lastP = new Date(profile.lastPeriod);
      const diffDays = Math.floor((date - lastP) / 86400000);
      phase = getDayPhase(diffDays, profile.cycleLength, profile.periodDuration);
    }

    const isPredictedPeriod = prediction &&
      date >= prediction.nextPeriod &&
      date < new Date(prediction.nextPeriod.getTime() + profile.periodDuration * 86400000);
    const isFertile = prediction && date >= prediction.fertileStart && date <= prediction.fertileEnd;
    const isOvulation = prediction && date.toDateString() === prediction.ovulation.toDateString();

    return { hasLog, isToday, phase, isPredictedPeriod, isFertile, isOvulation, dateStr };
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: 24, backdropFilter: "blur(12px)", border: "1px solid rgba(249,168,212,0.2)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
          style={{ background: "rgba(249,168,212,0.2)", border: "none", color: "#f9a8d4", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 18 }}>‹</button>
        <span style={{ color: "#fff", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600 }}>
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
          style={{ background: "rgba(249,168,212,0.2)", border: "none", color: "#f9a8d4", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 18 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign: "center", color: "#c084fc", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{d}</div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const info = getDayInfo(day);
          let bg = "transparent";
          let border = "1px solid transparent";
          if (info.isOvulation) bg = "rgba(52,211,153,0.4)", border = "1px solid #34d399";
          else if (info.isFertile) bg = "rgba(52,211,153,0.15)";
          else if (info.isPredictedPeriod) bg = "rgba(244,114,182,0.2)", border = "1px dashed #f472b6";
          else if (info.phase === "menstrual") bg = "rgba(244,114,182,0.25)";
          else if (info.phase === "ovulation") bg = "rgba(52,211,153,0.2)";
          if (info.isToday) border = "2px solid #f9a8d4";

          return (
            <div key={day} onClick={() => onDayClick(info.dateStr, day)}
              style={{ aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: bg, border, borderRadius: 10, cursor: "pointer", transition: "all 0.2s",
                position: "relative" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(249,168,212,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = bg}
            >
              <span style={{ color: info.isToday ? "#f9a8d4" : "#e2e8f0", fontSize: 13, fontWeight: info.isToday ? 700 : 400 }}>{day}</span>
              {info.hasLog && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", marginTop: 2 }} />}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {[
          { color: "rgba(244,114,182,0.4)", label: "Period" },
          { color: "rgba(52,211,153,0.4)", label: "Ovulation" },
          { color: "rgba(52,211,153,0.15)", label: "Fertile" },
          { color: "rgba(244,114,182,0.2)", label: "Predicted", dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: color, border: dashed ? "1px dashed #f472b6" : "none" }} />
            <span style={{ color: "#94a3b8", fontSize: 11 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HEALTH LOG MODAL ─────────────────────────────────────────────────────────
function LogModal({ dateStr, existing, onSave, onClose }) {
  const [mood, setMood] = useState(existing?.mood || "");
  const [symptoms, setSymptoms] = useState(existing?.symptoms || []);
  const [water, setWater] = useState(existing?.water || 0);
  const [sleep, setSleep] = useState(existing?.sleep || 7);
  const [energy, setEnergy] = useState(existing?.energy || 5);

  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}>
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", border: "1px solid rgba(167,139,250,0.3)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#f9a8d4", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, marginBottom: 20, margin: "0 0 20px 0" }}>
          Log for {new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </h3>

        {/* Mood */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "#c084fc", fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Mood</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {MOODS.map(m => (
              <button key={m} onClick={() => setMood(m)}
                style={{ padding: "6px 14px", borderRadius: 20, border: mood === m ? "2px solid #f472b6" : "1px solid rgba(255,255,255,0.1)",
                  background: mood === m ? "rgba(244,114,182,0.2)" : "transparent", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: "#c084fc", fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Symptoms</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {SYMPTOMS.map(s => (
              <button key={s} onClick={() => toggleSymptom(s)}
                style={{ padding: "6px 14px", borderRadius: 20, border: symptoms.includes(s) ? "2px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                  background: symptoms.includes(s) ? "rgba(167,139,250,0.2)" : "transparent", color: "#e2e8f0", fontSize: 13, cursor: "pointer" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        {[
          { label: "💧 Water Intake", value: water, setter: setWater, min: 0, max: 4, step: 0.5, unit: "L", color: "#38bdf8" },
          { label: "🌙 Sleep Hours", value: sleep, setter: setSleep, min: 0, max: 12, step: 0.5, unit: "hrs", color: "#c084fc" },
          { label: "⚡ Energy Level", value: energy, setter: setEnergy, min: 1, max: 10, step: 1, unit: "/10", color: "#34d399" },
        ].map(({ label, value, setter, min, max, step, unit, color }) => (
          <div key={label} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ color: "#94a3b8", fontSize: 14 }}>{label}</label>
              <span style={{ color, fontWeight: 700 }}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
              onChange={e => setter(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: color }} />
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button onClick={() => onSave({ mood, symptoms, water, sleep, energy })}
            style={{ flex: 1, padding: "12px", borderRadius: 14, background: "linear-gradient(135deg, #f472b6, #a78bfa)", border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Save Log ✨
          </button>
          <button onClick={onClose}
            style={{ padding: "12px 20px", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function WomensHealthTracker() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [logs, setLogs] = useState({});
  const [profile, setProfile] = useState({
    name: "Luna",
    age: 25,
    cycleLength: 28,
    periodDuration: 5,
    lastPeriod: new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0],
    pregnancyMode: false,
    pregnancyWeek: 0,
  });
  const [logModal, setLogModal] = useState(null);
  const [editProfile, setEditProfile] = useState(false);

  const prediction = profile.lastPeriod
    ? predictCycle(profile.lastPeriod, profile.cycleLength, profile.periodDuration)
    : null;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayLog = logs[todayStr];

  const lastP = profile.lastPeriod ? new Date(profile.lastPeriod) : null;
  const todayOffset = lastP ? Math.floor((new Date() - lastP) / 86400000) : 0;
  const currentPhase = getDayPhase(todayOffset, profile.cycleLength, profile.periodDuration);

  const daysUntilNext = prediction
    ? Math.max(0, Math.ceil((prediction.nextPeriod - new Date()) / 86400000))
    : null;

  const recentLogs = Object.entries(logs).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🌸" },
    { id: "calendar", label: "Cycle", icon: "📅" },
    { id: "log", label: "Daily Log", icon: "📝" },
    { id: "pregnancy", label: "Pregnancy", icon: "🤰" },
    { id: "tips", label: "Tips", icon: "💡" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const phaseInfo = {
    menstrual: { emoji: "🩸", desc: "Menstrual Phase — Rest, hydrate, use heat therapy" },
    follicular: { emoji: "🌱", desc: "Follicular Phase — Energy rising, great time to start new projects" },
    ovulation: { emoji: "✨", desc: "Ovulation Phase — Peak energy and confidence" },
    luteal: { emoji: "🌙", desc: "Luteal Phase — Wind down, practice self-care" },
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0720 0%, #1a0a2e 30%, #0d1b3e 60%, #0f0720 100%)",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e2e8f0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(244,114,182,0.3); border-radius: 3px; }
        input[type=range] { height: 4px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(244,114,182,0.3)} 50%{box-shadow:0 0 40px rgba(244,114,182,0.6)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>

      {/* Background mesh blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(244,114,182,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 500, height: 500, background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "50%", left: "40%", width: 300, height: 300, background: "radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)", borderRadius: "50%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 20px 100px" }}>

        {/* Header */}
        <div style={{ padding: "32px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, margin: 0,
              background: "linear-gradient(135deg, #f9a8d4, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Luna Health ✦
            </h1>
            <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: 14 }}>Welcome back, {profile.name}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#f9a8d4", fontSize: 13, fontWeight: 600 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
            {currentPhase && (
              <div style={{ color: CYCLE_PHASES[currentPhase]?.color, fontSize: 12, marginTop: 4 }}>
                {phaseInfo[currentPhase]?.emoji} {CYCLE_PHASES[currentPhase]?.label} Phase
              </div>
            )}
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            {/* 3D Scene + Phase Card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ height: 280, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(244,114,182,0.2)", animation: "pulse-glow 4s ease-in-out infinite" }}>
                <ThreeScene activePhase={currentPhase} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Phase Card */}
                <div style={{ background: `linear-gradient(135deg, ${CYCLE_PHASES[currentPhase]?.color}22, rgba(255,255,255,0.04))`,
                  borderRadius: 20, padding: 20, border: `1px solid ${CYCLE_PHASES[currentPhase]?.color}44`, flex: 1 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{phaseInfo[currentPhase]?.emoji}</div>
                  <div style={{ color: CYCLE_PHASES[currentPhase]?.color, fontWeight: 700, fontSize: 16, fontFamily: "'Cormorant Garamond', serif" }}>
                    {CYCLE_PHASES[currentPhase]?.label} Phase
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>{phaseInfo[currentPhase]?.desc}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>Day {todayOffset % profile.cycleLength + 1} of cycle</div>
                </div>

                {/* Next period countdown */}
                {daysUntilNext !== null && (
                  <div style={{ background: "rgba(244,114,182,0.08)", borderRadius: 20, padding: 20, border: "1px solid rgba(244,114,182,0.2)", textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Next Period In</div>
                    <div style={{ fontSize: 48, fontWeight: 700, color: "#f472b6", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{daysUntilNext}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>days · {prediction.nextPeriod.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Metric Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Water", value: todayLog?.water || 0, unit: "L", icon: "💧", color: "#38bdf8", max: 4 },
                { label: "Sleep", value: todayLog?.sleep || 0, unit: "hrs", icon: "🌙", color: "#c084fc", max: 10 },
                { label: "Energy", value: todayLog?.energy || 0, unit: "/10", icon: "⚡", color: "#34d399", max: 10 },
                { label: "Mood", value: todayLog?.mood ? "✓" : "—", unit: "", icon: "😊", color: "#f472b6", max: null },
              ].map(({ label, value, unit, icon, color, max }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 20, border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>{icon}</div>
                  <div style={{ color, fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>{value}{unit}</div>
                  {max && value > 0 && (
                    <div style={{ marginTop: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 4 }}>
                      <div style={{ height: 4, borderRadius: 4, background: color, width: `${(value / max) * 100}%`, transition: "width 0.5s" }} />
                    </div>
                  )}
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Fertile Window Info */}
            {prediction && (
              <div style={{ background: "rgba(52,211,153,0.06)", borderRadius: 20, padding: 20, border: "1px solid rgba(52,211,153,0.2)", marginBottom: 24 }}>
                <h3 style={{ color: "#34d399", margin: "0 0 12px", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>🌿 Fertile Window & Ovulation</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Fertile Start", date: prediction.fertileStart },
                    { label: "Ovulation", date: prediction.ovulation },
                    { label: "Fertile End", date: prediction.fertileEnd },
                  ].map(({ label, date }) => (
                    <div key={label} style={{ background: "rgba(52,211,153,0.08)", borderRadius: 14, padding: 14, textAlign: "center" }}>
                      <div style={{ color: "#34d399", fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ color: "#e2e8f0", fontSize: 15, marginTop: 4 }}>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Logs */}
            {recentLogs.length > 0 && (
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 20, border: "1px solid rgba(255,255,255,0.07)" }}>
                <h3 style={{ color: "#c084fc", margin: "0 0 14px", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>📊 Recent Logs</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {recentLogs.map(([date, log]) => (
                    <div key={date} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: 14 }}>
                      <span style={{ color: "#64748b", fontSize: 13, minWidth: 90 }}>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span style={{ color: "#e2e8f0", fontSize: 14 }}>{log.mood || "No mood"}</span>
                      <span style={{ color: "#38bdf8", fontSize: 13 }}>💧{log.water}L</span>
                      <span style={{ color: "#c084fc", fontSize: 13 }}>🌙{log.sleep}h</span>
                      <span style={{ color: "#34d399", fontSize: 13 }}>⚡{log.energy}/10</span>
                      {log.symptoms?.length > 0 && <span style={{ color: "#f472b6", fontSize: 12 }}>{log.symptoms.slice(0, 2).join(", ")}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f9a8d4", marginBottom: 20 }}>Cycle Calendar</h2>
            <CycleCalendar logs={logs} profile={profile} onDayClick={(dateStr) => setLogModal(dateStr)} />

            {/* Phase breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 20 }}>
              {Object.entries(CYCLE_PHASES).map(([phase, { color, label }]) => (
                <div key={phase} style={{ background: `${color}11`, borderRadius: 16, padding: 16, border: `1px solid ${color}33`, textAlign: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, margin: "0 auto 10px" }} />
                  <div style={{ color, fontWeight: 600, fontSize: 14 }}>{label}</div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                    {phase === "menstrual" ? `Days 1–${profile.periodDuration}` :
                     phase === "follicular" ? `Days ${profile.periodDuration + 1}–13` :
                     phase === "ovulation" ? "Days 14–16" : "Days 17–28"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DAILY LOG TAB */}
        {activeTab === "log" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f9a8d4", marginBottom: 20 }}>Today's Health Log</h2>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 28, border: "1px solid rgba(167,139,250,0.2)", marginBottom: 20 }}>
              <p style={{ color: "#94a3b8", marginBottom: 20 }}>
                {todayLog ? "✅ You've logged today!" : "You haven't logged today yet. How are you feeling?"}
              </p>
              <button onClick={() => setLogModal(todayStr)}
                style={{ background: "linear-gradient(135deg, #f472b6, #a78bfa)", border: "none", borderRadius: 16, padding: "14px 28px",
                  color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                {todayLog ? "Edit Today's Log ✏️" : "Log Today 📝"}
              </button>
            </div>

            {todayLog && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "rgba(244,114,182,0.08)", borderRadius: 20, padding: 20, border: "1px solid rgba(244,114,182,0.2)" }}>
                  <div style={{ color: "#f472b6", fontWeight: 600, marginBottom: 12 }}>😊 Today's Mood</div>
                  <div style={{ fontSize: 28 }}>{todayLog.mood || "—"}</div>
                </div>
                <div style={{ background: "rgba(167,139,250,0.08)", borderRadius: 20, padding: 20, border: "1px solid rgba(167,139,250,0.2)" }}>
                  <div style={{ color: "#a78bfa", fontWeight: 600, marginBottom: 12 }}>🩹 Symptoms</div>
                  <div style={{ color: "#e2e8f0", fontSize: 14 }}>{todayLog.symptoms?.join(", ") || "None logged"}</div>
                </div>
                {[
                  { label: "💧 Water", value: `${todayLog.water}L`, color: "#38bdf8", bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.2)" },
                  { label: "🌙 Sleep", value: `${todayLog.sleep} hrs`, color: "#c084fc", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.2)" },
                  { label: "⚡ Energy", value: `${todayLog.energy}/10`, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} style={{ background: bg, borderRadius: 20, padding: 20, border: `1px solid ${border}` }}>
                    <div style={{ color, fontWeight: 600, marginBottom: 8 }}>{label}</div>
                    <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond', serif", color: "#e2e8f0" }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PREGNANCY TAB */}
        {activeTab === "pregnancy" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f9a8d4", marginBottom: 20 }}>🤰 Pregnancy Tracker</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 20, border: "1px solid rgba(244,114,182,0.15)" }}>
              <label style={{ color: "#94a3b8" }}>Pregnancy Mode</label>
              <div onClick={() => setProfile(p => ({ ...p, pregnancyMode: !p.pregnancyMode }))}
                style={{ width: 48, height: 26, borderRadius: 13, background: profile.pregnancyMode ? "linear-gradient(135deg,#f472b6,#a78bfa)" : "rgba(255,255,255,0.1)",
                  cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
                <div style={{ position: "absolute", top: 3, left: profile.pregnancyMode ? 25 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.3s" }} />
              </div>
            </div>

            {profile.pregnancyMode && (
              <div>
                <div style={{ background: "rgba(244,114,182,0.06)", borderRadius: 20, padding: 24, border: "1px solid rgba(244,114,182,0.2)", marginBottom: 20 }}>
                  <label style={{ color: "#f9a8d4", fontWeight: 600, display: "block", marginBottom: 12 }}>Pregnancy Week</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <input type="number" min={1} max={42} value={profile.pregnancyWeek}
                      onChange={e => setProfile(p => ({ ...p, pregnancyWeek: parseInt(e.target.value) || 0 }))}
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(244,114,182,0.3)", borderRadius: 12, padding: "10px 16px", color: "#e2e8f0", fontSize: 18, width: 80 }} />
                    <span style={{ color: "#94a3b8" }}>weeks pregnant</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 20, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "#94a3b8", fontSize: 14 }}>Progress to full term (40 weeks)</span>
                    <span style={{ color: "#f472b6", fontWeight: 700 }}>{Math.round((profile.pregnancyWeek / 40) * 100)}%</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 6, height: 10 }}>
                    <div style={{ height: 10, borderRadius: 6, background: "linear-gradient(90deg, #f472b6, #a78bfa)", width: `${Math.min((profile.pregnancyWeek / 40) * 100, 100)}%`, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "#64748b", fontSize: 12 }}>
                    <span>Week 1</span><span>Week 13 · T2</span><span>Week 27 · T3</span><span>Week 40</span>
                  </div>
                </div>

                {/* Weekly tips */}
                <div style={{ background: "rgba(52,211,153,0.06)", borderRadius: 20, padding: 24, border: "1px solid rgba(52,211,153,0.2)" }}>
                  <h3 style={{ color: "#34d399", margin: "0 0 14px", fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>💚 Week {profile.pregnancyWeek} Tip</h3>
                  <p style={{ color: "#e2e8f0", lineHeight: 1.7, margin: 0 }}>
                    {Object.entries(PREGNANCY_TIPS)
                      .sort((a, b) => b[0] - a[0])
                      .find(([w]) => parseInt(w) <= profile.pregnancyWeek)?.[1] || "Enter your pregnancy week to see personalized tips!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TIPS TAB */}
        {activeTab === "tips" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f9a8d4", marginBottom: 20 }}>💡 Health Tips</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {HEALTH_TIPS.map(({ category, icon, tip, color }) => (
                <div key={category} style={{ background: `${color}08`, borderRadius: 20, padding: 24, border: `1px solid ${color}22`,
                  transition: "transform 0.2s, border-color 0.2s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = `${color}55`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = `${color}22`; }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                  <div style={{ color, fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{category}</div>
                  <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "#f9a8d4", marginBottom: 20 }}>👤 Your Profile</h2>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 24, padding: 28, border: "1px solid rgba(167,139,250,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {[
                  { label: "Name", field: "name", type: "text" },
                  { label: "Age", field: "age", type: "number" },
                  { label: "Cycle Length (days)", field: "cycleLength", type: "number" },
                  { label: "Period Duration (days)", field: "periodDuration", type: "number" },
                  { label: "Last Period Start", field: "lastPeriod", type: "date" },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <label style={{ color: "#c084fc", fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>{label}</label>
                    <input type={type} value={profile[field]}
                      onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 12, padding: "10px 14px", color: "#e2e8f0", fontSize: 15, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, padding: 20, background: "rgba(244,114,182,0.06)", borderRadius: 16, border: "1px solid rgba(244,114,182,0.15)" }}>
                <div style={{ color: "#f9a8d4", fontWeight: 600, marginBottom: 8 }}>🔔 Reminders</div>
                <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
                  Based on your profile, your next period is expected on{" "}
                  <strong style={{ color: "#f472b6" }}>
                    {prediction ? prediction.nextPeriod.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "—"}
                  </strong>.
                  Set a device reminder 3 days before that date.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {logModal && (
        <LogModal
          dateStr={logModal}
          existing={logs[logModal]}
          onSave={(data) => { setLogs(prev => ({ ...prev, [logModal]: data })); setLogModal(null); }}
          onClose={() => setLogModal(null)}
        />
      )}

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 16px", background: "rgba(15,7,32,0.9)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(244,114,182,0.15)", zIndex: 50 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, maxWidth: 600, margin: "0 auto" }}>
          {tabs.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, padding: "10px 4px", borderRadius: 14, border: activeTab === id ? "1px solid rgba(244,114,182,0.4)" : "1px solid transparent",
                background: activeTab === id ? "rgba(244,114,182,0.12)" : "transparent",
                color: activeTab === id ? "#f9a8d4" : "#64748b", cursor: "pointer", fontSize: 11, fontWeight: activeTab === id ? 700 : 400,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
