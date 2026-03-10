import { useState, useEffect, useRef, useCallback } from "react";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAq_nm6YX_5d7DMOqmEmQ8MgKsXLoqKeKY",
  authDomain: "minbar-live.firebaseapp.com",
  projectId: "minbar-live",
  storageBucket: "minbar-live.firebasestorage.app",
  messagingSenderId: "645939734747",
  appId: "1:645939734747:web:daf3aae436ce0f5c3884fe",
  measurementId: "G-QEY8E2RP3M"
};
const VAPID_KEY = "BPB3XM_3GWOduj16rr4KtiDwZp3SWxilvT-TYTa4WVgX-b0r9oAC5TXn_ONURnSbqO5Fy9RBuyUm7RDB380hy7A";

// ─── FCM HELPERS ──────────────────────────────────────────────────────────────
function loadFirebaseScripts() {
  return new Promise((resolve) => {
    if (window.firebase && window.firebase.messaging) { resolve(); return; }
    const s1 = document.createElement("script");
    s1.src = "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js";
    s1.onload = () => {
      const s2 = document.createElement("script");
      s2.src = "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js";
      s2.onload = () => {
        if (!window.firebase.apps.length) window.firebase.initializeApp(FIREBASE_CONFIG);
        resolve();
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  });
}

async function getFCMToken() {
  try {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
    await loadFirebaseScripts();
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
    const messaging = window.firebase.messaging();
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const reg = await navigator.serviceWorker.ready;
    const token = await messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    const tokens = JSON.parse(localStorage.getItem("minbar_fcm_tokens") || "[]");
    if (!tokens.includes(token)) { tokens.push(token); localStorage.setItem("minbar_fcm_tokens", JSON.stringify(tokens)); }
    localStorage.setItem("minbar_fcm_token", token);
    return token;
  } catch(e) { console.log("FCM token error:", e); return null; }
}

async function sendLiveNotification(masjidName, bayanTitle) {
  try {
    // Get all subscriber tokens from localStorage
    const tokens = JSON.parse(localStorage.getItem("minbar_fcm_tokens") || "[]");
    if (tokens.length === 0) return;
    // Send via Firebase Cloud Messaging HTTP v1 API
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "key=645939734747"
      },
      body: JSON.stringify({
        registration_ids: tokens,
        notification: {
          title: "🔴 " + masjidName + " is LIVE!",
          body: bayanTitle || "Live stream has started. Tap to watch!",
          icon: "/logo192.png",
          click_action: "https://islamic-live-app.vercel.app"
        },
        data: {
          masjid: masjidName,
          url: "https://islamic-live-app.vercel.app"
        }
      })
    });
    console.log("Notification sent!", await response.json());
  } catch(e) { console.log("Send notif error:", e); }
}


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
function playAdhanSound() {
  try {
    // Play real adhan from online source
    const audio = new Audio("https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3");
    audio.volume = 1.0;
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.play().catch(() => {
      // Fallback to beep if audio fails
      playAdhanBeep();
    });
  } catch (_) { playAdhanBeep(); }
}

function playAdhanBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.4, 0.8, 1.2, 1.6].forEach(t => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + t + 0.35);
      gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.38);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.4);
    });
  } catch (_) {}
}

function playIqamahBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Deep low beep — 3 times
    [0, 0.5, 1.0].forEach(t => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.6, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.45);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.5);
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
          // Jumu'ah only fires on Friday (day 5)
          if (prayer === "jumuah" && new Date().getDay() !== 5) return;
          const ak = `${today}-${m.id}-${prayer}-adhan`;
          if (times.adhan === hhmm && !fired.current.has(ak)) {
            fired.current.add(ak);
            playAdhanSound();
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
    youtubeUrl: "",
    youtubeChannel: "https://www.youtube.com/@JummaMasjid-z7o",
    permanentLiveUrl: "https://www.youtube.com/@JummaMasjid-z7o/live",
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
    youtubeChannel: "",
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
    youtubeChannel: "https://www.youtube.com/@Masjid-e-Muhammadi-o4t",
    permanentLiveUrl: "https://www.youtube.com/@Masjid-e-Muhammadi-o4t/live",
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
    youtubeChannel: "",
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

function SectionTitle({ children, style={} }) {
  return <div style={{ color: LIGHT_GOLD, fontSize: 20, fontWeight: 700, fontFamily: "'Playfair Display',serif", marginBottom: 4, ...style }}>{children}</div>;
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

  const goLive = (overrideUrl) => {
    const finalUrl = overrideUrl || ytUrl.trim();
    if (!finalUrl) return;
    if (overrideUrl) setYtUrl(overrideUrl);
    onUpdateMasjid(masjid.id, { youtubeUrl: finalUrl, isLive: true, topic, speaker });
    setUrlSaved(true); setTimeout(() => setUrlSaved(false), 2000);
    // Send push notification to all subscribers
    sendLiveNotification(masjid.name, topic || "Live stream has started!");
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

        <div style={{ overflowY:"auto", flex:1, padding:"0 20px 40px", WebkitOverflowScrolling:"touch" }}>

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
                  1. Open <span style={{ color:GOLD }}>YouTube Studio</span> app{"\n"}
                  2. Tap Go Live 🔴 on YouTube{"\n"}
                  3. Come back here → Enter bayan title{"\n"}
                  4. Tap <span style={{ color:GOLD }}>Go Live</span> — Done! ✅
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

              {/* Auto Live URL Info */}
              {masjid.permanentLiveUrl ? (
                <div style={{ background:"rgba(26,201,76,0.08)", border:"1px solid rgba(26,201,76,0.25)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
                  <div style={{ color:"#99FFB3", fontWeight:700, fontSize:12, marginBottom:4 }}>✅ AUTO LIVE URL SAVED</div>
                  <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:8 }}>No copy-paste needed! App will use your channel live URL automatically:</div>
                  <div style={{ color:GOLD, fontSize:11, wordBreak:"break-all" }}>{masjid.permanentLiveUrl}</div>
                </div>
              ) : (
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
              )}

              {!isLive ? (
                <button onClick={() => {
                  if (masjid.permanentLiveUrl) {
                    setYtUrl(masjid.permanentLiveUrl);
                    goLive(masjid.permanentLiveUrl);
                  } else {
                    goLive();
                  }
                }} disabled={!masjid.permanentLiveUrl && !ytUrl.trim()} style={{
                  width:"100%", padding:"15px",
                  background: (masjid.permanentLiveUrl || ytUrl.trim()) ? "linear-gradient(135deg,#AA1111,#EE3333)" : "rgba(255,68,68,0.2)",
                  border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700,
                  cursor: (masjid.permanentLiveUrl || ytUrl.trim()) ? "pointer" : "not-allowed",
                  boxShadow: (masjid.permanentLiveUrl || ytUrl.trim()) ? "0 4px 20px rgba(255,68,68,0.35)" : "none",
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
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:14, textAlign:"center", lineHeight:1.7, marginBottom:24 }}>
            No live stream right now.<br/>
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>Admin will start a YouTube Live session soon.</span>
          </div>
          {masjid.youtubeChannel ? (
            <div onClick={() => window.open(masjid.youtubeChannel,"_blank")} style={{ background:"linear-gradient(135deg,#CC0000,#FF0000)", color:"#fff", borderRadius:20, padding:"14px 32px", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
              ▶ Watch on YouTube
            </div>
          ) : null}
          <div style={{ background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:12, padding:"12px 20px", color:"rgba(255,255,255,0.4)", fontSize:12, textAlign:"center" }}>
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
  // Find next prayer based on current time
  const now = new Date();
  const isFriday = now.getDay() === 5; // 5 = Friday
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const toMins = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };

  // On Friday: replace Dhuhr with Jumu'ah
  const prayers = [
    { key:"fajr",    name:"Fajr",    icon:"🌙" },
    isFriday
      ? { key:"jumuah", name:"Jumu'ah", icon:"🕌" }
      : { key:"dhuhr",  name:"Dhuhr",   icon:"☀️" },
    { key:"asr",     name:"Asr",     icon:"🌤"  },
    { key:"maghrib", name:"Maghrib", icon:"🌅" },
    { key:"isha",    name:"Isha",    icon:"⭐" },
  ];

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

      {/* Push Notification Banner */}
      {typeof Notification !== "undefined" && Notification.permission === "default" && (
        <div style={{ margin:"14px 20px 0", background:"rgba(26,77,46,0.6)", border:"1px solid rgba(201,168,76,0.35)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>🔔</span>
          <div style={{ flex:1 }}>
            <div style={{ color:GOLD, fontSize:11, fontWeight:700 }}>Enable Live Notifications!</div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:10 }}>Get notified when Masjid goes LIVE</div>
          </div>
          <button onClick={() => getFCMToken().then(t => { if(t) alert("Notifications enabled! You will be notified when Masjid goes live!"); })} style={{ background:"linear-gradient(135deg,#C9A84C,#E8C97A)", border:"none", borderRadius:8, padding:"6px 10px", color:"#1A4D2E", fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            Enable 🔔
          </button>
        </div>
      )}
      {typeof Notification !== "undefined" && Notification.permission === "granted" && (
        <div style={{ margin:"14px 20px 0", background:"rgba(26,201,76,0.08)", border:"1px solid rgba(26,201,76,0.2)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:16 }}>🔔</span>
          <div style={{ color:"#99FFB3", fontSize:11 }}>Live notifications enabled! ✅</div>
        </div>
      )}
      {/* Tip Banner */}
      <div style={{ margin:"10px 20px 0", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>💡</span>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, lineHeight:1.6 }}>
          Keep this app <span style={{ color:GOLD, fontWeight:700 }}>open in background</span> to receive adhan sound &amp; notifications!
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
            { icon:"🧭", label:"Qibla",   color:"#3D2A5C", page:"qibla"   },
            { icon:"📿", label:"Tasbeeh", color:"#4D2A5C", page:"tasbeeh" },
            { icon:"💬", label:"Ask",     color:"#5C3D1A", page:"chat"    },
            { icon:"📡", label:"Live",    color:"#5C1A1A", page:"live"    },
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
// ─── PWA INSTALL PROMPT ────────────────────────────────────────────────────────
function useInstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  useEffect(() => {
    const handler = e => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };
  return { prompt, install };
}


function AddMasjidModal({ onAdd, onClose }) {
  const [step, setStep]         = useState("password"); // password | form
  const [pw, setPw]             = useState("");
  const [pwErr, setPwErr]       = useState("");
  const [name, setName]         = useState("");
  const [icon, setIcon]         = useState("🕌");
  const [color, setColor]       = useState("#1A4D2E");
  const [password, setPassword] = useState("");
  const [ytChannel, setYtChannel] = useState("");
  const ICONS = ["🕌","🕍","☪️","🌙","⭐","🤲","🕋","📿"];
  const COLORS = ["#1A4D2E","#1A2E4D","#2E1A4D","#4D2E1A","#2E4D1A","#4D1A2E","#1A4D4D","#4D3D1A"];

  const checkPw = () => {
    if (pw.trim() === "minbarlive") { setStep("form"); setPwErr(""); }
    else setPwErr("❌ Wrong master password!");
  };

  const handleAdd = () => {
    if (!name.trim()) return alert("Please enter masjid name!");
    if (!password.trim()) return alert("Please enter admin password!");
    const newMasjid = {
      id: "m" + Date.now(),
      name: name.trim(),
      icon, color,
      password: password.trim(),
      youtubeUrl: "",
      youtubeChannel: ytChannel.trim(),
      isLive: false,
      prayerTimes: {
        fajr:    { adhan:"05:15", iqamah:"05:30" },
        dhuhr:   { adhan:"13:15", iqamah:"13:30" },
        asr:     { adhan:"16:30", iqamah:"16:45" },
        maghrib: { adhan:"18:35", iqamah:"18:40" },
        isha:    { adhan:"19:55", iqamah:"20:10" },
        jumuah:  { adhan:"13:00", iqamah:"13:15" },
      },
      recordings: [],
    };
    onAdd(newMasjid);
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:`linear-gradient(180deg,#0E2418,${DARK_GREEN})`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:"24px 24px 0 0", width:"100%", maxWidth:390, padding:"24px 20px 44px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, background:"rgba(201,168,76,0.3)", borderRadius:2, margin:"0 auto 18px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ color:LIGHT_GOLD, fontSize:18, fontWeight:700, fontFamily:"'Playfair Display',serif" }}>➕ Add New Masjid</div>
          <div onClick={onClose} style={{ color:"rgba(255,255,255,0.4)", fontSize:22, cursor:"pointer" }}>✕</div>
        </div>

        {step === "password" ? (
          <>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:13, marginBottom:16 }}>Enter master password to add a new masjid</div>
            <input
              type="password"
              placeholder="Master password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkPw()}
              style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, marginBottom:8, outline:"none" }}
            />
            {pwErr && <div style={{ color:"#FF7777", fontSize:13, marginBottom:12 }}>{pwErr}</div>}
            <button onClick={checkPw} style={{ width:"100%", background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, border:"none", borderRadius:14, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              Continue →
            </button>
          </>
        ) : (
          <>
            {/* Icon picker */}
            <div style={{ color:GOLD, fontSize:11, letterSpacing:1, marginBottom:8 }}>SELECT ICON</div>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {ICONS.map(ic => (
                <div key={ic} onClick={() => setIcon(ic)} style={{ fontSize:24, padding:8, borderRadius:10, background:icon===ic?"rgba(201,168,76,0.25)":"rgba(255,255,255,0.05)", border:`1px solid ${icon===ic?"rgba(201,168,76,0.5)":"transparent"}`, cursor:"pointer" }}>{ic}</div>
              ))}
            </div>

            {/* Color picker */}
            <div style={{ color:GOLD, fontSize:11, letterSpacing:1, marginBottom:8 }}>SELECT COLOR</div>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width:32, height:32, borderRadius:8, background:c, border:`2px solid ${color===c?"#F0D080":"transparent"}`, cursor:"pointer" }} />
              ))}
            </div>

            {/* Fields */}
            {[
              { label:"MASJID NAME", val:name, set:setName, ph:"e.g. Masjid-e-Noor", type:"text" },
              { label:"ADMIN PASSWORD", val:password, set:setPassword, ph:"e.g. noor123", type:"text" },
              { label:"YOUTUBE CHANNEL (optional)", val:ytChannel, set:setYtChannel, ph:"https://www.youtube.com/@YourChannel", type:"text" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:14 }}>
                <div style={{ color:GOLD, fontSize:11, letterSpacing:1, marginBottom:6 }}>{f.label}</div>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"13px 16px", color:"#fff", fontSize:14, outline:"none" }}
                />
              </div>
            ))}

            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12, marginBottom:16 }}>
              💡 Prayer times will be set to default — admin can change them in Settings after adding.
            </div>

            <button onClick={handleAdd} style={{ width:"100%", background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, border:"none", borderRadius:14, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              ✅ Add Masjid
            </button>
          </>
        )}
      </div>
    </div>
  );
}




