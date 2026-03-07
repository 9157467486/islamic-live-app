import { useState, useEffect, useRef, useCallback } from "react";

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:`linear-gradient(180deg,#051A0D 0%,#0A2E1A 60%,#051A0D 100%)`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      animation:"splashFade 0.5s ease 2.8s forwards",
    }}>
      {/* Decorative rings */}
      {[160,220,280].map((sz,i) => (
        <div key={i} style={{
          position:"absolute", width:sz, height:sz,
          border:`1px solid rgba(201,168,76,${0.12-i*0.03})`,
          borderRadius:"50%", animation:`spin ${15+i*5}s linear infinite`,
          top:"50%", left:"50%",
        }} />
      ))}

      {/* Logo */}
      <div style={{ position:"relative", zIndex:1, textAlign:"center", animation:"splashIn 0.8s ease 0.2s both" }}>
        <img
          src="/islamiclogo.png"
          alt="Minbar Live"
          onError={e => { e.target.style.display="none"; }}
          style={{ width:90, height:90, borderRadius:"50%", border:"2px solid rgba(201,168,76,0.5)", marginBottom:20, objectFit:"cover" }}
        />

        {/* Bismillah Arabic */}
        <div style={{
          color:"#F0D080", fontSize:26, fontFamily:"serif", direction:"rtl",
          lineHeight:1.8, marginBottom:8, letterSpacing:2,
          textShadow:"0 0 30px rgba(201,168,76,0.6)",
          animation:"splashIn 0.8s ease 0.5s both",
        }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>

        {/* Translation */}
        <div style={{
          color:"rgba(255,255,255,0.55)", fontSize:12, fontStyle:"italic",
          marginBottom:28, letterSpacing:0.5,
          animation:"splashIn 0.8s ease 0.8s both",
        }}>
          In the name of Allah, the Most Gracious, the Most Merciful
        </div>

        {/* App name */}
        <div style={{
          color:"#C9A84C", fontSize:13, fontFamily:"'Cinzel',serif",
          letterSpacing:4, fontWeight:600,
          animation:"splashIn 0.8s ease 1.1s both",
        }}>
          MINBAR LIVE
        </div>

        {/* Loading dots */}
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:28, animation:"splashIn 0.8s ease 1.4s both" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(201,168,76,0.5)", animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATION SYSTEM ──────────────────────────────────────────────────────
function playAdhanBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3, 0.6, 0.9, 1.2].forEach(t => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + t + 0.25);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.28);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.3);
    });
  } catch (_) {}
}

function playIqamahBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(t => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(660, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.22);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.25);
    });
  } catch (_) {}
}

async function requestNotifPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission !== "denied") return await Notification.requestPermission();
  return Notification.permission;
}

function sendBrowserNotif(title, body) {
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico", tag: title }); } catch(_) {}
  }
}

function NotifBanner({ notif, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 7000); return () => clearTimeout(t); }, [onDismiss]);
  if (!notif) return null;
  const isAdhan = notif.type === "adhan";
  return (
    <div style={{
      position:"fixed", top:56, left:"50%", transform:"translateX(-50%)",
      width:"calc(100% - 32px)", maxWidth:358, zIndex:999,
      background: isAdhan ? "linear-gradient(135deg,#1A4D2E,#0A2E1A)" : "linear-gradient(135deg,#1A2E4D,#0A1A2E)",
      border:`2px solid ${isAdhan ? "rgba(201,168,76,0.6)" : "rgba(100,180,255,0.5)"}`,
      borderRadius:16, padding:"14px 16px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.7)",
      animation:"slideDown 0.3s ease",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:36, flexShrink:0 }}>{notif.masjidIcon || (isAdhan ? "🕌" : "🟢")}</div>
        <div style={{ flex:1 }}>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:2 }}>
            {isAdhan ? "🔔 ADHAN" : "🟢 IQAMAH"}
          </div>
          <div style={{ color: isAdhan ? "#F0D080" : "#88CCFF", fontWeight:700, fontSize:15, marginBottom:2 }}>
            {notif.prayer} — {notif.masjid}
          </div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>
            {isAdhan ? `Time for ${notif.prayer} prayer • ${notif.time}` : `Prayer starting now • ${notif.time}`}
          </div>
        </div>
        <div onClick={onDismiss} style={{ color:"rgba(255,255,255,0.3)", fontSize:20, cursor:"pointer", flexShrink:0 }}>✕</div>
      </div>
    </div>
  );
}

function usePrayerAlerts(masjids, enabled, onInAppNotif) {
  const fired = useRef(new Set());
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const now   = new Date();
      const hhmm  = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const today = now.toDateString();
      masjids.forEach(m => {
        Object.entries(m.prayerTimes).forEach(([prayer, times]) => {
          const label = ({"fajr":"Fajr","dhuhr":"Dhuhr","asr":"Asr","maghrib":"Maghrib","isha":"Isha","jumuah":"Jumu'ah"})[prayer] || prayer;
          const ak = `${today}-${m.id}-${prayer}-adhan`;
          if (times.adhan === hhmm && !fired.current.has(ak)) {
            fired.current.add(ak);
            playAdhanBeep();
            sendBrowserNotif(
              `🕌 ${m.name} — Adhan ${label}`,
              `Adhan time for ${label} at ${m.name}\n🕐 ${times.adhan} • Allahu Akbar!`
            );
            onInAppNotif({ type:"adhan", prayer:label, masjid:m.name, masjidIcon:m.icon, time:times.adhan });
          }
          const ik = `${today}-${m.id}-${prayer}-iqamah`;
          if (times.iqamah === hhmm && !fired.current.has(ik)) {
            fired.current.add(ik);
            playIqamahBeep();
            sendBrowserNotif(
              `🟢 ${m.name} — Iqamah ${label}`,
              `Iqamah starting for ${label} at ${m.name}\n🕐 ${times.iqamah} • Please join!`
            );
            onInAppNotif({ type:"iqamah", prayer:label, masjid:m.name, masjidIcon:m.icon, time:times.iqamah });
          }
        });
      });
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [masjids, enabled, onInAppNotif]);
}


// ─── THEME ────────────────────────────────────────────────────────────────────
const GOLD       = "#C9A84C";
const DARK_GREEN = "#0A2E1A";
const MID_GREEN  = "#1A4D2E";
const LIGHT_GOLD = "#F0D080";
const OFF_WHITE  = "#F8F4E8";

const arabicPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='0.06'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// Change this to something only YOU know!
const MASTER_PASSWORD = "minbar-master-2026";