// ─── QURAN PAGE ────────────────────────────────────────────────────────────────
const SURAHS = [
  {n:1,name:"Al-Fatiha",arabic:"الفاتحة",ayahs:7},{n:2,name:"Al-Baqarah",arabic:"البقرة",ayahs:286},
  {n:3,name:"Al-Imran",arabic:"آل عمران",ayahs:200},{n:4,name:"An-Nisa",arabic:"النساء",ayahs:176},
  {n:5,name:"Al-Maidah",arabic:"المائدة",ayahs:120},{n:6,name:"Al-An'am",arabic:"الأنعام",ayahs:165},
  {n:7,name:"Al-A'raf",arabic:"الأعراف",ayahs:206},{n:8,name:"Al-Anfal",arabic:"الأنفال",ayahs:75},
  {n:9,name:"At-Tawbah",arabic:"التوبة",ayahs:129},{n:10,name:"Yunus",arabic:"يونس",ayahs:109},
  {n:11,name:"Hud",arabic:"هود",ayahs:123},{n:12,name:"Yusuf",arabic:"يوسف",ayahs:111},
  {n:13,name:"Ar-Ra'd",arabic:"الرعد",ayahs:43},{n:14,name:"Ibrahim",arabic:"إبراهيم",ayahs:52},
  {n:15,name:"Al-Hijr",arabic:"الحجر",ayahs:99},{n:16,name:"An-Nahl",arabic:"النحل",ayahs:128},
  {n:17,name:"Al-Isra",arabic:"الإسراء",ayahs:111},{n:18,name:"Al-Kahf",arabic:"الكهف",ayahs:110},
  {n:19,name:"Maryam",arabic:"مريم",ayahs:98},{n:20,name:"Ta-Ha",arabic:"طه",ayahs:135},
  {n:21,name:"Al-Anbiya",arabic:"الأنبياء",ayahs:112},{n:22,name:"Al-Hajj",arabic:"الحج",ayahs:78},
  {n:23,name:"Al-Mu'minun",arabic:"المؤمنون",ayahs:118},{n:24,name:"An-Nur",arabic:"النور",ayahs:64},
  {n:25,name:"Al-Furqan",arabic:"الفرقان",ayahs:77},{n:26,name:"Ash-Shu'ara",arabic:"الشعراء",ayahs:227},
  {n:27,name:"An-Naml",arabic:"النمل",ayahs:93},{n:28,name:"Al-Qasas",arabic:"القصص",ayahs:88},
  {n:29,name:"Al-Ankabut",arabic:"العنكبوت",ayahs:69},{n:30,name:"Ar-Rum",arabic:"الروم",ayahs:60},
  {n:31,name:"Luqman",arabic:"لقمان",ayahs:34},{n:32,name:"As-Sajdah",arabic:"السجدة",ayahs:30},
  {n:33,name:"Al-Ahzab",arabic:"الأحزاب",ayahs:73},{n:34,name:"Saba",arabic:"سبأ",ayahs:54},
  {n:35,name:"Fatir",arabic:"فاطر",ayahs:45},{n:36,name:"Ya-Sin",arabic:"يس",ayahs:83},
  {n:37,name:"As-Saffat",arabic:"الصافات",ayahs:182},{n:38,name:"Sad",arabic:"ص",ayahs:88},
  {n:39,name:"Az-Zumar",arabic:"الزمر",ayahs:75},{n:40,name:"Ghafir",arabic:"غافر",ayahs:85},
  {n:41,name:"Fussilat",arabic:"فصلت",ayahs:54},{n:42,name:"Ash-Shura",arabic:"الشورى",ayahs:53},
  {n:43,name:"Az-Zukhruf",arabic:"الزخرف",ayahs:89},{n:44,name:"Ad-Dukhan",arabic:"الدخان",ayahs:59},
  {n:45,name:"Al-Jathiyah",arabic:"الجاثية",ayahs:37},{n:46,name:"Al-Ahqaf",arabic:"الأحقاف",ayahs:35},
  {n:47,name:"Muhammad",arabic:"محمد",ayahs:38},{n:48,name:"Al-Fath",arabic:"الفتح",ayahs:29},
  {n:49,name:"Al-Hujurat",arabic:"الحجرات",ayahs:18},{n:50,name:"Qaf",arabic:"ق",ayahs:45},
  {n:51,name:"Adh-Dhariyat",arabic:"الذاريات",ayahs:60},{n:52,name:"At-Tur",arabic:"الطور",ayahs:49},
  {n:53,name:"An-Najm",arabic:"النجم",ayahs:62},{n:54,name:"Al-Qamar",arabic:"القمر",ayahs:55},
  {n:55,name:"Ar-Rahman",arabic:"الرحمن",ayahs:78},{n:56,name:"Al-Waqi'ah",arabic:"الواقعة",ayahs:96},
  {n:57,name:"Al-Hadid",arabic:"الحديد",ayahs:29},{n:58,name:"Al-Mujadila",arabic:"المجادلة",ayahs:22},
  {n:59,name:"Al-Hashr",arabic:"الحشر",ayahs:24},{n:60,name:"Al-Mumtahanah",arabic:"الممتحنة",ayahs:13},
  {n:61,name:"As-Saf",arabic:"الصف",ayahs:14},{n:62,name:"Al-Jumu'ah",arabic:"الجمعة",ayahs:11},
  {n:63,name:"Al-Munafiqun",arabic:"المنافقون",ayahs:11},{n:64,name:"At-Taghabun",arabic:"التغابن",ayahs:18},
  {n:65,name:"At-Talaq",arabic:"الطلاق",ayahs:12},{n:66,name:"At-Tahrim",arabic:"التحريم",ayahs:12},
  {n:67,name:"Al-Mulk",arabic:"الملك",ayahs:30},{n:68,name:"Al-Qalam",arabic:"القلم",ayahs:52},
  {n:69,name:"Al-Haqqah",arabic:"الحاقة",ayahs:52},{n:70,name:"Al-Ma'arij",arabic:"المعارج",ayahs:44},
  {n:71,name:"Nuh",arabic:"نوح",ayahs:28},{n:72,name:"Al-Jinn",arabic:"الجن",ayahs:28},
  {n:73,name:"Al-Muzzammil",arabic:"المزمل",ayahs:20},{n:74,name:"Al-Muddaththir",arabic:"المدثر",ayahs:56},
  {n:75,name:"Al-Qiyamah",arabic:"القيامة",ayahs:40},{n:76,name:"Al-Insan",arabic:"الإنسان",ayahs:31},
  {n:77,name:"Al-Mursalat",arabic:"المرسلات",ayahs:50},{n:78,name:"An-Naba",arabic:"النبأ",ayahs:40},
  {n:79,name:"An-Nazi'at",arabic:"النازعات",ayahs:46},{n:80,name:"Abasa",arabic:"عبس",ayahs:42},
  {n:81,name:"At-Takwir",arabic:"التكوير",ayahs:29},{n:82,name:"Al-Infitar",arabic:"الانفطار",ayahs:19},
  {n:83,name:"Al-Mutaffifin",arabic:"المطففين",ayahs:36},{n:84,name:"Al-Inshiqaq",arabic:"الانشقاق",ayahs:25},
  {n:85,name:"Al-Buruj",arabic:"البروج",ayahs:22},{n:86,name:"At-Tariq",arabic:"الطارق",ayahs:17},
  {n:87,name:"Al-A'la",arabic:"الأعلى",ayahs:19},{n:88,name:"Al-Ghashiyah",arabic:"الغاشية",ayahs:26},
  {n:89,name:"Al-Fajr",arabic:"الفجر",ayahs:30},{n:90,name:"Al-Balad",arabic:"البلد",ayahs:20},
  {n:91,name:"Ash-Shams",arabic:"الشمس",ayahs:15},{n:92,name:"Al-Layl",arabic:"الليل",ayahs:21},
  {n:93,name:"Ad-Duha",arabic:"الضحى",ayahs:11},{n:94,name:"Ash-Sharh",arabic:"الشرح",ayahs:8},
  {n:95,name:"At-Tin",arabic:"التين",ayahs:8},{n:96,name:"Al-Alaq",arabic:"العلق",ayahs:19},
  {n:97,name:"Al-Qadr",arabic:"القدر",ayahs:5},{n:98,name:"Al-Bayyinah",arabic:"البينة",ayahs:8},
  {n:99,name:"Az-Zalzalah",arabic:"الزلزلة",ayahs:8},{n:100,name:"Al-Adiyat",arabic:"العاديات",ayahs:11},
  {n:101,name:"Al-Qari'ah",arabic:"القارعة",ayahs:11},{n:102,name:"At-Takathur",arabic:"التكاثر",ayahs:8},
  {n:103,name:"Al-Asr",arabic:"العصر",ayahs:3},{n:104,name:"Al-Humazah",arabic:"الهمزة",ayahs:9},
  {n:105,name:"Al-Fil",arabic:"الفيل",ayahs:5},{n:106,name:"Quraysh",arabic:"قريش",ayahs:4},
  {n:107,name:"Al-Ma'un",arabic:"الماعون",ayahs:7},{n:108,name:"Al-Kawthar",arabic:"الكوثر",ayahs:3},
  {n:109,name:"Al-Kafirun",arabic:"الكافرون",ayahs:6},{n:110,name:"An-Nasr",arabic:"النصر",ayahs:3},
  {n:111,name:"Al-Masad",arabic:"المسد",ayahs:5},{n:112,name:"Al-Ikhlas",arabic:"الإخلاص",ayahs:4},
  {n:113,name:"Al-Falaq",arabic:"الفلق",ayahs:5},{n:114,name:"An-Nas",arabic:"الناس",ayahs:6},
];

function QuranReader({ surah, onBack }) {
  const [ayahs, setAyahs]                     = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [playingAyah, setPlayingAyah]         = useState(null);
  const [playingAll, setPlayingAll]           = useState(false);
  const [audio, setAudio]                     = useState(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [viewMode, setViewMode]               = useState("ayah"); // "ayah" or "full"
  const [isBookmarked, setIsBookmarked]       = useState(false);
  const [currentAyahIdx, setCurrentAyahIdx]   = useState(0);

  // Load bookmark state
  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("minbar_bookmarks") || "[]");
      setIsBookmarked(bookmarks.includes(surah.n));
    } catch(_) {}
  }, [surah.n]);

  // Toggle bookmark
  const toggleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("minbar_bookmarks") || "[]");
      let updated;
      if (isBookmarked) {
        updated = bookmarks.filter(n => n !== surah.n);
      } else {
        updated = [...bookmarks, surah.n];
      }
      localStorage.setItem("minbar_bookmarks", JSON.stringify(updated));
      setIsBookmarked(!isBookmarked);
    } catch(_) {}
  };

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.alquran.cloud/v1/surah/${surah.n}/editions/quran-uthmani,en.asad`)
      .then(r => r.json())
      .then(data => {
        const arabic = data.data[0].ayahs;
        const english = data.data[1].ayahs;
        setAyahs(arabic.map((a, i) => ({
          number: a.numberInSurah,
          arabic: a.text,
          translation: english[i].text,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [surah.n]);

  const stopAudio = () => {
    if (audio) { audio.pause(); audio.src = ""; setAudio(null); }
    setPlayingAyah(null);
    setPlayingAll(false);
  };

  const playAudio = (ayahNum) => {
    stopAudio();
    if (playingAyah === ayahNum) return;
    const offset = SURAHS.slice(0, surah.n-1).reduce((a,s) => a+s.ayahs, 0);
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${offset + ayahNum}.mp3`;
    const a = new Audio(url);
    a.play();
    a.onended = () => setPlayingAyah(null);
    setAudio(a);
    setPlayingAyah(ayahNum);
  };

  // Play full surah ayah by ayah automatically
  const playFullSurah = (idx = 0) => {
    if (idx >= ayahs.length) { setPlayingAll(false); setPlayingAyah(null); return; }
    setPlayingAll(true);
    setCurrentAyahIdx(idx);
    const ayahNum = ayahs[idx].number;
    if (audio) { audio.pause(); audio.src = ""; }
    const offset = SURAHS.slice(0, surah.n-1).reduce((a,s) => a+s.ayahs, 0);
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${offset + ayahNum}.mp3`;
    const a = new Audio(url);
    a.play();
    a.onended = () => playFullSurah(idx + 1);
    setAudio(a);
    setPlayingAyah(ayahNum);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", position:"fixed", inset:0, zIndex:500, background:DARK_GREEN }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${MID_GREEN})`, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <button onClick={() => { stopAudio(); onBack(); }} style={{ background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"7px 12px", color:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:14, fontFamily:"'Playfair Display',serif" }}>{surah.name}</div>
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10 }}>{surah.arabic} • {surah.ayahs} Ayahs</div>
        </div>
        {/* Bookmark */}
        <div onClick={toggleBookmark} style={{ fontSize:20, cursor:"pointer", padding:"4px 6px" }}>
          {isBookmarked ? "🔖" : "📄"}
        </div>
        {/* Translation toggle */}
        <div onClick={() => setShowTranslation(!showTranslation)} style={{ background:showTranslation?"rgba(201,168,76,0.2)":"rgba(255,255,255,0.05)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"6px 8px", color:GOLD, fontSize:11, fontWeight:700, cursor:"pointer" }}>
          🌍
        </div>
      </div>

      {/* View Mode + Audio Controls */}
      <div style={{ background:"rgba(0,0,0,0.3)", padding:"8px 16px", display:"flex", gap:8, alignItems:"center", flexShrink:0 }}>
        {/* View mode tabs */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:10, padding:3, flex:1 }}>
          <div onClick={() => setViewMode("ayah")} style={{ flex:1, textAlign:"center", padding:"6px", borderRadius:8, background:viewMode==="ayah"?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"transparent", color:viewMode==="ayah"?DARK_GREEN:GOLD, fontSize:11, fontWeight:700, cursor:"pointer" }}>
            📖 Ayah by Ayah
          </div>
          <div onClick={() => setViewMode("full")} style={{ flex:1, textAlign:"center", padding:"6px", borderRadius:8, background:viewMode==="full"?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"transparent", color:viewMode==="full"?DARK_GREEN:GOLD, fontSize:11, fontWeight:700, cursor:"pointer" }}>
            📜 Full Surah
          </div>
        </div>
        {/* Play full surah button */}
        <div onClick={() => playingAll ? stopAudio() : playFullSurah(0)} style={{ background:playingAll?"rgba(255,68,68,0.2)":"rgba(201,168,76,0.15)", border:`1px solid ${playingAll?"rgba(255,68,68,0.5)":"rgba(201,168,76,0.3)"}`, borderRadius:10, padding:"6px 10px", color:playingAll?"#FF9999":GOLD, fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
          {playingAll ? "⏹ Stop" : "▶ Play All"}
        </div>
      </div>

      {/* Bismillah */}
      {surah.n !== 9 && (
        <div style={{ background:"rgba(201,168,76,0.08)", padding:"12px 20px", textAlign:"center", borderBottom:"1px solid rgba(201,168,76,0.1)", flexShrink:0 }}>
          <div style={{ color:LIGHT_GOLD, fontSize:18, fontFamily:"serif", direction:"rtl" }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 80px", WebkitOverflowScrolling:"touch" }}>
        {loading ? (
          <div style={{ textAlign:"center", color:GOLD, padding:40, fontSize:14 }}>Loading Surah {surah.name}...</div>
        ) : viewMode === "full" ? (
          // ── FULL SURAH VIEW ──
          <div>
            <div style={{ color:LIGHT_GOLD, fontSize:24, lineHeight:2.2, textAlign:"right", direction:"rtl", fontFamily:"serif", marginBottom:16 }}>
              {ayahs.map(ayah => (
                <span key={ayah.number}>
                  {ayah.arabic}
                  <span style={{ color:GOLD, fontSize:16, fontFamily:"serif" }}> ﴿{ayah.number}﴾ </span>
                </span>
              ))}
            </div>
            {showTranslation && (
              <div style={{ borderTop:"1px solid rgba(201,168,76,0.15)", paddingTop:16 }}>
                {ayahs.map(ayah => (
                  <div key={ayah.number} style={{ marginBottom:12, paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:GOLD, fontSize:11, fontWeight:700 }}>[{ayah.number}] </span>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12, lineHeight:1.7, fontStyle:"italic" }}>{ayah.translation}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // ── AYAH BY AYAH VIEW ──
          ayahs.map(ayah => (
            <div key={ayah.number} style={{ background:playingAyah===ayah.number?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${playingAyah===ayah.number?"rgba(201,168,76,0.4)":"rgba(201,168,76,0.1)"}`, borderRadius:14, padding:"16px", marginBottom:10, transition:"all 0.3s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:GOLD, fontSize:10, fontWeight:700 }}>{ayah.number}</div>
                <div onClick={() => playAudio(ayah.number)} style={{ background:playingAyah===ayah.number?"rgba(201,168,76,0.3)":"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:20, padding:"5px 12px", color:GOLD, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                  {playingAyah===ayah.number ? "⏸ Stop" : "▶ Play"}
                </div>
              </div>
              <div style={{ color:LIGHT_GOLD, fontSize:22, lineHeight:1.9, textAlign:"right", direction:"rtl", fontFamily:"serif", marginBottom:showTranslation?10:0 }}>
                {ayah.arabic}
              </div>
              {showTranslation && (
                <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, lineHeight:1.7, fontStyle:"italic", borderTop:"1px solid rgba(201,168,76,0.1)", paddingTop:8 }}>
                  {ayah.translation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Now Playing bar */}
      {playingAll && (
        <div style={{ background:`linear-gradient(135deg,${MID_GREEN},${DARK_GREEN})`, borderTop:`1px solid rgba(201,168,76,0.3)`, padding:"10px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#FF4444", animation:"pulse 1s infinite" }} />
          <div style={{ flex:1, color:LIGHT_GOLD, fontSize:12 }}>Playing Ayah {playingAyah} of {surah.name}</div>
          <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>{currentAyahIdx + 1}/{ayahs.length}</div>
          <div onClick={stopAudio} style={{ color:"#FF9999", fontSize:12, cursor:"pointer", fontWeight:700 }}>⏹ Stop</div>
        </div>
      )}
    </div>
  );
}

function QuranPage() {
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [search, setSearch]               = useState("");
  const [tab, setTab]                     = useState("all"); // "all" or "bookmarks"
  const [bookmarks, setBookmarks]         = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("minbar_bookmarks") || "[]");
      setBookmarks(saved);
    } catch(_) {}
  }, [selectedSurah]); // refresh when coming back from reader

  if (selectedSurah) return <QuranReader surah={selectedSurah} onBack={() => setSelectedSurah(null)} />;

  const filtered = SURAHS.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.arabic.includes(search) ||
    String(s.n).includes(search)
  );

  const bookmarkedSurahs = SURAHS.filter(s => bookmarks.includes(s.n));

  const SurahCard = ({ s }) => (
    <div key={s.n} onClick={() => setSelectedSurah(s)} style={{ background:`linear-gradient(135deg,rgba(26,77,46,0.4),rgba(10,46,26,0.6))`, border:"1px solid rgba(201,168,76,0.15)", borderRadius:13, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", marginBottom:8 }}>
      <div style={{ width:36, height:36, borderRadius:10, background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"center", color:GOLD, fontSize:11, fontWeight:700, flexShrink:0 }}>{s.n}</div>
      <div style={{ flex:1 }}>
        <div style={{ color:OFF_WHITE, fontWeight:700, fontSize:14 }}>{s.name}</div>
        <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>{s.ayahs} Ayahs</div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {bookmarks.includes(s.n) && <span style={{ fontSize:14 }}>🔖</span>}
        <div style={{ color:LIGHT_GOLD, fontSize:16, fontFamily:"serif" }}>{s.arabic}</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"20px 20px 80px" }}>
      <SectionTitle>📖 Holy Quran</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:16 }}>114 Surahs • Arabic + Translation + Audio</div>

      {/* Bismillah */}
      <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"14px 16px", textAlign:"center", marginBottom:16 }}>
        <div style={{ fontSize:16, direction:"rtl", fontFamily:"serif", color:LIGHT_GOLD, marginBottom:4 }}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, fontStyle:"italic" }}>In the name of Allah, the Most Gracious, the Most Merciful</div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:12, padding:4, marginBottom:16, gap:4 }}>
        <div onClick={() => setTab("all")} style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, background:tab==="all"?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"transparent", color:tab==="all"?DARK_GREEN:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>
          📖 All Surahs
        </div>
        <div onClick={() => setTab("bookmarks")} style={{ flex:1, textAlign:"center", padding:"8px", borderRadius:10, background:tab==="bookmarks"?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"transparent", color:tab==="bookmarks"?DARK_GREEN:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>
          🔖 Saved ({bookmarkedSurahs.length})
        </div>
      </div>

      {tab === "bookmarks" ? (
        bookmarkedSurahs.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔖</div>
            <div style={{ color:GOLD, fontWeight:700, fontSize:15, marginBottom:8 }}>No Saved Surahs Yet</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Open any Surah and tap 🔖 to save it here!</div>
          </div>
        ) : (
          bookmarkedSurahs.map(s => <SurahCard key={s.n} s={s} />)
        )
      ) : (
        <>
          {/* Search */}
          <input
            placeholder="🔍 Search surah..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", marginBottom:16, boxSizing:"border-box" }}
          />
          {filtered.map(s => <SurahCard key={s.n} s={s} />)}
        </>
      )}
    </div>
  );
}

// ─── DUA PAGE ──────────────────────────────────────────────────────────────────
function DuaPage() {
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedDua, setSelectedDua] = useState(null);
  const [playingDua, setPlayingDua]   = useState(null);
  const [audio, setAudio]             = useState(null);

  const DUAS = {
    morning: {
      icon:"🌅", name:"Morning Duas", color:"#1A4D2E",
      duas: [
        { id:1, title:"Waking Up", arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", translation:"All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.", ref:"Bukhari" },
        { id:2, title:"After Waking Up", arabic:"لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", translation:"None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.", ref:"Bukhari" },
        { id:3, title:"Morning Protection", arabic:"اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", translation:"O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is our resurrection.", ref:"Tirmidhi" },
        { id:4, title:"Morning Dhikr", arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", translation:"Glory is to Allah and praise is to Him. (100 times in morning)", ref:"Muslim" },
        { id:5, title:"Sayyidul Istighfar", arabic:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ", translation:"O Allah, You are my Lord, none has the right to be worshipped except You, You created me and I am Your servant and I abide to Your covenant and promise as best I can.", ref:"Bukhari" },
        { id:6, title:"Morning Blessing", arabic:"اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ", translation:"O Allah, what blessing I or any of Your creation have risen upon, is from You alone, without partner.", ref:"Abu Dawud" },
        { id:7, title:"Protection Morning", arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ", translation:"O Allah, I ask You for well-being in this world and the next.", ref:"Ibn Majah" },
      ]
    },
    evening: {
      icon:"🌙", name:"Evening Duas", color:"#1A2E4D",
      duas: [
        { id:8, title:"Evening Remembrance", arabic:"اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", translation:"O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is our return.", ref:"Tirmidhi" },
        { id:9, title:"Evening Protection", arabic:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", translation:"I seek refuge in the perfect words of Allah from the evil of what He has created.", ref:"Muslim" },
        { id:10, title:"Evening Dhikr", arabic:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ", translation:"We have reached the evening and at this very time unto Allah belongs all sovereignty, and all praise is for Allah.", ref:"Abu Dawud" },
        { id:11, title:"Ayatul Kursi", arabic:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ", translation:"Allah! There is no god but He, the Living, the Self-subsisting, Eternal. No slumber can seize Him nor sleep.", ref:"Quran 2:255" },
        { id:12, title:"Evening Forgiveness", arabic:"اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ", translation:"O Allah, I have entered the evening calling You, the bearers of Your Throne, Your angels, and all of Your creation to witness.", ref:"Abu Dawud" },
        { id:13, title:"Three Quls Evening", arabic:"قُلْ هُوَ اللَّهُ أَحَدٌ", translation:"Say: He is Allah, the One! (Recite Al-Ikhlas, Al-Falaq, An-Nas 3 times each)", ref:"Abu Dawud" },
      ]
    },
    sleep: {
      icon:"😴", name:"Before Sleep", color:"#2E1A4D",
      duas: [
        { id:14, title:"Before Sleeping", arabic:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", translation:"In Your name O Allah, I die and I live.", ref:"Bukhari" },
        { id:15, title:"Sleep Dua", arabic:"اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", translation:"O Allah, protect me from Your punishment on the day Your servants are resurrected.", ref:"Abu Dawud" },
        { id:16, title:"Tasbih Before Sleep", arabic:"سُبْحَانَ اللَّهِ ، الْحَمْدُ لِلَّهِ ، اللَّهُ أَكْبَرُ", translation:"Glory is to Allah (33x), All praise is for Allah (33x), Allah is the greatest (34x)", ref:"Bukhari" },
        { id:17, title:"Kafirun Before Sleep", arabic:"قُلْ يَا أَيُّهَا الْكَافِرُونَ", translation:"Recite Surah Al-Kafirun before sleeping — it is a disavowal from shirk.", ref:"Abu Dawud" },
        { id:18, title:"Protection Night", arabic:"اللَّهُمَّ إِنِّي أَسْلَمْتُ نَفْسِي إِلَيْكَ وَفَوَّضْتُ أَمْرِي إِلَيْكَ", translation:"O Allah, I submit myself to You, entrust my affairs to You.", ref:"Bukhari" },
        { id:19, title:"Waking at Night", arabic:"لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ", translation:"None has the right to be worshipped except Allah alone, without partner.", ref:"Bukhari" },
      ]
    },
    food: {
      icon:"🍽️", name:"Food & Eating", color:"#2E4D1A",
      duas: [
        { id:20, title:"Before Eating", arabic:"بِسْمِ اللَّهِ", translation:"In the name of Allah. (Say at the beginning of eating)", ref:"Abu Dawud" },
        { id:21, title:"Forgot Bismillah", arabic:"بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ", translation:"In the name of Allah at its beginning and end. (If you forget to say Bismillah at start)", ref:"Abu Dawud" },
        { id:22, title:"After Eating", arabic:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ", translation:"All praise is for Allah who fed me this and provided it for me without any might nor power from myself.", ref:"Tirmidhi" },
        { id:23, title:"After Drinking Milk", arabic:"اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَزِدْنَا مِنْهُ", translation:"O Allah, bless it for us and give us more of it.", ref:"Tirmidhi" },
        { id:24, title:"When Fasting & Invited", arabic:"إِنِّي صَائِمٌ", translation:"I am fasting. (Say when invited to food while fasting)", ref:"Muslim" },
        { id:25, title:"Breaking Fast", arabic:"اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", translation:"O Allah, for You I have fasted and upon Your provision I have broken my fast.", ref:"Abu Dawud" },
      ]
    },
    travel: {
      icon:"✈️", name:"Travel Duas", color:"#4D2E1A",
      duas: [
        { id:26, title:"Leaving Home", arabic:"بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", translation:"In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.", ref:"Abu Dawud" },
        { id:27, title:"Entering Home", arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ", translation:"O Allah, I ask You for the good of entering and the good of leaving.", ref:"Abu Dawud" },
        { id:28, title:"Riding Vehicle", arabic:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ", translation:"How perfect He is, the One Who has placed this (transport) at our service, for we ourselves would not have been capable of that.", ref:"Quran 43:13-14" },
        { id:29, title:"During Journey", arabic:"اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا وَاطْوِ عَنَّا بُعْدَهُ", translation:"O Allah, lighten this journey for us and make its distance easy for us.", ref:"Muslim" },
        { id:30, title:"Entering City", arabic:"اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَمَا أَظْلَلْنَ، وَرَبَّ الْأَرَضِينَ وَمَا أَقْلَلْنَ", translation:"O Allah, Lord of the seven heavens and all they overshadow, and Lord of the seven earths and all they carry.", ref:"Ibn Sunni" },
        { id:31, title:"Returning Home", arabic:"آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ", translation:"We return, repent, worship and praise our Lord.", ref:"Muslim" },
      ]
    },
    forgiveness: {
      icon:"🤲", name:"Forgiveness", color:"#1A4D4D",
      duas: [
        { id:32, title:"Seeking Forgiveness", arabic:"رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ، إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", translation:"My Lord, forgive me and accept my repentance. Verily you are the Ever-Returning, the Most Merciful.", ref:"Ahmad" },
        { id:33, title:"Complete Forgiveness", arabic:"اللَّهُمَّ اغْفِرْ لِي ذَنْبِي كُلَّهُ، دِقَّهُ وَجِلَّهُ، وَأَوَّلَهُ وَآخِرَهُ، وَعَلَانِيَتَهُ وَسِرَّهُ", translation:"O Allah, forgive me all my sins, great and small, the first and the last, those that are apparent and those that are hidden.", ref:"Muslim" },
        { id:34, title:"Dua of Yunus", arabic:"لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", translation:"There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", ref:"Quran 21:87" },
        { id:35, title:"Best Forgiveness Dua", arabic:"أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", translation:"I seek forgiveness from Allah the Magnificent, whom there is none worthy of worship except Him, the Ever-Living, the Sustainer, and I repent to Him.", ref:"Tirmidhi" },
        { id:36, title:"Mercy Dua", arabic:"رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ", translation:"Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.", ref:"Quran 7:23" },
      ]
    },
    masjid: {
      icon:"🕌", name:"Masjid Duas", color:"#4D3D1A",
      duas: [
        { id:37, title:"Entering Masjid", arabic:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", translation:"O Allah, open the gates of Your mercy for me.", ref:"Muslim" },
        { id:38, title:"Leaving Masjid", arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", translation:"O Allah, I ask You from Your favour.", ref:"Muslim" },
        { id:39, title:"After Adhan", arabic:"اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ", translation:"O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and favour.", ref:"Bukhari" },
        { id:40, title:"Before Prayer", arabic:"اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ", translation:"O Allah, separate me from my sins as You have separated the East from the West.", ref:"Bukhari" },
        { id:41, title:"After Prayer", arabic:"اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", translation:"O Allah, help me to remember You, to thank You, and to worship You in the best manner.", ref:"Abu Dawud" },
        { id:42, title:"Friday Dua", arabic:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ", translation:"O Allah, send blessings upon Muhammad and the family of Muhammad. (Recite frequently on Friday)", ref:"Bukhari" },
      ]
    },
    hardship: {
      icon:"💪", name:"Times of Hardship", color:"#4D1A2E",
      duas: [
        { id:43, title:"Anxiety & Sorrow", arabic:"اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ", translation:"O Allah, I am Your servant, son of Your servant, son of Your female servant, my forelock is in Your hand.", ref:"Ahmad" },
        { id:44, title:"Distress Dua", arabic:"لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ", translation:"None has the right to be worshipped except Allah, the Mighty, the Forbearing. None has the right to be worshipped except Allah, Lord of the magnificent Throne.", ref:"Bukhari" },
        { id:45, title:"When in Debt", arabic:"اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ", translation:"O Allah, suffice me with what You have allowed instead of what You have forbidden, and make me independent of all others besides You.", ref:"Tirmidhi" },
        { id:46, title:"For Good in Both Worlds", arabic:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", translation:"Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.", ref:"Quran 2:201" },
        { id:47, title:"Tawakkul Dua", arabic:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", translation:"Allah is sufficient for us and He is the best disposer of affairs.", ref:"Quran 3:173" },
        { id:48, title:"Patience Dua", arabic:"رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ", translation:"Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.", ref:"Quran 2:250" },
      ]
    },
  };

  const playDuaAudio = (dua) => {
    if (audio) { audio.pause(); audio.src = ""; setAudio(null); }
    if (playingDua === dua.id) { setPlayingDua(null); return; }
    // Use text-to-speech for Arabic dua recitation
    try {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(dua.arabic);
        utterance.lang = "ar-SA";
        utterance.rate = 0.75;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        // Try to find Arabic voice
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
        if (arabicVoice) utterance.voice = arabicVoice;
        utterance.onend = () => setPlayingDua(null);
        utterance.onerror = () => setPlayingDua(null);
        window.speechSynthesis.speak(utterance);
        setPlayingDua(dua.id);
      } else {
        // Fallback: play a gentle tone
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(396, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 1.5);
        setTimeout(() => setPlayingDua(null), 1500);
        setPlayingDua(dua.id);
      }
    } catch(_) { setPlayingDua(null); }
  };

  const stopDuaAudio = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (audio) { audio.pause(); audio.src = ""; setAudio(null); }
    setPlayingDua(null);
  };

  // Dua detail view
  if (selectedDua) {
    const cat = DUAS[selectedCat];
    return (
      <div style={{ display:"flex", flexDirection:"column", position:"fixed", inset:0, zIndex:500, background:DARK_GREEN }}>
        <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${cat.color})`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <button onClick={() => setSelectedDua(null)} style={{ background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"7px 12px", color:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>← Back</button>
          <div style={{ flex:1, color:LIGHT_GOLD, fontWeight:700, fontSize:14 }}>{selectedDua.title}</div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:20 }}>
          <div style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:18, padding:20, marginBottom:16 }}>
            <div style={{ color:LIGHT_GOLD, fontSize:24, lineHeight:2.0, textAlign:"right", direction:"rtl", fontFamily:"serif", marginBottom:16 }}>
              {selectedDua.arabic}
            </div>
            <div style={{ borderTop:"1px solid rgba(201,168,76,0.15)", paddingTop:14, color:"rgba(255,255,255,0.6)", fontSize:13, lineHeight:1.8, fontStyle:"italic" }}>
              {selectedDua.translation}
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.1)", borderRadius:12, padding:"10px 14px", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:GOLD, fontSize:12 }}>📚</span>
            <span style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>Reference: <span style={{ color:GOLD }}>{selectedDua.ref}</span></span>
          </div>
          <div onClick={() => playingDua === selectedDua.id ? stopDuaAudio() : playDuaAudio(selectedDua)} style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, borderRadius:20, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer", textAlign:"center" }}>
            {playingDua === selectedDua.id ? "⏸ Stop" : "🔊 Listen Arabic"}
          </div>
        </div>
      </div>
    );
  }

  // Category detail view
  if (selectedCat) {
    const cat = DUAS[selectedCat];
    return (
      <div style={{ display:"flex", flexDirection:"column", position:"fixed", inset:0, zIndex:500, background:DARK_GREEN }}>
        <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${cat.color})`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <button onClick={() => setSelectedCat(null)} style={{ background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"7px 12px", color:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>← Back</button>
          <div style={{ flex:1 }}>
            <div style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:15 }}>{cat.icon} {cat.name}</div>
            <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>{cat.duas.length} Duas</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 80px" }}>
          {cat.duas.map(dua => (
            <div key={dua.id} onClick={() => { setSelectedDua(dua); }} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(201,168,76,0.12)", borderRadius:14, padding:"16px", marginBottom:10, cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ color:GOLD, fontWeight:700, fontSize:13 }}>{dua.title}</div>
                <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10 }}>{dua.ref}</div>
              </div>
              <div style={{ color:LIGHT_GOLD, fontSize:18, lineHeight:1.9, textAlign:"right", direction:"rtl", fontFamily:"serif", marginBottom:8 }}>
                {dua.arabic}
              </div>
              <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, lineHeight:1.6, fontStyle:"italic" }}>
                {dua.translation.length > 80 ? dua.translation.slice(0,80) + "..." : dua.translation}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Main categories view
  return (
    <div style={{ padding:"20px 20px 80px" }}>
      <SectionTitle>🤲 Dua Collection</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:16 }}>40+ Authentic Duas from Quran & Sunnah</div>

      {/* Dua of the Day */}
      <div style={{ background:`linear-gradient(135deg,${MID_GREEN},#1A2E4A)`, border:"1px solid rgba(201,168,76,0.3)", borderRadius:18, padding:"18px", marginBottom:20, textAlign:"center" }}>
        <div style={{ color:GOLD, fontSize:10, letterSpacing:2, marginBottom:8 }}>✨ DUA OF THE DAY</div>
        <div style={{ color:LIGHT_GOLD, fontSize:19, lineHeight:1.8, fontFamily:"serif", marginBottom:10, direction:"rtl" }}>رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً</div>
        <div style={{ color:"rgba(255,255,255,0.5)", fontSize:11, fontStyle:"italic" }}>"Our Lord, give us good in this world and good in the Hereafter..."</div>
      </div>

      {/* Categories */}
      <div style={{ color:OFF_WHITE, fontSize:14, fontWeight:700, marginBottom:12 }}>📂 Categories</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {Object.entries(DUAS).map(([key, cat]) => (
          <div key={key} onClick={() => setSelectedCat(key)} style={{ background:`linear-gradient(135deg,${cat.color},rgba(10,46,26,0.8))`, border:"1px solid rgba(201,168,76,0.2)", borderRadius:16, padding:"18px 14px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer" }}>
            <span style={{ fontSize:32 }}>{cat.icon}</span>
            <span style={{ color:OFF_WHITE, fontSize:12, fontWeight:700, textAlign:"center" }}>{cat.name}</span>
            <span style={{ color:"rgba(255,255,255,0.3)", fontSize:10 }}>{cat.duas.length} Duas</span>
          </div>
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


// ─── QIBLA PAGE ───────────────────────────────────────────────────────────────
function QiblaPage() {
  const [qibla, setQibla]         = useState(null);
  const [compass, setCompass]     = useState(0);
  const [error, setError]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [permAsked, setPermAsked] = useState(false);
  const [location, setLocation]   = useState(null);
  const [aligned, setAligned]     = useState(false);
  const compassRef = useRef(0);

  // ── Get GPS location & calculate Qibla ──
  useEffect(() => {
    setLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });
        // Accurate Qibla calculation using spherical formula
        const makkahLat = 21.4225 * Math.PI / 180;
        const makkahLng = 39.8262 * Math.PI / 180;
        const userLat   = lat * Math.PI / 180;
        const dLng      = makkahLng - (lng * Math.PI / 180);
        const y = Math.sin(dLng) * Math.cos(makkahLat);
        const x = Math.cos(userLat) * Math.sin(makkahLat) - Math.sin(userLat) * Math.cos(makkahLat) * Math.cos(dLng);
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        setQibla(Math.round(bearing));
        setLoading(false);
      },
      err => {
        setError("📍 Please allow location access to find accurate Qibla direction.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ── Device compass ──
  const startCompass = () => {
    const handler = e => {
      // iOS uses webkitCompassHeading (true north), Android uses alpha (magnetic)
      let heading = 0;
      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        heading = e.webkitCompassHeading; // iOS — already true north
      } else if (e.alpha !== null) {
        heading = 360 - e.alpha; // Android — convert to compass heading
      }
      compassRef.current = heading;
      setCompass(Math.round(heading));
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  };

  useEffect(() => {
    if (!window.DeviceOrientationEvent) return;
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      // iOS 13+ requires permission
      return; // handled by button
    } else {
      // Android — start automatically
      return startCompass();
    }
  }, []);

  const requestIOSPermission = () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(p => {
        if (p === "granted") { setPermAsked(true); startCompass(); }
        else setError("Compass permission denied. Please allow in Settings.");
      }).catch(() => setError("Could not request compass permission."));
    }
  };

  // ── Needle angle = qibla direction relative to current compass heading ──
  const needle = qibla !== null ? (qibla - compass + 360) % 360 : 0;

  // Check if aligned (within 5 degrees)
  useEffect(() => {
    const diff = Math.abs(needle % 360);
    setAligned(diff < 5 || diff > 355);
  }, [needle]);

  const getDirection = (deg) => {
    const dirs = ["N","NE","E","SE","S","SW","W","NW","N"];
    return dirs[Math.round(deg / 45)];
  };

  return (
    <div style={{ padding:"20px 20px 80px", display:"flex", flexDirection:"column", alignItems:"center" }}>
      <SectionTitle>🧭 Qibla Direction</SectionTitle>
      <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, marginBottom:20, textAlign:"center" }}>Point your phone and find the direction of the Holy Kaaba 🕋</div>

      {/* iOS Permission Button */}
      {typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function" && !permAsked && (
        <button onClick={requestIOSPermission} style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, border:"none", borderRadius:12, padding:"12px 24px", color:DARK_GREEN, fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:20 }}>
          📱 Enable Compass (iPhone)
        </button>
      )}

      {loading && (
        <div style={{ color:GOLD, fontSize:14, marginBottom:20, textAlign:"center" }}>
          📍 Getting your location...
        </div>
      )}

      {error && (
        <div style={{ background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.3)", borderRadius:14, padding:"14px 18px", marginBottom:20, color:"#FF9999", fontSize:13, textAlign:"center", lineHeight:1.7, width:"100%" }}>
          {error}
        </div>
      )}

      {/* ── Compass Rose ── */}
      <div style={{ position:"relative", width:280, height:280, marginBottom:24 }}>
        {/* Outer glow ring */}
        <div style={{ position:"absolute", inset:-4, borderRadius:"50%", background: aligned ? "rgba(0,255,100,0.1)" : "rgba(201,168,76,0.05)", border: aligned ? "2px solid rgba(0,255,100,0.5)" : `2px solid rgba(201,168,76,0.2)`, transition:"all 0.5s ease" }} />

        {/* Main compass circle */}
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%, #1E5535, #0A2010)", border:`3px solid ${aligned ? "#00FF64" : GOLD}`, boxShadow:`0 0 ${aligned ? "60px rgba(0,255,100,0.4)" : "40px rgba(201,168,76,0.25)"}`, transition:"all 0.5s ease" }}>

          {/* Tick marks */}
          {Array.from({length:72}).map((_,i) => {
            const angle = i * 5;
            const rad = (angle - 90) * Math.PI / 180;
            const isMajor = angle % 45 === 0;
            const r1 = isMajor ? 115 : 120;
            const r2 = 128;
            return (
              <div key={i} style={{
                position:"absolute", top:"50%", left:"50%",
                width: isMajor ? 2 : 1,
                height: isMajor ? 14 : 7,
                background: isMajor ? GOLD : "rgba(201,168,76,0.3)",
                transform:`translate(-50%,-50%) rotate(${angle}deg) translateY(-${r1}px)`,
                transformOrigin:"50% 50%",
              }} />
            );
          })}

          {/* Cardinal directions */}
          {[{l:"N",d:0,c:"#FF5555"},{l:"NE",d:45,c:GOLD},{l:"E",d:90,c:GOLD},{l:"SE",d:135,c:GOLD},{l:"S",d:180,c:GOLD},{l:"SW",d:225,c:GOLD},{l:"W",d:270,c:GOLD},{l:"NW",d:315,c:GOLD}].map(({l,d,c}) => {
            const r = l.length === 1 ? 98 : 95;
            const rad = (d - 90) * Math.PI / 180;
            return (
              <div key={l} style={{ position:"absolute", top:"50%", left:"50%", transform:`translate(calc(-50% + ${Math.cos(rad)*r}px), calc(-50% + ${Math.sin(rad)*r}px))`, color:c, fontSize: l.length===1 ? 15 : 10, fontWeight:700, fontFamily:"'Cinzel',serif" }}>{l}</div>
            );
          })}

          {/* Qibla Needle */}
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:`translate(-50%, -100%) rotate(${needle}deg)`, transformOrigin:"50% 100%", transition:"transform 0.4s ease", display:"flex", flexDirection:"column", alignItems:"center" }}>
            {/* Kaaba emoji at tip */}
            <div style={{ fontSize:22, marginBottom:2 }}>🕋</div>
            {/* Gold needle top */}
            <div style={{ width:0, height:0, borderLeft:"7px solid transparent", borderRight:"7px solid transparent", borderBottom:`70px solid ${aligned ? "#00FF64" : GOLD}`, transition:"border-bottom-color 0.5s" }} />
          </div>

          {/* Needle bottom (south) */}
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:`translate(-50%, 0%) rotate(${needle}deg)`, transformOrigin:"50% 0%", transition:"transform 0.4s ease" }}>
            <div style={{ width:0, height:0, borderLeft:"7px solid transparent", borderRight:"7px solid transparent", borderTop:"70px solid rgba(255,255,255,0.12)" }} />
          </div>

          {/* Center dot */}
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:16, height:16, borderRadius:"50%", background:GOLD, border:"3px solid #0A2010", zIndex:2 }} />
        </div>
      </div>

      {/* Aligned Banner */}
      {aligned && qibla !== null && (
        <div style={{ background:"rgba(0,255,100,0.12)", border:"1px solid rgba(0,255,100,0.4)", borderRadius:14, padding:"12px 24px", marginBottom:16, textAlign:"center" }}>
          <div style={{ color:"#00FF64", fontWeight:700, fontSize:15 }}>✅ Facing Qibla!</div>
          <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12, marginTop:4 }}>You are facing the direction of Makkah</div>
        </div>
      )}

      {/* Info Cards */}
      {qibla !== null && (
        <div style={{ display:"flex", gap:10, marginBottom:20, width:"100%" }}>
          <div style={{ flex:1, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:14, padding:"14px", textAlign:"center" }}>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:4 }}>QIBLA</div>
            <div style={{ color:GOLD, fontSize:28, fontWeight:700 }}>{qibla}°</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{getDirection(qibla)} from North</div>
          </div>
          <div style={{ flex:1, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:14, padding:"14px", textAlign:"center" }}>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, marginBottom:4 }}>COMPASS</div>
            <div style={{ color:GOLD, fontSize:28, fontWeight:700 }}>{compass}°</div>
            <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11 }}>{getDirection(compass)} heading</div>
          </div>
        </div>
      )}

      {location && (
        <div style={{ background:"rgba(255,255,255,0.04)", borderRadius:12, padding:"10px 16px", marginBottom:16, width:"100%", textAlign:"center" }}>
          <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>📍 Your Location: {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E</div>
        </div>
      )}

      {/* Quran Ayah */}
      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(201,168,76,0.1)", borderRadius:14, padding:"14px 16px", width:"100%", textAlign:"center" }}>
        <div style={{ color:LIGHT_GOLD, fontSize:15, fontFamily:"serif", direction:"rtl", marginBottom:6, lineHeight:1.8 }}>وَمِنْ حَيْثُ خَرَجْتَ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ</div>
        <div style={{ color:"rgba(255,255,255,0.3)", fontSize:11, fontStyle:"italic" }}>"Turn your face toward the Sacred Mosque." — Quran 2:150</div>
      </div>

      {/* Tips */}
      <div style={{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:12, padding:"12px 16px", marginTop:16, width:"100%" }}>
        <div style={{ color:GOLD, fontSize:12, fontWeight:700, marginBottom:8 }}>💡 Tips for accurate Qibla:</div>
        <div style={{ color:"rgba(255,255,255,0.4)", fontSize:11, lineHeight:1.8 }}>
          • Hold phone flat & horizontal<br/>
          • Move away from metal objects<br/>
          • Keep away from speakers & magnets<br/>
          • Compass turns GREEN when facing Qibla ✅
        </div>
      </div>
    </div>
  );
}