// ─── 4 MASJIDS — each has own YouTube channel + own admin password ───────────
const MASJIDS_DEFAULT = [
  {
    id: "m1", name: "Jumma Masjid",             icon: "🕌",
    color: "#1A4D2E",
    password: "jumma123",
    youtubeUrl: "",   // ← Admin pastes YouTube Live link here from admin panel
    isLive: false,
    prayerTimes: {
      fajr:    { adhan: "05:15", iqamah: "05:30" },
      dhuhr:   { adhan: "13:15", iqamah: "13:30" },
      asr:     { adhan: "16:30", iqamah: "16:45" },
      maghrib: { adhan: "18:35", iqamah: "18:40" },
      isha:    { adhan: "19:55", iqamah: "20:10" },
      jumuah:  { adhan: "13:00", iqamah: "13:15" },
    },
    recordings: [],
  },
  {
    id: "m2", name: "Masjid-e-Aqsa",            icon: "🕍",
    color: "#1A2E4D",
    password: "aqsa456",
    youtubeUrl: "",
    isLive: false,
    prayerTimes: {
      fajr:    { adhan: "05:10", iqamah: "05:25" },
      dhuhr:   { adhan: "13:10", iqamah: "13:25" },
      asr:     { adhan: "16:25", iqamah: "16:40" },
      maghrib: { adhan: "18:30", iqamah: "18:35" },
      isha:    { adhan: "19:50", iqamah: "20:05" },
      jumuah:  { adhan: "12:55", iqamah: "13:10" },
    },
    recordings: [],
  },
  {
    id: "m3", name: "Masjid-e-Muhammadi (SAW)",  icon: "☪️",
    color: "#2E1A4D",
    password: "muhammadi789",
    youtubeUrl: "",
    isLive: false,
    prayerTimes: {
      fajr:    { adhan: "05:20", iqamah: "05:35" },
      dhuhr:   { adhan: "13:20", iqamah: "13:35" },
      asr:     { adhan: "16:35", iqamah: "16:50" },
      maghrib: { adhan: "18:40", iqamah: "18:45" },
      isha:    { adhan: "20:00", iqamah: "20:15" },
      jumuah:  { adhan: "13:05", iqamah: "13:20" },
    },
    recordings: [],
  },
  {
    id: "m4", name: "Masjid-e-Fatima",           icon: "🌙",
    color: "#4D2E1A",
    password: "fatima321",
    youtubeUrl: "",
    isLive: false,
    prayerTimes: {
      fajr:    { adhan: "05:18", iqamah: "05:33" },
      dhuhr:   { adhan: "13:18", iqamah: "13:33" },
      asr:     { adhan: "16:28", iqamah: "16:43" },
      maghrib: { adhan: "18:33", iqamah: "18:38" },
      isha:    { adhan: "19:53", iqamah: "20:08" },
      jumuah:  { adhan: "13:02", iqamah: "13:17" },
    },
    recordings: [],
  },
];

const PRAYER_LABELS = {
  fajr:    { name: "Fajr",    icon: "🌙" },
  dhuhr:   { name: "Dhuhr",   icon: "☀️" },
  asr:     { name: "Asr",     icon: "🌤" },
  maghrib: { name: "Maghrib", icon: "🌅" },
  isha:    { name: "Isha",    icon: "⭐" },
  jumuah:  { name: "Jumu'ah", icon: "🕌" },
};

const library = [
  { title: "Importance of Sabr",    masjid: "Jumma Masjid",             duration: "42 min", date: "Mar 5"  },
  { title: "Marriage in Islam",     masjid: "Masjid-e-Aqsa",            duration: "35 min", date: "Mar 3"  },
  { title: "Tafsir Surah Yaseen",   masjid: "Masjid-e-Muhammadi (SAW)", duration: "58 min", date: "Mar 1"  },
  { title: "Tawakkul & Trust",      masjid: "Masjid-e-Fatima",          duration: "29 min", date: "Feb 28" },
];






// ─── HELPERS ──────────────────────────────────────────────────────────────────
function PulsingDot({ color = "#FF4444" }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
      <span style={{ position: "absolute", width: 9, height: 9, borderRadius: "50%", background: color, opacity: 0.4, animation: "ripple 1.5s ease-in-out infinite" }} />
    </span>
  );
}

function SectionTitle({ children }) {
  return <div style={{ color: LIGHT_GOLD, fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>{children}</div>;
}

// ─── YOUTUBE HELPERS ──────────────────────────────────────────────────────────
// Converts any YouTube URL to an embeddable iframe URL
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    // Handle youtu.be/XXXX
    const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (short) return `https://www.youtube.com/embed/${short[1]}?autoplay=1`;
    // Handle youtube.com/watch?v=XXXX
    const full = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (full) return `https://www.youtube.com/embed/${full[1]}?autoplay=1`;
    // Handle youtube.com/live/XXXX
    const live = url.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (live) return `https://www.youtube.com/embed/${live[1]}?autoplay=1`;
    // Already an embed URL
    if (url.includes("youtube.com/embed/")) return url;
  } catch (_) {}
  return null;
}