// ─── CHAT PAGE ─────────────────────────────────────────────────────────────────
const SCHOLARS = [
  { id:1, name:"Mufti Abdullah", role:"Head Imam — Jumma Masjid", speciality:"Fiqh & Daily Life", avatar:"👳", phone:"919000000001" },
  { id:2, name:"Maulana Yusuf",  role:"Islamic Scholar",           speciality:"Quran & Tafseer",  avatar:"📚", phone:"919000000002" },
  { id:3, name:"Sheikh Ibrahim", role:"Masjid Committee Head",     speciality:"General Guidance", avatar:"🕌", phone:"919000000003" },
];

const FAQ = [
  { q:"What are the 5 pillars of Islam?",        a:"The 5 pillars are: 1) Shahada (Declaration of faith) 2) Salah (5 daily prayers) 3) Zakat (Charity) 4) Sawm (Fasting in Ramadan) 5) Hajj (Pilgrimage to Makkah)" },
  { q:"How many times should I pray daily?",     a:"Muslims pray 5 times daily: Fajr (dawn), Dhuhr (midday), Asr (afternoon), Maghrib (sunset), and Isha (night). These prayers are obligatory for every adult Muslim." },
  { q:"What breaks the fast in Ramadan?",        a:"The fast is broken at Maghrib time by eating dates and drinking water (Sunnah). Things that break the fast include eating, drinking, and smoking intentionally from Fajr to Maghrib." },
  { q:"Is music halal or haram?",                a:"Scholars have different opinions on music. Most classical scholars consider instruments haram, while vocal nasheeds without instruments are generally permissible. It's best to consult a scholar for detailed guidance." },
  { q:"What is Zakat and who must pay?",         a:"Zakat is 2.5% of savings held for one lunar year above the nisab threshold (value of 87.48g gold). It is obligatory on every adult Muslim who possesses wealth above this minimum." },
  { q:"How to perform Wudu (ablution)?",         a:"1) Intention 2) Wash both hands 3) Rinse mouth 3x 4) Clean nose 3x 5) Wash face 3x 6) Wash arms to elbows 3x 7) Wipe head 8) Clean ears 9) Wash feet to ankles 3x. Right side before left." },
  { q:"What is the ruling on missed prayers?",   a:"Missed prayers (Qada) must be made up as soon as possible. You should pray them in order. There is no expiry for making up missed prayers — repent and make them up sincerely." },
  { q:"Can women pray during menstruation?",     a:"Women are exempt from prayer, fasting, and Tawaf during menstruation. These prayers do not need to be made up later. Fasts of Ramadan missed must be made up after the period ends." },
  { q:"What is the Sunnah of Friday (Jumu'ah)?", a:"Sunnah of Friday: 1) Ghusl (bath) 2) Wear clean clothes 3) Apply perfume 4) Go early to masjid 5) Recite Surah Al-Kahf 6) Send Durood on Prophet ﷺ 7) Make dua between Asr and Maghrib." },
  { q:"How to make Dua properly?",               a:"1) Face Qibla 2) Be in state of Wudu 3) Start with Alhamdulillah & Durood 4) Ask with humility and certainty 5) Use beautiful names of Allah 6) End with Durood & Ameen. Best times: last third of night, between Adhan & Iqamah, on Friday." },
  { q:"What is Halal food?",                     a:"Halal food must: 1) Not contain pork or pork products 2) Not contain alcohol 3) Be slaughtered in Allah's name by a Muslim 4) Be from permitted animals. Haram foods include pork, blood, carrion, and animals not slaughtered properly." },
  { q:"What is the importance of Hajj?",         a:"Hajj is the 5th pillar of Islam, obligatory once in a lifetime for every Muslim who is physically and financially able. It takes place in Dhul Hijjah. It is a complete forgiveness of past sins for those who perform it sincerely." },
];