// ─── PASSWORD LOGIN ───────────────────────────────────────────────────────────
function PasswordLogin({ masjid, onSuccess, onCancel }) {
  const [pw, setPw]           = useState("");
  const [error, setError]     = useState("");
  const [show, setShow]       = useState(false);
  const [recovery, setRecovery] = useState(false);

  const attempt = () => {
    if (pw === masjid.password || pw === MASTER_PASSWORD) {
      onSuccess();
    } else {
      setError(recovery ? "Incorrect master password." : "Incorrect password. Try again.");
      setPw("");
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:`linear-gradient(180deg,#122B1C,${DARK_GREEN})`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:340 }}>

        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{ fontSize:40, marginBottom:10 }}>{masjid.icon}</div>
          <div style={{ color:LIGHT_GOLD, fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{masjid.name}</div>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:4 }}>
            {recovery ? "🔑 Master Recovery Login" : "Admin Login Required"}
          </div>
        </div>

        {/* Toggle between normal and recovery */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <div onClick={() => { setRecovery(false); setPw(""); setError(""); }} style={{
            flex:1, textAlign:"center", padding:"8px",
            background: !recovery ? `linear-gradient(135deg,${GOLD},${LIGHT_GOLD})` : "rgba(26,77,46,0.3)",
            border:`1px solid ${!recovery ? "transparent" : "rgba(201,168,76,0.2)"}`,
            borderRadius:10, color: !recovery ? DARK_GREEN : "rgba(255,255,255,0.5)",
            fontSize:12, fontWeight:700, cursor:"pointer",
          }}>🔒 My Password</div>
          <div onClick={() => { setRecovery(true); setPw(""); setError(""); }} style={{
            flex:1, textAlign:"center", padding:"8px",
            background: recovery ? `linear-gradient(135deg,#AA3300,#FF5522)` : "rgba(26,77,46,0.3)",
            border:`1px solid ${recovery ? "transparent" : "rgba(201,168,76,0.2)"}`,
            borderRadius:10, color: recovery ? "#fff" : "rgba(255,255,255,0.5)",
            fontSize:12, fontWeight:700, cursor:"pointer",
          }}>🆘 Forgot?</div>
        </div>

        {recovery && (
          <div style={{ background:"rgba(255,100,50,0.1)", border:"1px solid rgba(255,100,50,0.3)", borderRadius:10, padding:"10px 12px", marginBottom:14, color:"rgba(255,200,150,0.8)", fontSize:12, lineHeight:1.6 }}>
            Enter the <span style={{ color:"#FFA070", fontWeight:700 }}>Master Recovery Password</span> to access any masjid admin. Only the app owner knows this.
          </div>
        )}

        <div style={{ color:GOLD, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>
          {recovery ? "MASTER PASSWORD" : "ADMIN PASSWORD"}
        </div>
        <div style={{ position:"relative", marginBottom:8 }}>
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder={recovery ? "Enter master recovery password" : "Enter admin password"}
            style={{ width:"100%", background:"rgba(26,77,46,0.5)", borderRadius:10, padding:"13px 44px 13px 14px", color:OFF_WHITE, fontSize:14, outline:"none", border:`1px solid ${error ? "#FF6666" : "rgba(201,168,76,0.3)"}` }}
          />
          <span onClick={() => setShow(s => !s)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:16 }}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>
        {error && <div style={{ color:"#FF8888", fontSize:12, marginBottom:12 }}>⚠️ {error}</div>}

        <button onClick={attempt} style={{ width:"100%", padding:"13px", background: recovery ? "linear-gradient(135deg,#AA3300,#FF5522)" : `linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, border:"none", borderRadius:12, color: recovery ? "#fff" : DARK_GREEN, fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
          {recovery ? "🆘 Recover Access" : "🔓 Login"}
        </button>
        <button onClick={onCancel} style={{ width:"100%", padding:"11px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"rgba(255,255,255,0.4)", fontSize:14, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── CHANGE PASSWORD COMPONENT ────────────────────────────────────────────────
function ChangePassword({ masjid, onUpdateMasjid }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showAll,   setShowAll]   = useState(false);
  const [msg,       setMsg]       = useState(null); // { type: "success"|"error", text }

  const handleChange = () => {
    setMsg(null);
    if (!currentPw || !newPw || !confirmPw) {
      setMsg({ type:"error", text:"Please fill in all fields." }); return;
    }
    if (currentPw !== masjid.password && currentPw !== MASTER_PASSWORD) {
      setMsg({ type:"error", text:"Current password is incorrect." }); return;
    }
    if (newPw.length < 6) {
      setMsg({ type:"error", text:"New password must be at least 6 characters." }); return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type:"error", text:"New passwords do not match." }); return;
    }
    onUpdateMasjid(masjid.id, { password: newPw });
    setMsg({ type:"success", text:"✅ Password changed successfully!" });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div style={{ marginTop:20, background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ color:GOLD, fontWeight:700, fontSize:14 }}>🔐 Change Password</div>
        <div onClick={() => setShowAll(s => !s)} style={{ color:"rgba(255,255,255,0.35)", fontSize:12, cursor:"pointer" }}>
          {showAll ? "🙈 Hide" : "👁️ Show"}
        </div>
      </div>

      {[
        { label:"CURRENT PASSWORD", val:currentPw, set:setCurrentPw, ph:"Enter current password" },
        { label:"NEW PASSWORD",     val:newPw,     set:setNewPw,     ph:"Min 6 characters"       },
        { label:"CONFIRM NEW",      val:confirmPw, set:setConfirmPw, ph:"Repeat new password"    },
      ].map(f => (
        <div key={f.label} style={{ marginBottom:12 }}>
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:5 }}>{f.label}</div>
          <input
            type={showAll ? "text" : "password"}
            value={f.val}
            onChange={e => { f.set(e.target.value); setMsg(null); }}
            placeholder={f.ph}
            style={{ width:"100%", background:"rgba(10,46,26,0.6)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:9, padding:"11px 13px", color:OFF_WHITE, fontSize:13, outline:"none" }}
          />
        </div>
      ))}

      {msg && (
        <div style={{ background: msg.type === "success" ? "rgba(50,180,80,0.15)" : "rgba(255,68,68,0.12)", border:`1px solid ${msg.type === "success" ? "rgba(50,180,80,0.4)" : "rgba(255,68,68,0.3)"}`, borderRadius:9, padding:"9px 12px", marginBottom:12, color: msg.type === "success" ? "#88EE88" : "#FF9999", fontSize:13 }}>
          {msg.text}
        </div>
      )}

      <button onClick={handleChange} style={{ width:"100%", padding:"12px", background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, border:"none", borderRadius:11, color:DARK_GREEN, fontSize:14, fontWeight:700, cursor:"pointer" }}>
        🔑 Update Password
      </button>

      <div style={{ color:"rgba(255,255,255,0.25)", fontSize:11, marginTop:10, lineHeight:1.6 }}>
        💡 Tip: If you forget your password, use the <span style={{ color:GOLD }}>Master Recovery Password</span> on the login screen.
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ masjid, onClose, onUpdateMasjid }) {
  const [tab, setTab]         = useState("live");
  const [topic,   setTopic]   = useState("");
  const [speaker, setSpeaker] = useState("");
  const [ytUrl,   setYtUrl]   = useState(masjid.youtubeUrl || "");
  const [times, setTimes]     = useState(masjid.prayerTimes);
  const [recordings]          = useState(masjid.recordings || []);
  const [saved, setSaved]     = useState(false);
  const [urlSaved, setUrlSaved] = useState(false);

  const isLive = masjid.isLive;

  const goLive = () => {
    if (!ytUrl.trim()) return;
    onUpdateMasjid(masjid.id, { youtubeUrl: ytUrl.trim(), isLive: true, topic, speaker });
    setUrlSaved(true); setTimeout(() => setUrlSaved(false), 2000);
  };

  const endLive = () => {
    onUpdateMasjid(masjid.id, { isLive: false, youtubeUrl: "" });
    setYtUrl("");
  };

  const saveSettings = () => {
    onUpdateMasjid(masjid.id, { prayerTimes: times });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const updateTime = (prayer, field, val) => {
    setTimes(t => ({ ...t, [prayer]: { ...t[prayer], [field]: val } }));
  };

  const tabs = [
    { id:"live",      icon:"🔴", label:"Live"      },
    { id:"recording", icon:"🎙️", label:"Recording" },
    { id:"settings",  icon:"⚙️", label:"Settings"  },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:`linear-gradient(180deg,#0E2418,${DARK_GREEN})`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:390, maxHeight:"92vh", display:"flex", flexDirection:"column" }}>

        <div style={{ padding:"12px 20px 0", flexShrink:0 }}>
          <div style={{ width:40, height:4, background:"rgba(201,168,76,0.3)", borderRadius:2, margin:"0 auto 14px" }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div>
              <div style={{ color:LIGHT_GOLD, fontSize:17, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>{masjid.icon} {masjid.name}</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Admin Panel</div>
            </div>
            <div onClick={onClose} style={{ color:"rgba(255,255,255,0.4)", fontSize:24, cursor:"pointer" }}>✕</div>
          </div>
          <div style={{ display:"flex", gap:6, marginBottom:16, background:"rgba(0,0,0,0.3)", borderRadius:12, padding:4 }}>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, textAlign:"center", padding:"9px 4px", background:tab===t.id?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"transparent", borderRadius:9, cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:16 }}>{t.icon}</div>
                <div style={{ color:tab===t.id?DARK_GREEN:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, marginTop:2 }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"0 20px 40px" }}>

          {/* ── LIVE TAB ── */}
          {tab === "live" && (
            <div>
              {/* Currently Live Banner */}
              {isLive && (
                <div style={{ background:"rgba(255,68,68,0.12)", border:"1px solid rgba(255,68,68,0.4)", borderRadius:14, padding:"14px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <PulsingDot />
                    <div>
                      <div style={{ color:"#FF9999", fontWeight:700, fontSize:14 }}>STREAM IS LIVE</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>{masjid.name}</div>
                    </div>
                  </div>
                  <div style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}
                    onClick={() => window.open(masjid.youtubeUrl,"_blank")}>
                    Open YT →
                  </div>
                </div>
              )}

              {/* How it works info */}
              <div style={{ background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,100,100,0.2)", borderRadius:12, padding:"12px 14px", marginBottom:18 }}>
                <div style={{ color:"#FF9999", fontWeight:700, fontSize:13, marginBottom:6 }}>📺 How YouTube Live Works</div>
                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, lineHeight:1.8 }}>
                  1. Open <span style={{ color:GOLD }}>YouTube</span> app on your phone{"\n"}
                  2. Tap ➕ → <span style={{ color:GOLD }}>Go Live</span>{"\n"}
                  3. Copy the YouTube Live link{"\n"}
                  4. Paste it below and tap <span style={{ color:GOLD }}>Go Live</span>
                </div>
              </div>

              {/* Topic & Speaker */}
              {[
                { label:"TOPIC / TITLE", val:topic,   set:setTopic,   ph:"e.g. Friday Khutbah" },
                { label:"SPEAKER NAME",  val:speaker, set:setSpeaker, ph:"e.g. Maulana Rashid"  },
              ].map(f => (
                <div key={f.label} style={{ marginBottom:14 }}>
                  <div style={{ color:GOLD, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:6 }}>{f.label}</div>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    style={{ width:"100%", background:"rgba(26,77,46,0.5)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"12px 14px", color:OFF_WHITE, fontSize:14, outline:"none" }} />
                </div>
              ))}

              {/* YouTube URL */}
              <div style={{ marginBottom:16 }}>
                <div style={{ color:GOLD, fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:6 }}>YOUTUBE LIVE LINK</div>
                <input
                  value={ytUrl}
                  onChange={e => setYtUrl(e.target.value)}
                  placeholder="https://youtube.com/live/XXXXXXXXX"
                  style={{ width:"100%", background:"rgba(26,77,46,0.5)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"12px 14px", color:OFF_WHITE, fontSize:13, outline:"none" }}
                />
                <div style={{ color:"rgba(255,255,255,0.2)", fontSize:11, marginTop:6 }}>
                  Paste any YouTube link — youtube.com/watch?v=... or youtu.be/...
                </div>
              </div>

              {!isLive ? (
                <button onClick={goLive} disabled={!ytUrl.trim()} style={{
                  width:"100%", padding:"15px",
                  background: ytUrl.trim() ? "linear-gradient(135deg,#AA1111,#EE3333)" : "rgba(255,68,68,0.2)",
                  border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700,
                  cursor: ytUrl.trim() ? "pointer" : "not-allowed",
                  boxShadow: ytUrl.trim() ? "0 4px 20px rgba(255,68,68,0.35)" : "none",
                }}>
                  {urlSaved ? "✅ Now Live!" : "🔴 Go Live"}
                </button>
              ) : (
                <button onClick={endLive} style={{ width:"100%", padding:"15px", background:"rgba(255,68,68,0.15)", border:"1px solid rgba(255,68,68,0.5)", borderRadius:14, color:"#FF9999", fontSize:16, fontWeight:700, cursor:"pointer" }}>
                  ⏹ End Live Stream
                </button>
              )}

              <div style={{ textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:11, marginTop:12 }}>
                Powered by YouTube Live • 100% Free • Unlimited Viewers
              </div>
            </div>
          )}

          {/* ── RECORDING TAB ── */}
          {tab === "recording" && (
            <div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:20, lineHeight:1.6 }}>
                Past YouTube Live sessions saved here. YouTube also auto-saves them on your channel.
              </div>
              {recordings.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🎙️</div>
                  <div style={{ color:"rgba(255,255,255,0.3)", fontSize:14 }}>No recordings yet</div>
                  <div style={{ color:"rgba(255,255,255,0.2)", fontSize:12, marginTop:6 }}>Go live first — sessions will appear here</div>
                </div>
              ) : recordings.map((r, i) => (
                <div key={i} style={{ background:"rgba(26,77,46,0.4)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ color:OFF_WHITE, fontWeight:600, fontSize:14 }}>{r.topic || "Live Session"}</div>
                      <div style={{ color:GOLD, fontSize:12, marginTop:2 }}>{r.speaker}</div>
                      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:4 }}>{r.date} • {r.duration}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div onClick={() => window.open(r.url,"_blank")} style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>▶ Play</div>
                      <div style={{ background:"rgba(255,68,68,0.15)", border:"1px solid rgba(255,68,68,0.3)", borderRadius:20, padding:"6px 12px", color:"#FF9999", fontSize:12, cursor:"pointer" }}>🗑</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === "settings" && (
            <div>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:20, lineHeight:1.6 }}>
                Set Adhan & Iqamah times for <span style={{ color:GOLD }}>{masjid.name}</span>.
              </div>
              {Object.entries(PRAYER_LABELS).map(([key, { name, icon }]) => (
                <div key={key} style={{ background:"rgba(26,77,46,0.35)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                    <span style={{ fontSize:18 }}>{icon}</span>
                    <span style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:15 }}>{name}</span>
                    {key === "jumuah" && <span style={{ background:"rgba(201,168,76,0.2)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:20, padding:"2px 10px", color:GOLD, fontSize:10, fontWeight:700 }}>FRIDAY</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {["adhan","iqamah"].map(field => (
                      <div key={field}>
                        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:1, marginBottom:5 }}>{field.toUpperCase()}</div>
                        <input type="time" value={times[key][field]} onChange={e => updateTime(key, field, e.target.value)}
                          style={{ width:"100%", background:"rgba(10,46,26,0.6)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:8, padding:"9px 10px", color:OFF_WHITE, fontSize:14, outline:"none", colorScheme:"dark" }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveSettings} style={{ width:"100%", padding:"15px", marginTop:8, background:saved?`linear-gradient(135deg,#1A6B3A,#2E8B57)`:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, border:"none", borderRadius:14, color:saved?"#fff":DARK_GREEN, fontSize:16, fontWeight:700, cursor:"pointer", transition:"all 0.3s" }}>
                {saved ? "✅ Saved!" : "💾 Save Prayer Times"}
              </button>
              <ChangePassword masjid={masjid} onUpdateMasjid={onUpdateMasjid} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── MASJID LIVE PLAYER (user view) ──────────────────────────────────────────
function MasjidLivePlayer({ masjid, onBack }) {
  const embedUrl = getYouTubeEmbedUrl(masjid.youtubeUrl);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 114px)" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${masjid.color})`, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"7px 14px", color:GOLD, fontSize:13, fontWeight:700, cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {masjid.isLive && <PulsingDot />}
            <span style={{ color:masjid.isLive?"#FF7777":"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, letterSpacing:1 }}>
              {masjid.isLive ? "LIVE NOW" : "OFFLINE"}
            </span>
          </div>
          <div style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:14, fontFamily:"'Playfair Display',serif" }}>{masjid.icon} {masjid.name}</div>
        </div>
        {masjid.youtubeUrl && (
          <div onClick={() => window.open(masjid.youtubeUrl,"_blank")} style={{ background:`linear-gradient(135deg,#CC0000,#FF0000)`, color:"#fff", borderRadius:20, padding:"6px 12px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
            YT ↗
          </div>
        )}
      </div>

      {/* YouTube Player or Offline */}
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={`${masjid.name} Live`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ flex:1, border:"none", width:"100%", background:"#000" }}
        />
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#000", padding:24 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>{masjid.icon}</div>
          <div style={{ color:LIGHT_GOLD, fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:8, textAlign:"center" }}>{masjid.name}</div>
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:14, textAlign:"center", lineHeight:1.7 }}>
            No live stream right now.{"\n"}
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>Admin will start a YouTube Live session soon.</span>
          </div>
          <div style={{ marginTop:24, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:12, padding:"12px 20px", color:"rgba(255,255,255,0.4)", fontSize:12, textAlign:"center" }}>
            🔔 Turn on notifications to get alerted when stream starts
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE PAGE ─────────────────────────────────────────────────────────────────
function LivePage({ masjids }) {
  const [activeMasjid, setActiveMasjid] = useState(null);
  if (activeMasjid) {
    const latest = masjids.find(m => m.id === activeMasjid.id) || activeMasjid;
    return <MasjidLivePlayer masjid={latest} onBack={() => setActiveMasjid(null)} />;
  }

  return (
    <div style={{ padding:"20px 20px 80px" }}>
      <SectionTitle>📡 Live Bayans</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginBottom:22 }}>Tap any masjid to watch their YouTube Live</div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {masjids.map(m => (
          <div key={m.id} style={{ background:`linear-gradient(135deg,${m.color} 0%,rgba(10,46,26,0.95) 100%)`, border:`1px solid rgba(201,168,76,0.2)`, borderLeft:`3px solid ${m.isLive?"#FF4444":"rgba(255,255,255,0.15)"}`, borderRadius:16, padding:"16px", cursor:"pointer" }}
            onClick={() => setActiveMasjid(m)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:34 }}>{m.icon}</span>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    {m.isLive ? <PulsingDot /> : <span style={{ width:8, height:8, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"inline-block" }} />}
                    <span style={{ color:m.isLive?"#FF7777":"rgba(255,255,255,0.3)", fontSize:11, fontWeight:700, letterSpacing:1 }}>
                      {m.isLive ? "LIVE NOW" : "OFFLINE"}
                    </span>
                  </div>
                  <div style={{ color:OFF_WHITE, fontWeight:700, fontSize:14, fontFamily:"'Playfair Display',serif" }}>{m.name}</div>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginTop:2 }}>
                    {m.isLive ? (m.topic || "Live stream in progress") : "No stream right now"}
                  </div>
                </div>
              </div>
              <button style={{ background:m.isLive?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"rgba(255,255,255,0.08)", border:`1px solid ${m.isLive?"transparent":"rgba(255,255,255,0.15)"}`, borderRadius:20, padding:"8px 16px", color:m.isLive?DARK_GREEN:"rgba(255,255,255,0.3)", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                {m.isLive ? "Watch →" : "Offline"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* YouTube info */}
      <div style={{ marginTop:20, background:"rgba(255,0,0,0.06)", border:"1px solid rgba(255,0,0,0.15)", borderRadius:14, padding:"14px 16px" }}>
        <div style={{ color:"#FF9999", fontWeight:700, fontSize:13, marginBottom:6 }}>📺 About Live Streams</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, lineHeight:1.8 }}>
          Each masjid streams live on YouTube. Admin starts the stream and shares the link here. You can also open it directly on YouTube for full screen.
        </div>
      </div>
    </div>
  );
}

// ─── HOME PAGE ─────────────────────────────────────────────────────────────────
function HomePage({ setPage, masjids }) {
  const jumma = masjids[0]; // Jumma Masjid is first
  const prayers = [
    { key:"fajr",    name:"Fajr",    icon:"🌙" },
    { key:"dhuhr",   name:"Dhuhr",   icon:"☀️" },
    { key:"asr",     name:"Asr",     icon:"🌤"  },
    { key:"maghrib", name:"Maghrib", icon:"🌅" },
    { key:"isha",    name:"Isha",    icon:"⭐" },
  ];

  // Find next prayer based on current time
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const nextPrayer = prayers.find(p => toMins(jumma.prayerTimes[p.key].adhan) > nowMins) || prayers[0];
  return (
    <div style={{ padding: "0 0 80px" }}>
      <div style={{ background: `linear-gradient(135deg,${DARK_GREEN} 0%,${MID_GREEN} 100%)`, padding: "20px 20px 28px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ color: GOLD, fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>MINBAR LIVE</div>
            <div style={{ color: OFF_WHITE, fontSize: 17, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>Assalamu Alaikum 🌿</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", background: "rgba(201,168,76,0.1)" }}>🔔</div>
        </div>

        {/* Next Prayer — from Jumma Masjid live data */}
        <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 14, padding: "12px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: 1, marginBottom:2 }}>NEXT PRAYER</div>
              <div style={{ color: LIGHT_GOLD, fontSize: 19, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>{nextPrayer.name}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: OFF_WHITE, fontSize: 22, fontWeight: 700 }}>{jumma.prayerTimes[nextPrayer.key].adhan}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Adhan</div>
            </div>
          </div>
          {/* Jumma Masjid label */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:14 }}>{jumma.icon}</span>
              <span style={{ color: GOLD, fontSize: 12, fontWeight:700 }}>{jumma.name}</span>
            </div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>
              Iqamah: <span style={{ color:GOLD }}>{jumma.prayerTimes[nextPrayer.key].iqamah}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Prayer strip — Jumma Masjid adhan times */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:700 }}>{jumma.icon} {jumma.name} — Today's Timings</div>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
          {prayers.map((p) => {
            const isNext = p.key === nextPrayer.key;
            return (
              <div key={p.name} style={{ flex: "0 0 auto", background: isNext ? `linear-gradient(135deg,${GOLD},${LIGHT_GOLD})` : "rgba(26,77,46,0.3)", border: `1px solid ${isNext ? GOLD : "rgba(201,168,76,0.2)"}`, borderRadius: 12, padding: "10px 12px", textAlign: "center", minWidth: 70 }}>
                <div style={{ fontSize: 15 }}>{p.icon}</div>
                <div style={{ color: isNext ? DARK_GREEN : GOLD, fontSize: 10, fontWeight: 700 }}>{p.name}</div>
                <div style={{ color: isNext ? DARK_GREEN : OFF_WHITE, fontSize: 11, fontWeight: 600 }}>{jumma.prayerTimes[p.key].adhan}</div>
                <div style={{ color: isNext ? `${DARK_GREEN}99` : "rgba(255,255,255,0.35)", fontSize: 9 }}>{jumma.prayerTimes[p.key].iqamah}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ color: OFF_WHITE, fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display',serif" }}>🔴 Live Bayans</div>
          <div onClick={() => setPage("live")} style={{ color: GOLD, fontSize: 12, cursor: "pointer" }}>See All →</div>
        </div>
        {masjids.map(m => (
          <div key={m.id} onClick={() => setPage("live")} style={{ background:`linear-gradient(135deg,${m.color},rgba(10,46,26,0.9))`, border:"1px solid rgba(201,168,76,0.18)", borderLeft:`3px solid ${m.isLive?"#FF4444":"rgba(255,255,255,0.1)"}`, borderRadius:13, padding:"13px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>{m.icon}</span>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                  {m.isLive ? <PulsingDot /> : <span style={{ width:7, height:7, borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"inline-block" }} />}
                  <span style={{ color:m.isLive?"#FF7777":"rgba(255,255,255,0.25)", fontSize:10, fontWeight:700 }}>{m.isLive?"LIVE":"OFFLINE"}</span>
                </div>
                <div style={{ color:OFF_WHITE, fontWeight:600, fontSize:13 }}>{m.name}</div>
              </div>
            </div>
            <div style={{ background:m.isLive?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"rgba(255,255,255,0.06)", border:`1px solid ${m.isLive?"transparent":"rgba(255,255,255,0.1)"}`, color:m.isLive?DARK_GREEN:"rgba(255,255,255,0.25)", borderRadius:16, padding:"5px 12px", fontSize:12, fontWeight:700 }}>
              {m.isLive ? "Watch" : "Offline"}
            </div>
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div style={{ padding: "18px 20px 0" }}>
        <div style={{ color: OFF_WHITE, fontSize: 15, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 10 }}>Quick Access</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon:"📖", label:"Quran",   color:"#2E5E3A", page:"quran"   },
            { icon:"🤲", label:"Duas",    color:"#1A3D5C", page:"dua"     },
            { icon:"📿", label:"Tasbeeh", color:"#3D2A5C", page:"tasbeeh" },
            { icon:"🎧", label:"Library", color:"#5C3D1A", page:"library" },
          ].map(item => (
            <div key={item.label} onClick={() => setPage(item.page)} style={{ background:`linear-gradient(135deg,${item.color},rgba(10,46,26,0.8))`, border:"1px solid rgba(201,168,76,0.18)", borderRadius:13, padding:"16px", display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <span style={{ fontSize:26 }}>{item.icon}</span>
              <span style={{ color:OFF_WHITE, fontWeight:600, fontSize:14 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LIBRARY PAGE ──────────────────────────────────────────────────────────────
function LibraryPage() {
  return (
    <div style={{ padding: "20px 20px 80px" }}>
      <SectionTitle>🎧 Bayan Library</SectionTitle>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 18 }}>Past recordings from your masjids</div>
      <div style={{ background:"rgba(26,77,46,0.4)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:12, padding:"11px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <span style={{ fontSize:17 }}>🔍</span><span style={{ color:"rgba(255,255,255,0.3)", fontSize:13 }}>Search bayans, scholars, masjids...</span>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:18, overflowX:"auto", scrollbarWidth:"none" }}>
        {["All","Friday Khutbah","Tafsir","Ramadan","Youth"].map((f,i) => (
          <div key={f} style={{ flex:"0 0 auto", background:i===0?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"rgba(26,77,46,0.4)", border:`1px solid ${i===0?"transparent":"rgba(201,168,76,0.2)"}`, borderRadius:20, padding:"6px 14px", color:i===0?DARK_GREEN:OFF_WHITE, fontSize:12, fontWeight:600, cursor:"pointer" }}>{f}</div>
        ))}
      </div>
      {library.map((item,i) => (
        <div key={i} style={{ background:"linear-gradient(135deg,rgba(26,77,46,0.5),rgba(10,46,26,0.8))", border:"1px solid rgba(201,168,76,0.15)", borderRadius:13, padding:"14px", marginBottom:9, display:"flex", gap:12, alignItems:"center", cursor:"pointer" }}>
          <div style={{ width:46, height:46, borderRadius:11, background:`linear-gradient(135deg,${MID_GREEN},${DARK_GREEN})`, border:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🎙</div>
          <div style={{ flex:1 }}>
            <div style={{ color:OFF_WHITE, fontWeight:600, fontSize:14, marginBottom:2 }}>{item.title}</div>
            <div style={{ color:GOLD, fontSize:11 }}>{item.masjid}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11 }}>{item.duration}</div>
            <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10 }}>{item.date}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── DUA PAGE ──────────────────────────────────────────────────────────────────
function DuaPage() {
  return (
    <div style={{ padding:"20px 20px 80px" }}>
      <SectionTitle>🤲 Dua Collection</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:24 }}>Authentic duas from Quran & Sunnah</div>

      <div style={{ background:`linear-gradient(135deg,${MID_GREEN},#1A2E4A)`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:20, padding:"20px", marginBottom:20, textAlign:"center" }}>
        <div style={{ color:GOLD, fontSize:11, letterSpacing:2, marginBottom:8 }}>DUA OF THE DAY</div>
        <div style={{ color:LIGHT_GOLD, fontSize:21, lineHeight:1.6, fontFamily:"serif", marginBottom:10, direction:"rtl" }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً
        </div>
        <div style={{ color:"rgba(255,255,255,0.65)", fontSize:12, fontStyle:"italic" }}>
          "Our Lord, give us good in this world and good in the Hereafter..."
        </div>
      </div>

      <a href="/Daily-Essential-Duas.pdf" target="_blank" rel="noreferrer" style={{ textDecoration:"none", display:"block", marginBottom:20 }}>
        <div style={{
          background:`linear-gradient(135deg,#1A2E4A,#0A1A2E)`,
          border:`2px solid rgba(100,150,255,0.3)`,
          borderRadius:18, padding:"28px 20px", textAlign:"center", cursor:"pointer",
          boxShadow:"0 8px 28px rgba(0,0,0,0.4)",
        }}>
          <div style={{ fontSize:52, marginBottom:10 }}>🤲</div>
          <div style={{ color:LIGHT_GOLD, fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:6 }}>40+ Daily Essential Duas</div>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginBottom:16 }}>Morning, Evening, Travel, Sleep & more</div>
          <div style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, borderRadius:20, padding:"10px 28px", fontSize:14, fontWeight:700, display:"inline-block" }}>
            📖 Open Duas →
          </div>
        </div>
      </a>

      <div style={{ color:OFF_WHITE, fontSize:14, fontWeight:700, marginBottom:12 }}>Categories</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {[
          { icon:"🌅", name:"Morning Duas"  },
          { icon:"🌙", name:"Evening Duas"  },
          { icon:"✈️", name:"Travel Dua"   },
          { icon:"😴", name:"Before Sleep"  },
          { icon:"🍽️", name:"After Eating" },
          { icon:"🤲", name:"Forgiveness"   },
        ].map(cat => (
          <a key={cat.name} href="/Daily-Essential-Duas.pdf" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <div style={{ background:"rgba(26,77,46,0.4)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:13, padding:"16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer" }}>
              <span style={{ fontSize:28 }}>{cat.icon}</span>
              <span style={{ color:OFF_WHITE, fontSize:12, fontWeight:600, textAlign:"center" }}>{cat.name}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── TASBEEH PAGE ──────────────────────────────────────────────────────────────
function TasbeehPage() {
  const [counts, setCounts] = useState({ sub:0, alh:0, all:0 });
  const [active, setActive] = useState("sub");
  const keys  = { sub:"SubhanAllah", alh:"Alhamdulillah", all:"Allahu Akbar" };
  const total = counts.sub + counts.alh + counts.all;
  return (
    <div style={{ padding:"20px 20px 80px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ color:LIGHT_GOLD, fontSize:21, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:22, alignSelf:"flex-start" }}>📿 Digital Tasbeeh</div>
      <div style={{ display:"flex", gap:8, marginBottom:28, width:"100%" }}>
        {Object.entries(keys).map(([k,v]) => (
          <div key={k} onClick={() => setActive(k)} style={{ flex:1, textAlign:"center", background:active===k?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"rgba(26,77,46,0.4)", border:`1px solid ${active===k?"transparent":"rgba(201,168,76,0.2)"}`, borderRadius:10, padding:"9px 4px", color:active===k?DARK_GREEN:OFF_WHITE, fontSize:10, fontWeight:700, cursor:"pointer", lineHeight:1.3 }}>{v}</div>
        ))}
      </div>
      <div onClick={() => setCounts(c => ({ ...c, [active]:c[active]+1 }))} style={{ width:190, height:190, borderRadius:"50%", background:`radial-gradient(circle at 40% 40%,${MID_GREEN},${DARK_GREEN})`, border:`3px solid ${GOLD}`, boxShadow:"0 0 50px rgba(201,168,76,0.3),inset 0 0 30px rgba(0,0,0,0.3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", userSelect:"none", marginBottom:20 }}>
        <div style={{ color:LIGHT_GOLD, fontSize:48, fontWeight:700, lineHeight:1 }}>{counts[active]}</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>{keys[active]}</div>
      </div>
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:13, marginBottom:20 }}>Total: <span style={{ color:GOLD, fontWeight:700 }}>{total}</span></div>
      <div onClick={() => setCounts({sub:0,alh:0,all:0})} style={{ background:"rgba(255,68,68,0.15)", border:"1px solid rgba(255,68,68,0.3)", borderRadius:10, padding:"9px 22px", color:"#FF8888", fontSize:13, cursor:"pointer" }}>Reset All</div>
      <div style={{ display:"flex", gap:10, marginTop:20, width:"100%" }}>
        {Object.entries(keys).map(([k,v]) => (
          <div key={k} style={{ flex:1, background:"rgba(26,77,46,0.3)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:10, padding:"9px", textAlign:"center" }}>
            <div style={{ color:GOLD, fontSize:17, fontWeight:700 }}>{counts[k]}</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:9, lineHeight:1.3 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── QURAN PAGE ────────────────────────────────────────────────────────────────
// ─── QURAN PAGE ────────────────────────────────────────────────────────────────
function QuranPage() {
  return (
    <div style={{ padding:"20px 20px 80px" }}>
      <SectionTitle>📖 Holy Quran</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:24 }}>Read the complete Quran</div>

      <a href="/quran.pdf" target="_blank" rel="noreferrer" style={{ textDecoration:"none", display:"block" }}>
        <div style={{
          background:`linear-gradient(135deg,${MID_GREEN},#1A2E0A)`,
          border:`2px solid rgba(201,168,76,0.4)`,
          borderRadius:20, padding:"40px 20px", textAlign:"center", cursor:"pointer",
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)", marginBottom:16,
        }}>
          <div style={{ fontSize:64, marginBottom:14 }}>📖</div>
          <div style={{ color:LIGHT_GOLD, fontSize:22, fontWeight:700, fontFamily:"'Playfair Display',serif", marginBottom:8 }}>Al-Quran Al-Kareem</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:20 }}>Complete Quran PDF</div>
          <div style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, borderRadius:20, padding:"12px 32px", fontSize:15, fontWeight:700, display:"inline-block" }}>
            📖 Open Quran →
          </div>
        </div>
      </a>

      <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"16px", textAlign:"center" }}>
        <div style={{ fontSize:18, direction:"rtl", fontFamily:"serif", color:LIGHT_GOLD, marginBottom:8 }}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, fontStyle:"italic" }}>
          "In the name of Allah, the Most Gracious, the Most Merciful"
        </div>
      </div>
    </div>
  );
}


// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function MinbarLiveApp() {
  const [splash, setSplash]             = useState(true);
  const [page, setPage]               = useState("home");
  const [masjids, setMasjids]         = useState(MASJIDS_DEFAULT);
  const [adminTarget, setAdminTarget] = useState(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);
  const [showLogin, setShowLogin]     = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ── Notifications ──
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPerm, setNotifPerm]       = useState(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [currentNotif, setCurrentNotif] = useState(null);

  const handleInAppNotif = useCallback((n) => setCurrentNotif(n), []);
  usePrayerAlerts(masjids, notifEnabled, handleInAppNotif);

  const toggleNotifications = async () => {
    if (!notifEnabled) {
      const perm = await requestNotifPermission();
      setNotifPerm(perm);
      if (perm === "granted" || perm === "unsupported") setNotifEnabled(true);
    } else {
      setNotifEnabled(false);
    }
  };

  const navItems = [
    { id:"home",    icon:"🏠", label:"Home"    },
    { id:"live",    icon:"📡", label:"Live"    },
    { id:"library", icon:"🎧", label:"Library" },
    { id:"quran",   icon:"📖", label:"Quran"   },
    { id:"dua",     icon:"🤲", label:"Dua"     },
  ];

  const pages = { home:HomePage, live:LivePage, library:LibraryPage, quran:QuranPage, dua:DuaPage, tasbeeh:TasbeehPage };
  const CurrentPage = pages[page] || HomePage;

  // Admin button clicked — show masjid selector
  const [showMasjidSelect, setShowMasjidSelect] = useState(false);

  const handleAdminSelect = (masjid) => {
    setAdminTarget(masjid);
    setShowMasjidSelect(false);
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setLoggedInAdmin(adminTarget);
    setShowAdminPanel(true);
  };

  const handleAdminClose = () => {
    setShowAdminPanel(false);
    setLoggedInAdmin(null);
    setAdminTarget(null);
  };

  const handleUpdateMasjid = (id, updates) => {
    setMasjids(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <div style={{ maxWidth:390, margin:"0 auto", minHeight:"100vh", background:`linear-gradient(180deg,${DARK_GREEN} 0%,#050F08 100%)`, backgroundImage:arabicPattern, fontFamily:"'Lato',sans-serif", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cinzel:wght@400;600&family=Lato:wght@300;400;600;700&display=swap');
        @keyframes pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.5);opacity:0} }
        @keyframes spin   { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes splashIn   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes splashFade { from{opacity:1} to{opacity:0;pointer-events:none} }
        @keyframes wave   { from{transform:scaleY(0.5)} to{transform:scaleY(1.2)} }
        @keyframes slideDown { from{transform:translateX(-50%) translateY(-20px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; }
        input,button { font-family:'Lato',sans-serif; }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }
      `}</style>

      {/* Splash Screen */}
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      {/* In-app notification banner */}
      {currentNotif && <NotifBanner notif={currentNotif} onDismiss={() => setCurrentNotif(null)} />}

      {/* Status bar */}
      <div style={{ background:DARK_GREEN, padding:"10px 20px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>9:41</span>

        {/* NOTIFICATION BELL */}
        <button onClick={toggleNotifications} style={{
          background: notifEnabled ? "linear-gradient(135deg,#1A4D2E,#2E6B3A)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${notifEnabled ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)"}`,
          borderRadius:20, padding:"5px 12px", cursor:"pointer",
          display:"flex", alignItems:"center", gap:5,
          color: notifEnabled ? "#F0D080" : "rgba(255,255,255,0.35)", fontSize:11, fontWeight:700,
          title: notifPerm === "denied" ? "Notifications blocked in browser settings" : "",
        }}>
          {notifEnabled ? "🔔" : "🔕"} {notifEnabled ? "ON" : notifPerm === "denied" ? "BLOCKED" : "OFF"}
        </button>

        {/* ADMIN BUTTON */}
        <button onClick={() => setShowMasjidSelect(true)} style={{
          background:"linear-gradient(135deg,#6B0000,#CC1111)",
          border:"1px solid rgba(255,100,100,0.35)", borderRadius:20, padding:"5px 14px",
          color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer",
          boxShadow:"0 2px 12px rgba(255,68,68,0.25)",
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF4444", display:"inline-block", animation:"pulse 1.5s ease-in-out infinite" }} />
          🔐 ADMIN
        </button>

        <div style={{ display:"flex", gap:5, alignItems:"center", color:"rgba(255,255,255,0.35)", fontSize:12 }}>
          <span>📶</span><span>🔋</span>
        </div>
      </div>

      {/* Page */}
      <div style={{ overflowY:"auto", height:"calc(100vh - 114px)" }}>
        <CurrentPage setPage={setPage} masjids={masjids} />
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:390, background:`linear-gradient(to top,${DARK_GREEN},rgba(10,46,26,0.97))`, borderTop:"1px solid rgba(201,168,76,0.18)", display:"flex", padding:"8px 0 12px", backdropFilter:"blur(10px)" }}>
        {navItems.map(item => (
          <div key={item.id} onClick={() => setPage(item.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, cursor:"pointer", padding:"4px 0" }}>
            <div style={{ fontSize:21, filter:page===item.id?"none":"grayscale(0.5) opacity(0.5)", transform:page===item.id?"scale(1.15)":"scale(1)", transition:"all 0.2s" }}>{item.icon}</div>
            <span style={{ fontSize:9, fontWeight:600, letterSpacing:0.5, color:page===item.id?GOLD:"rgba(255,255,255,0.3)", transition:"color 0.2s" }}>{item.label}</span>
            {page===item.id && <div style={{ width:4, height:4, borderRadius:"50%", background:GOLD }} />}
          </div>
        ))}
      </div>

      {/* ── MASJID SELECTOR SHEET ── */}
      {showMasjidSelect && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:`linear-gradient(180deg,#0E2418,${DARK_GREEN})`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:390, padding:"24px 20px 44px" }}>
            <div style={{ width:40, height:4, background:"rgba(201,168,76,0.3)", borderRadius:2, margin:"0 auto 18px" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ color:LIGHT_GOLD, fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>🔐 Select Your Masjid</div>
              <div onClick={() => setShowMasjidSelect(false)} style={{ color:"rgba(255,255,255,0.4)", fontSize:22, cursor:"pointer" }}>✕</div>
            </div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginBottom:18, lineHeight:1.6 }}>
              Each masjid has its own admin password. Only the masjid admin can access their panel.
            </div>
            {masjids.map(m => (
              <div key={m.id} onClick={() => handleAdminSelect(m)} style={{
                background:`linear-gradient(135deg,${m.color},rgba(10,46,26,0.9))`,
                border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"14px 16px",
                display:"flex", alignItems:"center", gap:14, cursor:"pointer", marginBottom:10,
              }}>
                <span style={{ fontSize:28 }}>{m.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:OFF_WHITE, fontWeight:700, fontSize:15 }}>{m.name}</div>
                  <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Tap to login as admin</div>
                </div>
                <div style={{ color:GOLD, fontSize:18 }}>🔒</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PASSWORD LOGIN ── */}
      {showLogin && adminTarget && (
        <PasswordLogin
          masjid={adminTarget}
          onSuccess={handleLoginSuccess}
          onCancel={() => { setShowLogin(false); setAdminTarget(null); }}
        />
      )}

      {/* ── ADMIN PANEL ── */}
      {showAdminPanel && loggedInAdmin && (
        <AdminPanel
          masjid={loggedInAdmin}
          onClose={handleAdminClose}
          onUpdateMasjid={handleUpdateMasjid}
        />
      )}
    </div>
  );
}