function ChatPage() {
  const [messages, setMessages]       = useState([{ from:"bot", text:"Assalamu Alaikum! 🌿 I am your Islamic FAQ assistant. Ask me any Islamic question or tap a question below!" }]);
  const [input, setInput]             = useState("");
  const [showScholars, setShowScholars] = useState(false);
  const [contactMsg, setContactMsg]   = useState("");
  const [contactTopic, setContactTopic] = useState("");
  const msgEndRef = useRef(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const sendMessage = (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput("");
    setMessages(prev => [...prev, { from:"user", text:q }]);
    setTimeout(() => {
      const match = FAQ.find(f => f.q.toLowerCase().includes(q.toLowerCase()) || q.toLowerCase().includes(f.q.toLowerCase().split(" ").slice(0,3).join(" ")));
      const answer = match
        ? match.a
        : "JazakAllah Khair for your question! I don't have a specific answer for that. Would you like to contact one of our scholars for a detailed answer?";
      setMessages(prev => [...prev, { from:"bot", text:answer, showContact:!match }]);
    }, 600);
  };

  const openWhatsApp = (scholar) => {
    const msg = encodeURIComponent(`Assalamu Alaikum ${scholar.name},

I have a question about: *${contactTopic || "Islamic Guidance"}*

${contactMsg}

JazakAllah Khair`);
    window.open(`https://wa.me/${scholar.phone}?text=${msg}`, "_blank");
    setShowScholars(false);
    setContactMsg("");
    setContactTopic("");
    setMessages(prev => [...prev, { from:"bot", text:`Your message has been sent to ${scholar.name}! They will reply within 24 hours Insha'Allah. 🤲` }]);
  };

  if (showScholars) return (
    <div style={{ padding:"20px 20px 80px" }}>
      <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${MID_GREEN})`, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, marginBottom:16, borderRadius:"0 0 16px 16px" }}>
        <button onClick={() => setShowScholars(false)} style={{ background:"rgba(201,168,76,0.15)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:10, padding:"7px 12px", color:GOLD, fontSize:12, fontWeight:700, cursor:"pointer" }}>← Back</button>
        <div style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:15 }}>👳 Choose a Scholar</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginBottom:8 }}>Topic / Question:</div>
        <input value={contactTopic} onChange={e=>setContactTopic(e.target.value)} placeholder="e.g. Prayer, Fasting, Marriage..." style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:13, outline:"none", marginBottom:10 }}/>
        <div style={{ color:"rgba(255,255,255,0.45)", fontSize:12, marginBottom:8 }}>Your Message:</div>
        <textarea value={contactMsg} onChange={e=>setContactMsg(e.target.value)} placeholder="Write your question in detail..." rows={4} style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"12px 14px", color:"#fff", fontSize:13, outline:"none", resize:"none" }}/>
      </div>
      {SCHOLARS.map(s => (
        <div key={s.id} style={{ background:`linear-gradient(135deg,#1A4D2E,#0A2E1A)`, border:"1px solid rgba(201,168,76,0.2)", borderRadius:16, padding:"16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
            <div style={{ fontSize:36 }}>{s.avatar}</div>
            <div>
              <div style={{ color:OFF_WHITE, fontWeight:700, fontSize:15 }}>{s.name}</div>
              <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>{s.role}</div>
              <div style={{ color:GOLD, fontSize:11, marginTop:2 }}>📌 {s.speciality}</div>
            </div>
          </div>
          <div onClick={() => openWhatsApp(s)} style={{ background:"linear-gradient(135deg,#25D366,#128C7E)", borderRadius:12, padding:"11px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>💬</span>
            <span style={{ color:"#fff", fontWeight:700, fontSize:13 }}>Send WhatsApp Message</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 60px)", padding:"0" }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${DARK_GREEN},${MID_GREEN})`, padding:"16px 20px 12px", flexShrink:0 }}>
        <SectionTitle>💬 Islamic Assistant</SectionTitle>
        <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Ask any Islamic question</div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:m.from==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"82%", background:m.from==="user"?`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`:"rgba(26,77,46,0.6)", border:m.from==="user"?"none":"1px solid rgba(201,168,76,0.15)", borderRadius:m.from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px", padding:"11px 14px", color:m.from==="user"?DARK_GREEN:OFF_WHITE, fontSize:13, lineHeight:1.7 }}>
              {m.text}
            </div>
            {m.showContact && (
              <div onClick={() => setShowScholars(true)} style={{ marginTop:8, background:"linear-gradient(135deg,#25D366,#128C7E)", borderRadius:12, padding:"9px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, maxWidth:"82%" }}>
                <span style={{ fontSize:14 }}>💬</span>
                <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>Contact a Scholar on WhatsApp</span>
              </div>
            )}
          </div>
        ))}
        <div ref={msgEndRef} />
      </div>

      {/* FAQ Quick Questions */}
      <div style={{ padding:"8px 12px", flexShrink:0, borderTop:"1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:6, scrollbarWidth:"none" }}>
          {FAQ.slice(0,6).map((f,i) => (
            <div key={i} onClick={() => sendMessage(f.q)} style={{ flex:"0 0 auto", background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:20, padding:"6px 12px", color:GOLD, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>
              {f.q.length > 30 ? f.q.slice(0,30)+"..." : f.q}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding:"10px 12px 16px", display:"flex", gap:8, flexShrink:0, background:DARK_GREEN }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMessage()} placeholder="Ask an Islamic question..." style={{ flex:1, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:24, padding:"11px 16px", color:"#fff", fontSize:13, outline:"none" }}/>
        <div onClick={() => sendMessage()} style={{ width:44, height:44, borderRadius:"50%", background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:18, flexShrink:0 }}>➤</div>
      </div>
    </div>
  );
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function MinbarLiveApp() {
  const [splash, setSplash]             = useState(true);
  const [page, setPage]               = useState("home");
  const [masjids, setMasjids] = useState(() => {
    try {
      const saved = localStorage.getItem("minbar_masjids");
      if (!saved) return MASJIDS_DEFAULT;
      const parsed = JSON.parse(saved);
      return MASJIDS_DEFAULT.map(def => {
        const found = parsed.find(p => p.id === def.id);
        return found ? { ...def, ...found, permanentLiveUrl: def.permanentLiveUrl } : def;
      });
    } catch { return MASJIDS_DEFAULT; }
  });
  const [adminTarget, setAdminTarget] = useState(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);
  const [showLogin, setShowLogin]     = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // ── Notifications ──
  const [notifEnabled, setNotifEnabled] = useState(() => {
    const saved = localStorage.getItem("minbar_notif");
    return saved === null ? true : saved === "true";
  });
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
  const { prompt, install } = useInstallPrompt();

  const navItems = [
    { id:"home",    icon:"🏠", label:"Home"    },
    { id:"quran",   icon:"📖", label:"Quran"   },
    { id:"dua",     icon:"🤲", label:"Dua"     },
    { id:"tasbeeh", icon:"📿", label:"Tasbeeh" },
    { id:"chat",    icon:"💬", label:"Ask"     },
  ];

  const pages = { home:HomePage, live:LivePage, library:LibraryPage, quran:QuranPage, dua:DuaPage, tasbeeh:TasbeehPage, qibla:QiblaPage, chat:ChatPage };
  const CurrentPage = pages[page] || HomePage;

  // Admin button clicked — show masjid selector
  const [showMasjidSelect, setShowMasjidSelect] = useState(false);
  const [showAddMasjid, setShowAddMasjid]       = useState(false); // eslint-disable-line no-unused-vars

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
    setMasjids(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      localStorage.setItem("minbar_masjids", JSON.stringify(updated));
      return updated;
    });
  };
  // eslint-disable-next-line no-unused-vars
  const handleAddMasjid = (newMasjid) => {
    setMasjids(prev => {
      const updated = [...prev, newMasjid];
      localStorage.setItem("minbar_masjids", JSON.stringify(updated));
      return updated;
    });
  };
  // eslint-disable-next-line no-unused-vars
  const handleDeleteMasjid = (id) => {
    if (window.confirm("Delete this masjid?")) {
      setMasjids(prev => {
        const updated = prev.filter(m => m.id !== id);
        localStorage.setItem("minbar_masjids", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Auto request notification permission on first load
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Save notif preference
  useEffect(() => {
    localStorage.setItem("minbar_notif", String(notifEnabled));
  }, [notifEnabled]);

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
              <div key={m.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div onClick={() => handleAdminSelect(m)} style={{
                  background:`linear-gradient(135deg,${m.color},rgba(10,46,26,0.9))`,
                  border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"14px 16px",
                  display:"flex", alignItems:"center", gap:14, cursor:"pointer", flex:1,
                }}>
                  <span style={{ fontSize:28 }}>{m.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ color:OFF_WHITE, fontWeight:700, fontSize:15 }}>{m.name}</div>
                    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:11, marginTop:2 }}>Tap to login as admin</div>
                  </div>
                  <div style={{ color:GOLD, fontSize:18 }}>🔒</div>
                </div>

              </div>
            ))}
            <div style={{ background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:14, padding:"14px 16px", marginTop:8 }}>
              <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, textAlign:"center", marginBottom:10 }}>Want to add or remove a Masjid?</div>
              <div style={{ display:"flex", gap:8 }}>
                <div onClick={() => window.open("https://wa.me/919157467486?text=Assalamu%20Alaikum%20Ibrahim%2C%20I%20want%20to%20add%2Fremove%20a%20Masjid%20on%20Minbar%20Live%20app.", "_blank")} style={{ flex:1, background:"linear-gradient(135deg,#25D366,#128C7E)", borderRadius:12, padding:"11px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <span style={{ fontSize:16 }}>💬</span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:12 }}>WhatsApp</span>
                </div>
                <div onClick={() => window.open("tel:+919157467486")} style={{ flex:1, background:"linear-gradient(135deg,#1A4D2E,#0A2E1A)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:12, padding:"11px", textAlign:"center", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <span style={{ fontSize:16 }}>📞</span>
                  <span style={{ color:GOLD, fontWeight:700, fontSize:12 }}>Call</span>
                </div>
              </div>
              <div style={{ color:"rgba(255,255,255,0.25)", fontSize:10, textAlign:"center", marginTop:8 }}>Contact Ibrahim AI Labs • We'll add it within 24 hours!</div>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {prompt && (
        <div style={{ position:"fixed", bottom:70, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:358, background:`linear-gradient(135deg,${MID_GREEN},#1A3D2A)`, border:"1px solid rgba(201,168,76,0.4)", borderRadius:16, padding:"14px 16px", zIndex:400, display:"flex", alignItems:"center", gap:12, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          <img src="/islamiclogo.png" alt="logo" style={{ width:40, height:40, borderRadius:10 }} />
          <div style={{ flex:1 }}>
            <div style={{ color:LIGHT_GOLD, fontWeight:700, fontSize:13 }}>Install Minbar Live</div>
            <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11 }}>Add to home screen for easy access</div>
          </div>
          <button onClick={install} style={{ background:`linear-gradient(135deg,${GOLD},${LIGHT_GOLD})`, color:DARK_GREEN, border:"none", borderRadius:10, padding:"8px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>Install</button>
          <button onClick={() => {}} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:18, cursor:"pointer", padding:0 }}>✕</button>
        </div>
      )}

      {/* ── ADD MASJID MODAL ── */}
      {showAddMasjid && (
        <AddMasjidModal
          onAdd={handleAddMasjid}
          onClose={() => setShowAddMasjid(false)}
        />
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