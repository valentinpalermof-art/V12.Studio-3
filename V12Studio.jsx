import { useState, useEffect } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const HOURS = [
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

const SERVICES = [
  { id: "corte",   label: "Corte",        icon: "✂️", duration: "30 min", price: 0 },
  { id: "barba",   label: "Barba",         icon: "🪒", duration: "20 min", price: 0 },
  { id: "combo",   label: "Corte + Barba", icon: "💈", duration: "50 min", price: 0 },
  { id: "tenido",  label: "Teñido",        icon: "🎨", duration: "60 min", price: 0 },
];

const PAYMENT_METHODS = [
  { id: "efectivo",      label: "Efectivo",     icon: "💵" },
  { id: "transferencia", label: "Transferencia", icon: "📲" },
  { id: "debito",        label: "Débito",        icon: "💳" },
  { id: "credito",       label: "Crédito",       icon: "💳" },
  { id: "mercadopago",   label: "Mercado Pago",  icon: "🔵" },
];

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTH_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAY_NAMES   = ["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const DAY_FULL    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const BOOKINGS_KEY = "v12studio_bookings";
const COBROS_KEY   = "v12studio_cobros";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDK(y, m, d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function parseDK(dk) { const [y,m,d] = dk.split("-"); return new Date(+y, +m-1, +d); }
function fmtDate(dk) {
  if (!dk) return "";
  const dt = parseDK(dk);
  const [,m,d] = dk.split("-");
  return `${DAY_FULL[dt.getDay()]} ${d} de ${MONTH_NAMES[+m-1]}`;
}
function getDIM(y,m) { return new Date(y,m+1,0).getDate(); }
function getFirst(y,m) { return new Date(y,m,1).getDay(); }

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg0:    "#020a18",
  bg1:    "#041022",
  bg2:    "#061530",
  card:   "rgba(4,16,40,0.88)",
  border: "rgba(40,90,200,0.2)",
  borderHover: "rgba(80,140,255,0.45)",
  blue:   "#1a4fc4",
  blueM:  "#2d6be4",
  blueL:  "#5090f0",
  blueXL: "#90bfff",
  accent: "#4080e8",
  accentGlow: "rgba(64,128,232,0.3)",
  starBlue: "rgba(30,70,180,0.18)",
  starBlueL: "rgba(50,100,220,0.12)",
  green:  "#34d399",
  text:   "#d8e8ff",
  muted:  "#4a6890",
  dim:    "rgba(210,230,255,0.06)",
};

const glassCard = {
  background: C.card,
  backdropFilter: "blur(28px)",
  border: `1px solid ${C.border}`,
  borderRadius: "20px",
  boxShadow: "0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(80,140,255,0.07)",
};

// ─── Star SVG Background ──────────────────────────────────────────────────────
function StarBg() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none", overflow:"hidden" }}>
      {/* Large centered star */}
      <svg viewBox="0 0 200 200" style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%) rotate(-12deg)",
        width:"min(70vw,70vh)", height:"min(70vw,70vh)",
        opacity:0.07,
      }}>
        <polygon points="100,5 120,70 190,70 133,110 154,175 100,138 46,175 67,110 10,70 80,70"
          fill={C.blueM}/>
      </svg>
      {/* Smaller star top-right */}
      <svg viewBox="0 0 200 200" style={{
        position:"absolute", top:"-6%", right:"-4%",
        width:"clamp(180px,28vw,340px)", height:"clamp(180px,28vw,340px)",
        opacity:0.055,
      }}>
        <polygon points="100,5 120,70 190,70 133,110 154,175 100,138 46,175 67,110 10,70 80,70"
          fill={C.blueL}/>
      </svg>
      {/* Tiny star bottom-left */}
      <svg viewBox="0 0 200 200" style={{
        position:"absolute", bottom:"4%", left:"-3%",
        width:"clamp(100px,15vw,200px)", height:"clamp(100px,15vw,200px)",
        opacity:0.04,
      }}>
        <polygon points="100,5 120,70 190,70 133,110 154,175 100,138 46,175 67,110 10,70 80,70"
          fill={C.blueXL}/>
      </svg>
      {/* Ambient glows */}
      <div style={{
        position:"absolute", inset:0,
        background:`radial-gradient(ellipse 70% 60% at 50% 50%, rgba(20,60,180,0.13) 0%, transparent 65%),
                    radial-gradient(ellipse 40% 35% at 80% 15%, rgba(30,80,200,0.09) 0%, transparent 55%),
                    radial-gradient(ellipse 30% 30% at 10% 85%, rgba(20,60,180,0.06) 0%, transparent 50%)`
      }}/>
    </div>
  );
}

// ─── V12 Logo mark ────────────────────────────────────────────────────────────
function LogoMark({ size = 36 }) {
  return (
    <div style={{
      width:`${size}px`, height:`${size}px`, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative",
    }}>
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <defs>
          <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8ab4f8"/>
            <stop offset="50%" stopColor="#4080e8"/>
            <stop offset="100%" stopColor="#1a4fc4"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <polygon points="20,2 24.5,13.5 37,13.5 27,20.5 30.5,32 20,25.5 9.5,32 13,20.5 3,13.5 15.5,13.5"
          fill="none" stroke="url(#starGrad)" strokeWidth="2.2" filter="url(#glow)"/>
        <text x="20" y="20" textAnchor="middle" dominantBaseline="middle"
          fill="#c0d8ff" fontSize="8" fontWeight="700" fontFamily="'Georgia',serif"
          filter="url(#glow)">V12</text>
      </svg>
    </div>
  );
}

// ─── PIN LOGIN ────────────────────────────────────────────────────────────────
const RECEP_CODE = "V12studio24";

function PinLogin({ onSuccess, onBack }) {
  const [code, setCode]   = useState("");
  const [shake, setShake] = useState(false);
  const [show, setShow]   = useState(false);
  const [tries, setTries] = useState(0);

  const handleSubmit = () => {
    if (code === RECEP_CODE) { onSuccess(); }
    else {
      setShake(true); setTries(t=>t+1); setCode("");
      setTimeout(()=>setShake(false), 600);
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(160deg, ${C.bg0} 0%, ${C.bg1} 55%, ${C.bg2} 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Cormorant Garamond','Georgia',serif",
      padding:"20px", position:"relative", overflow:"hidden",
    }}>
      <StarBg/>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-10px)} 30%{transform:translateX(10px)} 45%{transform:translateX(-8px)} 60%{transform:translateX(8px)} 75%{transform:translateX(-4px)} 90%{transform:translateX(4px)} }
        @keyframes starPulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{
        position:"fixed", top:0, left:0, right:0, height:"2px",
        background:`linear-gradient(90deg,transparent,${C.blueM},${C.blueL},${C.blueM},transparent)`,
      }}/>

      <div style={{
        ...glassCard, width:"100%", maxWidth:"420px", padding:"48px 40px",
        textAlign:"center", position:"relative", zIndex:1,
        animation: shake ? "shake 0.5s ease" : "fadeUp 0.5s ease",
      }}>
        <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:"2px",
          background:`linear-gradient(90deg,transparent,${C.blueM},${C.blueL},transparent)`, borderRadius:"0 0 4px 4px"
        }}/>

        <div style={{ marginBottom:"28px", animation:"starPulse 3s ease-in-out infinite" }}>
          <LogoMark size={64}/>
        </div>

        <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontWeight:700, fontSize:"32px", color:"#e8f0ff", letterSpacing:"2px", marginBottom:"4px" }}>
          V12 STUDIO
        </div>
        <div style={{ fontSize:"11px", color:C.muted, letterSpacing:"5px", marginBottom:"36px", fontFamily:"'Gill Sans','Trebuchet MS',sans-serif" }}>
          BARBER SHOP · RECEPCIÓN
        </div>

        <div style={{ fontSize:"12px", color:C.blueXL, marginBottom:"10px", textAlign:"left", fontWeight:500, fontFamily:"'Gill Sans','Trebuchet MS',sans-serif", letterSpacing:"2px" }}>
          CÓDIGO DE ACCESO
        </div>
        <div style={{ position:"relative", marginBottom:tries>0?"8px":"20px" }}>
          <input type={show?"text":"password"} value={code}
            onChange={e=>setCode(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
            placeholder="••••••••••"
            autoFocus
            style={{
              width:"100%", padding:"14px 48px 14px 16px",
              background:"rgba(255,255,255,0.04)",
              border:`1px solid ${shake?"rgba(255,80,80,0.6)":C.border}`,
              borderRadius:"12px", color:"#fff",
              fontSize:"18px", letterSpacing:show?"2px":"6px",
              outline:"none", boxSizing:"border-box",
              fontFamily:"'Gill Sans','Trebuchet MS',sans-serif",
              transition:"border-color 0.2s",
            }}
            onFocus={e=>e.target.style.borderColor=C.blueM}
            onBlur={e=>e.target.style.borderColor=shake?"rgba(255,80,80,0.6)":C.border}
          />
          <button onClick={()=>setShow(s=>!s)} style={{
            position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)",
            background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:"18px",
          }}>{show?"🙈":"👁"}</button>
        </div>
        {tries > 0 && <div style={{ fontSize:"12px", color:"#ff7070", marginBottom:"12px", textAlign:"left", fontFamily:"'Gill Sans',sans-serif" }}>✕ Código incorrecto.</div>}

        <button onClick={handleSubmit} style={{
          width:"100%", padding:"15px",
          borderRadius:"12px", border:"none", cursor:"pointer",
          background:`linear-gradient(135deg, ${C.blue}, ${C.accent})`,
          color:"#fff", fontFamily:"'Gill Sans','Trebuchet MS',sans-serif",
          fontWeight:700, fontSize:"14px", letterSpacing:"3px",
          boxShadow:`0 8px 28px ${C.accentGlow}`,
          transition:"all 0.2s", marginBottom:"16px",
        }}
        onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"}
        onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}
        >INGRESAR →</button>

        <button onClick={onBack} style={{
          background:"none", border:"none", color:C.muted, cursor:"pointer",
          fontSize:"12px", fontFamily:"'Gill Sans',sans-serif", letterSpacing:"2px",
        }}>← VOLVER</button>

        <div style={{ marginTop:"24px", fontSize:"10px", color:"rgba(80,140,255,0.2)", letterSpacing:"3px", fontFamily:"'Gill Sans',sans-serif" }}>
          ACCESO RESTRINGIDO · SOLO PERSONAL
        </div>
      </div>
    </div>
  );
}

// ─── COBRO MODAL ──────────────────────────────────────────────────────────────
function CobroModal({ modal, form, setForm, saved, onSave, onClose }) {
  if (!modal) return null;
  const ready = form.barber && form.payment && form.price;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:100,
      background:"rgba(1,6,18,0.92)", backdropFilter:"blur(14px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"20px",
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        ...glassCard, padding:"36px", width:"100%", maxWidth:"460px",
        boxShadow:`0 40px 80px rgba(0,0,0,0.7), 0 0 80px ${C.accentGlow}`,
        position:"relative",
      }}>
        <div style={{ position:"absolute", top:0, left:"25%", right:"25%", height:"2px",
          background:`linear-gradient(90deg,transparent,${C.blueM},${C.blueL},transparent)`, borderRadius:"0 0 4px 4px"
        }}/>
        <div style={{ marginBottom:"26px" }}>
          <div style={{ fontSize:"10px", letterSpacing:"4px", color:C.blueL, fontWeight:700, marginBottom:"8px", fontFamily:"'Gill Sans',sans-serif" }}>REGISTRAR COBRO</div>
          <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:"24px", fontWeight:700, color:"#fff" }}>{modal.booking.name}</div>
          <div style={{ fontSize:"13px", color:C.muted, marginTop:"4px", fontFamily:"'Gill Sans',sans-serif" }}>
            {modal.time} · {SERVICES.find(s=>s.id===modal.booking.service)?.icon} {SERVICES.find(s=>s.id===modal.booking.service)?.label}
          </div>
        </div>

        <ModalLabel>Nombre del peluquero</ModalLabel>
        <StyledInput value={form.barber} onChange={e=>setForm(f=>({...f,barber:e.target.value}))} placeholder="Escribí el nombre" style={{ marginBottom:"20px" }}/>

        <ModalLabel>Medio de pago</ModalLabel>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"7px", marginBottom:"20px" }}>
          {PAYMENT_METHODS.map(p=>(
            <button key={p.id} onClick={()=>setForm(f=>({...f,payment:p.id}))} style={{
              padding:"9px 6px", borderRadius:"9px", border:"none", cursor:"pointer",
              background:form.payment===p.id?`linear-gradient(135deg,${C.blue},${C.accent})`:"rgba(255,255,255,0.04)",
              color:form.payment===p.id?"#fff":C.muted,
              fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"12px",
              transition:"all 0.15s", outline:"none",
              boxShadow:form.payment===p.id?`0 4px 14px ${C.accentGlow}`:"none",
            }}>{p.icon} {p.label}</button>
          ))}
        </div>

        <ModalLabel>Monto cobrado</ModalLabel>
        <div style={{ position:"relative", marginBottom:"28px" }}>
          <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:C.blueL, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"22px" }}>$</span>
          <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0"
            style={{
              width:"100%", padding:"14px 14px 14px 38px",
              background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`,
              borderRadius:"11px", color:"#fff", fontSize:"24px",
              fontFamily:"'Cormorant Garamond','Georgia',serif", fontWeight:700,
              outline:"none", boxSizing:"border-box", transition:"border-color 0.2s",
            }}
            onFocus={e=>e.target.style.borderColor=C.blueM}
            onBlur={e=>e.target.style.borderColor=C.border}
          />
        </div>

        <div style={{ display:"flex", gap:"10px" }}>
          <button onClick={onClose} style={{
            flex:1, padding:"13px", borderRadius:"10px",
            border:`1px solid ${C.border}`, background:"transparent",
            color:C.muted, cursor:"pointer",
            fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"13px",
          }}>Cancelar</button>
          <button onClick={onSave} disabled={!ready} style={{
            flex:2, padding:"13px", borderRadius:"10px", border:"none", cursor:ready?"pointer":"not-allowed",
            background:saved?C.green:ready?`linear-gradient(135deg,${C.blue},${C.accent})`:"rgba(255,255,255,0.04)",
            color:saved?"#000":ready?"#fff":"#444",
            fontFamily:"'Gill Sans',sans-serif", fontWeight:700, fontSize:"14px", letterSpacing:"1px",
            transition:"all 0.2s",
            boxShadow:ready&&!saved?`0 6px 20px ${C.accentGlow}`:"none",
          }}>{saved?"✓ GUARDADO":"GUARDAR COBRO"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT VIEW ──────────────────────────────────────────────────────────────
function ClientView({ today, todayKey, bookings, saveBookings }) {
  const [step, setStep]             = useState("calendar");
  const [viewMonth, setViewMonth]   = useState(today.getMonth());
  const [viewYear, setViewYear]     = useState(today.getFullYear());
  const [selDate, setSelDate]       = useState(null);
  const [selTime, setSelTime]       = useState(null);
  const [selSvc, setSelSvc]         = useState(null);
  const [name, setName]             = useState("");
  const [phone, setPhone]           = useState("");
  const [lastBooking, setLast]      = useState(null);
  const [anim, setAnim]             = useState(true);

  useEffect(()=>{ setAnim(false); const t=setTimeout(()=>setAnim(true),30); return()=>clearTimeout(t); }, [step]);

  const dayBookings = dk => bookings[dk] || {};
  const taken = (dk,t) => !!dayBookings(dk)[t];
  const freeSlots = selDate ? HOURS.filter(h=>!taken(selDate,h)).length : 0;

  const handleDay = day => {
    const d = new Date(viewYear, viewMonth, day);
    const tm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (d < tm) return;
    const dow = d.getDay();
    if (dow===0 || dow===1) return;
    setSelDate(toDK(viewYear, viewMonth, day));
    setSelTime(null); setSelSvc(null); setName(""); setPhone("");
    setStep("time");
  };

  const handleConfirm = () => {
    if (!name.trim() || !selTime || !selSvc) return;
    const updated = { ...bookings, [selDate]: { ...dayBookings(selDate), [selTime]: { name:name.trim(), phone:phone.trim(), service:selSvc } } };
    saveBookings(updated);
    setLast({ date:selDate, time:selTime, service:selSvc, name:name.trim() });
    setStep("confirm");
  };

  const reset = () => { setStep("calendar"); setSelDate(null); setSelTime(null); setSelSvc(null); setName(""); setPhone(""); setLast(null); };

  const dim = getDIM(viewYear, viewMonth);
  const first = getFirst(viewYear, viewMonth);
  const fadeStyle = { opacity:anim?1:0, transform:anim?"translateY(0)":"translateY(16px)", transition:"all 0.38s ease" };

  return (
    <div style={{ maxWidth:"520px", margin:"0 auto", padding:"clamp(20px,4vw,44px) 16px 60px" }}>
      <style>{`
        @keyframes floatStar { 0%,100%{transform:translateY(0px) rotate(-12deg)} 50%{transform:translateY(-8px) rotate(-12deg)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder{color:rgba(100,140,200,0.4);}
      `}</style>

      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:"40px" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:"20px" }}>
          <div style={{ animation:"floatStar 4s ease-in-out infinite" }}>
            <LogoMark size={72}/>
          </div>
        </div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond','Georgia',serif",
          fontWeight:700, fontSize:"clamp(42px,12vw,72px)",
          margin:"0 0 4px", lineHeight:0.95, letterSpacing:"4px",
          background:`linear-gradient(135deg, #fff 0%, ${C.blueXL} 40%, ${C.blueL} 70%, #fff 100%)`,
          backgroundSize:"200% auto",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          animation:"shimmer 6s linear infinite",
        }}>V12 STUDIO</h1>
        <div style={{ fontSize:"11px", color:C.muted, letterSpacing:"6px", marginTop:"10px", fontFamily:"'Gill Sans','Trebuchet MS',sans-serif" }}>
          BARBER SHOP
        </div>
        <div style={{ width:"60px", height:"1px", background:`linear-gradient(90deg,transparent,${C.blueM},transparent)`, margin:"14px auto 0" }}/>
        <p style={{ color:C.muted, fontSize:"11px", letterSpacing:"3px", marginTop:"14px", fontFamily:"'Gill Sans',sans-serif" }}>
          RESERVÁ TU TURNO · MAR A SÁB · 12–20 HS
        </p>
      </div>

      {/* Progress */}
      {step !== "confirm" && (
        <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"28px" }}>
          {["calendar","time","form"].map((s,i)=>{
            const steps=["calendar","time","form"]; const cur=steps.indexOf(step);
            return <div key={s} style={{ width:step===s?"30px":"8px", height:"8px", borderRadius:"4px", background:step===s?C.blueM:cur>i?"rgba(40,100,200,0.5)":"rgba(255,255,255,0.08)", transition:"all 0.3s ease" }}/>;
          })}
        </div>
      )}

      {/* CALENDAR */}
      {step==="calendar" && (
        <div style={fadeStyle}>
          <GlassCard>
            <SectionTitle icon="★">Elegí el día</SectionTitle>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <NavBtn onClick={()=>{ if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}>‹</NavBtn>
              <span style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontWeight:700, fontSize:"19px", color:"#e8f0ff", letterSpacing:"1px" }}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <NavBtn onClick={()=>{ if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}>›</NavBtn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px", marginBottom:"8px" }}>
              {DAY_NAMES.map(d=>(
                <div key={d} style={{ textAlign:"center", fontSize:"10px", color:C.muted, fontWeight:700, letterSpacing:"1px", padding:"3px 0", fontFamily:"'Gill Sans',sans-serif" }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
              {Array.from({length:first}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:dim}).map((_,i)=>{
                const day=i+1, dk=toDK(viewYear,viewMonth,day);
                const dt=new Date(viewYear,viewMonth,day), tm=new Date(today.getFullYear(),today.getMonth(),today.getDate());
                const isPast=dt<tm, dow=dt.getDay(), isClosed=dow===0||dow===1, isDisabled=isPast||isClosed;
                const isToday=dk===toDK(today.getFullYear(),today.getMonth(),today.getDate());
                const hasTurnos=Object.keys(dayBookings(dk)).length>0, isSel=dk===selDate;
                return (
                  <button key={day} onClick={()=>!isDisabled&&handleDay(day)} style={{
                    aspectRatio:"1", borderRadius:"9px", border:"none",
                    background:isSel?`linear-gradient(135deg,${C.blue},${C.blueM})`:isToday?"rgba(30,70,200,0.22)":isDisabled?"transparent":"rgba(255,255,255,0.03)",
                    color:isDisabled?"rgba(255,255,255,0.12)":isSel?"#fff":isToday?C.blueXL:C.text,
                    cursor:isDisabled?"not-allowed":"pointer",
                    fontSize:"13px", fontWeight:isSel||isToday?700:400, position:"relative", outline:"none", transition:"all 0.15s",
                    border:isToday&&!isSel?`1px solid rgba(40,100,200,0.5)`:"1px solid transparent",
                    textDecoration:isClosed&&!isPast?"line-through":"none",
                    boxShadow:isSel?`0 4px 18px ${C.accentGlow}`:"none",
                    fontFamily:"'Gill Sans',sans-serif",
                  }}
                  onMouseEnter={e=>{ if(!isDisabled&&!isSel) e.currentTarget.style.background="rgba(30,70,200,0.18)"; }}
                  onMouseLeave={e=>{ if(!isDisabled&&!isSel) e.currentTarget.style.background=isToday?"rgba(30,70,200,0.22)":"rgba(255,255,255,0.03)"; }}
                  >
                    {day}
                    {hasTurnos&&!isDisabled&&(
                      <div style={{ position:"absolute", bottom:"3px", left:"50%", transform:"translateX(-50%)", width:"3px", height:"3px", borderRadius:"50%", background:isSel?"#fff":C.blueL }}/>
                    )}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:"16px", padding:"10px 14px", background:"rgba(30,70,200,0.07)", borderRadius:"10px", fontSize:"11px", color:C.muted, textAlign:"center", fontFamily:"'Gill Sans',sans-serif" }}>
              ★ Días con turnos agendados · Dom y Lun cerrado
            </div>
          </GlassCard>
        </div>
      )}

      {/* TIME + SERVICE */}
      {step==="time" && (
        <div style={fadeStyle}>
          <BackBtn onClick={()=>setStep("calendar")}/>
          <GlassCard>
            <SectionTitle icon="★">{fmtDate(selDate)}</SectionTitle>
            <div style={{ color:C.blueL, fontSize:"12px", marginBottom:"22px", fontWeight:600, fontFamily:"'Gill Sans',sans-serif", letterSpacing:"2px" }}>
              {freeSlots} HORARIOS DISPONIBLES
            </div>
            <FieldLabel>Servicio</FieldLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"26px" }}>
              {SERVICES.map(s=>(
                <button key={s.id} onClick={()=>setSelSvc(s.id)} style={{
                  padding:"16px 10px", borderRadius:"14px", border:"none", cursor:"pointer",
                  background:selSvc===s.id?`linear-gradient(135deg,${C.blue},${C.blueM})`:"rgba(255,255,255,0.04)",
                  color:selSvc===s.id?"#fff":C.muted,
                  border:selSvc===s.id?`1px solid ${C.blueL}`:`1px solid rgba(255,255,255,0.07)`,
                  outline:"none", transition:"all 0.18s",
                  boxShadow:selSvc===s.id?`0 6px 22px ${C.accentGlow}`:"none",
                  fontFamily:"'Gill Sans',sans-serif",
                }}>
                  <div style={{ fontSize:"24px", marginBottom:"6px" }}>{s.icon}</div>
                  <div style={{ fontWeight:700, fontSize:"13px", letterSpacing:"0.5px" }}>{s.label}</div>
                  <div style={{ fontSize:"11px", opacity:0.6, marginTop:"3px" }}>{s.duration}</div>
                </button>
              ))}
            </div>
            <FieldLabel>Horario</FieldLabel>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"7px" }}>
              {HOURS.map(h=>{
                const isTaken=taken(selDate,h), isSel=selTime===h;
                return (
                  <button key={h} onClick={()=>!isTaken&&setSelTime(h)} disabled={isTaken} style={{
                    padding:"10px 4px", borderRadius:"9px", border:"none",
                    background:isSel?`linear-gradient(135deg,${C.blue},${C.blueM})`:isTaken?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",
                    color:isTaken?"rgba(255,255,255,0.15)":isSel?"#fff":C.text,
                    cursor:isTaken?"not-allowed":"pointer",
                    fontSize:"13px", fontWeight:isSel?700:400,
                    border:isSel?`1px solid ${C.blueL}`:"1px solid rgba(255,255,255,0.07)",
                    textDecoration:isTaken?"line-through":"none",
                    outline:"none", transition:"all 0.15s",
                    boxShadow:isSel?`0 4px 14px ${C.accentGlow}`:"none",
                    fontFamily:"'Gill Sans',sans-serif",
                  }}>
                    {h}
                  </button>
                );
              })}
            </div>
            <PrimaryBtn onClick={()=>{if(selTime&&selSvc)setStep("form");}} disabled={!selTime||!selSvc} style={{ marginTop:"26px" }}>
              Continuar →
            </PrimaryBtn>
          </GlassCard>
        </div>
      )}

      {/* FORM */}
      {step==="form" && (
        <div style={fadeStyle}>
          <BackBtn onClick={()=>setStep("time")}/>
          <GlassCard>
            <SectionTitle icon="★">Tus datos</SectionTitle>
            <div style={{ background:"rgba(20,60,180,0.1)", border:`1px solid rgba(40,100,200,0.25)`, borderRadius:"14px", padding:"16px", marginBottom:"24px" }}>
              <div style={{ fontSize:"10px", color:C.blueL, fontWeight:700, letterSpacing:"3px", marginBottom:"8px", fontFamily:"'Gill Sans',sans-serif" }}>RESUMEN</div>
              <div style={{ fontSize:"14px", color:"#fff", fontFamily:"'Cormorant Garamond',serif" }}>★ {fmtDate(selDate)} · {selTime}</div>
              <div style={{ fontSize:"14px", color:"#fff", marginTop:"5px", fontFamily:"'Cormorant Garamond',serif" }}>{SERVICES.find(s=>s.id===selSvc)?.icon} {SERVICES.find(s=>s.id===selSvc)?.label}</div>
            </div>
            <FieldLabel>Tu nombre</FieldLabel>
            <StyledInput value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={{ marginBottom:"16px" }}/>
            <FieldLabel>Teléfono (opcional)</FieldLabel>
            <StyledInput value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej: 11 1234-5678" style={{ marginBottom:"26px" }}/>
            <PrimaryBtn onClick={handleConfirm} disabled={!name.trim()}>
              ✓ Confirmar turno
            </PrimaryBtn>
          </GlassCard>
        </div>
      )}

      {/* CONFIRM */}
      {step==="confirm" && lastBooking && (
        <div style={fadeStyle}>
          <GlassCard>
            <div style={{ textAlign:"center", padding:"14px 0" }}>
              <div style={{ margin:"0 auto 22px", animation:"floatStar 3s ease-in-out infinite" }}>
                <svg viewBox="0 0 80 80" width="80" height="80">
                  <defs>
                    <linearGradient id="confirmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#5090f0"/>
                      <stop offset="100%" stopColor="#1a4fc4"/>
                    </linearGradient>
                    <filter id="glow2"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <polygon points="40,4 48,28 74,28 53,44 61,68 40,54 19,68 27,44 6,28 32,28"
                    fill="url(#confirmGrad)" filter="url(#glow2)" opacity="0.9"/>
                  <text x="40" y="43" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="18" fontWeight="700">✓</text>
                </svg>
              </div>
              <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:"28px", fontWeight:700, margin:"0 0 6px", color:"#fff", letterSpacing:"1px" }}>
                ¡Turno confirmado!
              </h2>
              <p style={{ color:C.muted, fontSize:"14px", margin:"0 0 28px", fontFamily:"'Gill Sans',sans-serif" }}>Te esperamos, {lastBooking.name}</p>
              <div style={{ background:"rgba(20,60,180,0.1)", border:`1px solid rgba(40,100,200,0.25)`, borderRadius:"14px", padding:"18px", textAlign:"left", marginBottom:"22px" }}>
                <InfoRow label="★ Fecha"    value={fmtDate(lastBooking.date)}/>
                <InfoRow label="◷ Hora"     value={lastBooking.time}/>
                <InfoRow label="✂ Servicio" value={SERVICES.find(s=>s.id===lastBooking.service)?.label}/>
                <InfoRow label="◆ Nombre"   value={lastBooking.name} last/>
              </div>
              <button onClick={reset} style={{
                width:"100%", padding:"13px", borderRadius:"12px",
                border:`1px solid rgba(40,100,200,0.35)`, background:"rgba(20,60,180,0.1)",
                color:C.blueXL, cursor:"pointer", fontFamily:"'Gill Sans',sans-serif",
                fontWeight:600, fontSize:"13px", letterSpacing:"2px", outline:"none",
              }}>AGENDAR OTRO TURNO</button>
            </div>
          </GlassCard>
        </div>
      )}

      <div style={{ textAlign:"center", marginTop:"32px", color:"rgba(50,100,200,0.3)", fontSize:"10px", letterSpacing:"4px", fontFamily:"'Gill Sans',sans-serif" }}>
        V12 STUDIO © {today.getFullYear()}
      </div>
    </div>
  );
}

// ─── RECEPTIONIST INNER ───────────────────────────────────────────────────────
function ReceptionistViewInner({ today, todayKey, bookings, cobros, openModal }) {
  const [tab, setTab]           = useState("grilla");
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [selDate, setSelDate]     = useState(todayKey);
  const [filterPay, setFilterPay] = useState("Todos");

  const dayBookings = dk => bookings[dk] || {};
  const todayCobros = Object.values(cobros[todayKey]||{});
  const todayTotal  = todayCobros.reduce((s,c)=>s+(c.price||0),0);

  const allCobros = Object.entries(cobros).flatMap(([date,times])=>
    Object.entries(times).map(([time,data])=>({
      date, time,
      client: bookings[date]?.[time]?.name || "—",
      service: bookings[date]?.[time]?.service || "—",
      ...data,
    }))
  ).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));

  const filtered = filterPay==="Todos" ? allCobros : allCobros.filter(c=>c.payment===filterPay);
  const total = filtered.reduce((s,c)=>s+(c.price||0),0);
  const dim = getDIM(viewYear, viewMonth), first = getFirst(viewYear, viewMonth);

  const tabBtn = (id,lbl) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"8px 22px", borderRadius:"9px", border:"none", cursor:"pointer",
      background:tab===id?`linear-gradient(135deg,${C.blue},${C.blueM})`:"rgba(255,255,255,0.04)",
      color:tab===id?"#fff":C.muted,
      fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"12px", letterSpacing:"1px",
      transition:"all 0.2s", boxShadow:tab===id?`0 4px 14px ${C.accentGlow}`:"none",
    }}>{lbl}</button>
  );

  return (
    <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"32px clamp(12px,3vw,32px) 60px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"16px", marginBottom:"28px" }}>
        <div>
          <div style={{ fontSize:"10px", letterSpacing:"5px", color:C.blueL, fontWeight:700, marginBottom:"6px", fontFamily:"'Gill Sans',sans-serif" }}>PANEL DE RECEPCIÓN</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:"clamp(24px,5vw,38px)", fontWeight:700, margin:0, color:"#fff", letterSpacing:"1px" }}>
            Gestión de Cobros
          </h2>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>{tabBtn("grilla","★ Grilla")}{tabBtn("resumen","◆ Resumen")}</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"28px" }}>
        {[
          { label:"Turnos hoy",    value:Object.keys(dayBookings(todayKey)).length, icon:"★", color:C.blueXL },
          { label:"Cobros hoy",    value:todayCobros.length, icon:"✓", color:C.green },
          { label:"Recaudado hoy", value:`$${todayTotal.toLocaleString("es-AR")}`, icon:"◆", color:C.blueL },
        ].map(s=>(
          <div key={s.label} style={{ ...glassCard, padding:"20px" }}>
            <div style={{ fontSize:"22px", marginBottom:"8px", color:s.color }}>{s.icon}</div>
            <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:"28px", fontWeight:700, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:C.muted, letterSpacing:"2px", marginTop:"2px", fontFamily:"'Gill Sans',sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {tab==="grilla" && (
        <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:"20px", alignItems:"start" }}>
          <div style={{ ...glassCard, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <NavBtn onClick={()=>{ if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); }}>‹</NavBtn>
              <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"15px", color:"#e8f0ff" }}>{MONTH_SHORT[viewMonth]} {viewYear}</span>
              <NavBtn onClick={()=>{ if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); }}>›</NavBtn>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"4px" }}>
              {DAY_NAMES.map(d=><div key={d} style={{ textAlign:"center", fontSize:"9px", color:C.muted, fontWeight:700, padding:"2px 0", fontFamily:"'Gill Sans',sans-serif" }}>{d}</div>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
              {Array.from({length:first}).map((_,i)=><div key={`e${i}`}/>)}
              {Array.from({length:dim}).map((_,i)=>{
                const day=i+1, dk=toDK(viewYear,viewMonth,day);
                const isSel=dk===selDate, isToday=dk===toDK(today.getFullYear(),today.getMonth(),today.getDate());
                const hasTurnos=Object.keys(dayBookings(dk)).length>0;
                const hasCobros=!!(cobros[dk]&&Object.keys(cobros[dk]).length);
                return (
                  <button key={day} onClick={()=>setSelDate(dk)} style={{
                    aspectRatio:"1", borderRadius:"6px", border:"none",
                    background:isSel?`linear-gradient(135deg,${C.blue},${C.blueM})`:isToday?"rgba(30,70,200,0.22)":"rgba(255,255,255,0.03)",
                    color:isSel?"#fff":isToday?C.blueXL:"#aac",
                    cursor:"pointer", fontSize:"11px", fontWeight:isSel||isToday?700:400,
                    position:"relative", outline:"none", transition:"all 0.15s",
                    border:isToday&&!isSel?`1px solid rgba(40,100,200,0.45)`:"1px solid transparent",
                    fontFamily:"'Gill Sans',sans-serif",
                  }}>
                    {day}
                    {hasTurnos&&!isSel&&<div style={{ position:"absolute", bottom:"2px", left:"50%", transform:"translateX(-50%)", width:"3px", height:"3px", borderRadius:"50%", background:hasCobros?C.green:C.blueL }}/>}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:"12px", borderTop:`1px solid ${C.border}`, paddingTop:"10px" }}>
              <MiniLegend color={C.blueL} label="Turno pendiente"/>
              <MiniLegend color={C.green}  label="Con cobro registrado"/>
            </div>
          </div>

          <div>
            <div style={{ marginBottom:"14px" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"20px", fontWeight:700, color:"#fff" }}>{fmtDate(selDate)}</div>
              <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px", fontFamily:"'Gill Sans',sans-serif", letterSpacing:"1px" }}>Click en un turno para registrar el cobro</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:"9px" }}>
              {HOURS.map(hour=>{
                const bk=dayBookings(selDate)[hour], cob=cobros[selDate]?.[hour];
                return (
                  <div key={hour} style={{
                    ...glassCard, padding:"13px",
                    border:`1px solid ${cob?"rgba(52,211,153,0.28)":bk?"rgba(30,80,200,0.35)":"rgba(255,255,255,0.04)"}`,
                    background:cob?"rgba(52,211,153,0.05)":bk?"rgba(20,55,180,0.08)":"rgba(255,255,255,0.01)",
                    opacity:!bk?0.4:1, cursor:bk?"pointer":"default", transition:"all 0.15s",
                  }}
                  onClick={()=>bk&&openModal(selDate,hour,bk)}
                  onMouseEnter={e=>{ if(bk) e.currentTarget.style.border=`1px solid ${cob?C.green:C.blueL}`; }}
                  onMouseLeave={e=>{ if(bk) e.currentTarget.style.border=`1px solid ${cob?"rgba(52,211,153,0.28)":"rgba(30,80,200,0.35)"}`; }}
                  >
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"16px", color:cob?C.green:bk?C.blueXL:"#2a3a5a", marginBottom:"5px" }}>{hour}</div>
                    {!bk ? <div style={{ fontSize:"10px", color:"#1a2a40", letterSpacing:"2px", fontFamily:"'Gill Sans',sans-serif" }}>LIBRE</div> : (
                      <>
                        <div style={{ fontWeight:600, fontSize:"12px", color:"#e8f0ff", marginBottom:"2px", fontFamily:"'Gill Sans',sans-serif" }}>{bk.name}</div>
                        <div style={{ fontSize:"11px", color:C.muted }}>{SERVICES.find(s=>s.id===bk.service)?.icon} {SERVICES.find(s=>s.id===bk.service)?.label}</div>
                        {cob ? (
                          <div style={{ marginTop:"6px", borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:"5px" }}>
                            <div style={{ fontSize:"11px", color:C.green, fontWeight:700 }}>✓ ${cob.price?.toLocaleString("es-AR")}</div>
                            <div style={{ fontSize:"10px", color:C.muted }}>✂ {cob.barber}</div>
                          </div>
                        ) : <div style={{ marginTop:"6px" }}><span style={{ fontSize:"10px", background:"rgba(20,60,180,0.2)", color:C.blueXL, padding:"3px 8px", borderRadius:"5px", fontWeight:600, fontFamily:"'Gill Sans',sans-serif", letterSpacing:"1px" }}>COBRAR →</span></div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab==="resumen" && (
        <div>
          <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"20px", flexWrap:"wrap" }}>
            <div style={{ fontSize:"10px", color:C.muted, fontWeight:700, letterSpacing:"3px", fontFamily:"'Gill Sans',sans-serif" }}>FILTRAR:</div>
            {["Todos",...PAYMENT_METHODS.map(p=>p.id)].map(p=>{
              const pm=PAYMENT_METHODS.find(x=>x.id===p);
              return (
                <button key={p} onClick={()=>setFilterPay(p)} style={{
                  padding:"6px 14px", borderRadius:"7px", border:"none", cursor:"pointer",
                  background:filterPay===p?`linear-gradient(135deg,${C.blue},${C.blueM})`:"rgba(255,255,255,0.04)",
                  color:filterPay===p?"#fff":C.muted,
                  fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"12px", transition:"all 0.15s",
                }}>{pm?`${pm.icon} ${pm.label}`:"Todos"}</button>
              );
            })}
            <div style={{ marginLeft:"auto", textAlign:"right" }}>
              <div style={{ fontSize:"10px", color:C.muted, letterSpacing:"3px", fontFamily:"'Gill Sans',sans-serif" }}>TOTAL FILTRADO</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"32px", fontWeight:700, color:C.blueL }}>${total.toLocaleString("es-AR")}</div>
            </div>
          </div>
          {filtered.length===0 ? (
            <div style={{ ...glassCard, padding:"60px", textAlign:"center", color:C.muted, fontFamily:"'Cormorant Garamond',serif", fontSize:"18px" }}>
              ★ Sin cobros registrados aún
            </div>
          ) : (
            <div style={{ ...glassCard, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {["Fecha","Hora","Cliente","Servicio","Peluquero","Pago","Precio"].map(h=>(
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:"10px", letterSpacing:"2px", color:C.muted, fontWeight:700, fontFamily:"'Gill Sans',sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c,i)=>(
                    <tr key={i} style={{ borderBottom:i<filtered.length-1?`1px solid rgba(30,70,200,0.08)`:"none", transition:"background 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(20,55,180,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <td style={tdStyle}>{fmtDate(c.date)}</td>
                      <td style={tdStyle}><span style={{ color:C.blueXL, fontWeight:700, fontFamily:"'Cormorant Garamond',serif" }}>{c.time}</span></td>
                      <td style={tdStyle}>{c.client}</td>
                      <td style={tdStyle}>{SERVICES.find(s=>s.id===c.service)?.icon} {SERVICES.find(s=>s.id===c.service)?.label||c.service}</td>
                      <td style={tdStyle}><span style={{ color:"#e8f0ff", fontWeight:600 }}>✂ {c.barber}</span></td>
                      <td style={tdStyle}><span style={{ background:"rgba(20,60,180,0.15)", borderRadius:"5px", padding:"3px 9px", fontSize:"12px" }}>{PAYMENT_METHODS.find(p=>p.id===c.payment)?.icon} {PAYMENT_METHODS.find(p=>p.id===c.payment)?.label||c.payment}</span></td>
                      <td style={{ ...tdStyle, color:C.green, fontWeight:700, fontFamily:"'Cormorant Garamond',serif", fontSize:"15px" }}>${(c.price||0).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function AppWithModal() {
  const today = new Date();
  const todayKey = toDK(today.getFullYear(), today.getMonth(), today.getDate());

  const [bookings, setBookings]         = useState({});
  const [cobros, setCobros]             = useState({});
  const [view, setView]                 = useState("client");
  const [recepAuth, setRecepAuth]       = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [modal, setModal]               = useState(null);
  const [form, setForm]                 = useState({ barber:"", payment:"", price:"" });
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    const b = localStorage.getItem(BOOKINGS_KEY);
    const c = localStorage.getItem(COBROS_KEY);
    if (b) setBookings(JSON.parse(b));
    if (c) setCobros(JSON.parse(c));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const b = localStorage.getItem(BOOKINGS_KEY);
      if (b) setBookings(JSON.parse(b));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const saveBookings = u => { setBookings(u); localStorage.setItem(BOOKINGS_KEY, JSON.stringify(u)); };
  const saveCobrosF  = u => { setCobros(u);   localStorage.setItem(COBROS_KEY, JSON.stringify(u)); };

  const openModal = (dateKey, time, booking) => {
    const ex = cobros[dateKey]?.[time] || {};
    setForm({ barber:ex.barber||"", payment:ex.payment||"", price:ex.price||"" });
    setModal({ dateKey, time, booking });
    setSaved(false);
  };

  const handleSave = () => {
    if (!form.barber||!form.payment||!form.price) return;
    const u = { ...cobros, [modal.dateKey]: { ...(cobros[modal.dateKey]||{}), [modal.time]: { ...form, price:parseFloat(form.price) } } };
    saveCobrosF(u); setSaved(true);
    setTimeout(()=>setModal(null), 900);
  };

  const handleNavClick = v => {
    if (v==="receptionist" && !recepAuth) setShowPinModal(true);
    else setView(v);
  };

  if (showPinModal) return <PinLogin onSuccess={()=>{ setRecepAuth(true); setShowPinModal(false); setView("receptionist"); }} onBack={()=>setShowPinModal(false)}/>;

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(160deg, ${C.bg0} 0%, ${C.bg1} 55%, ${C.bg2} 100%)`,
      fontFamily:"'Gill Sans','Trebuchet MS',sans-serif",
      color: C.text, overflowX:"hidden", position:"relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`* { box-sizing: border-box; } input::placeholder{color:rgba(100,140,200,0.4);}`}</style>

      <StarBg/>

      <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", zIndex:20,
        background:`linear-gradient(90deg,transparent,${C.blue},${C.blueL},${C.blueM},transparent)`
      }}/>

      {/* NAV */}
      <nav style={{
        position:"sticky", top:0, zIndex:15,
        background:"rgba(2,8,22,0.9)", backdropFilter:"blur(24px)",
        borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 clamp(16px,4vw,52px)", height:"66px",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <LogoMark size={38}/>
          <div>
            <div style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontWeight:700, fontSize:"20px", color:"#e8f0ff", letterSpacing:"3px" }}>V12 STUDIO</div>
            <div style={{ fontSize:"9px", color:C.muted, letterSpacing:"4px", lineHeight:1, fontFamily:"'Gill Sans',sans-serif" }}>BARBER SHOP</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ display:"flex", gap:"4px", background:"rgba(255,255,255,0.03)", borderRadius:"11px", padding:"4px" }}>
            <button onClick={()=>handleNavClick("client")} style={{
              padding:"7px 20px", borderRadius:"8px", border:"none", cursor:"pointer",
              background:view==="client"?`linear-gradient(135deg,${C.blue},${C.blueM})`:"transparent",
              color:view==="client"?"#fff":C.muted,
              fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"12px", letterSpacing:"1px",
              transition:"all 0.2s", boxShadow:view==="client"?`0 4px 16px ${C.accentGlow}`:"none",
            }}>✂ TURNOS</button>
            <button onClick={()=>handleNavClick("receptionist")} style={{
              padding:"7px 20px", borderRadius:"8px", border:"none", cursor:"pointer",
              background:view==="receptionist"?`linear-gradient(135deg,${C.blue},${C.blueM})`:"transparent",
              color:view==="receptionist"?"#fff":C.muted,
              fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"12px", letterSpacing:"1px",
              transition:"all 0.2s", boxShadow:view==="receptionist"?`0 4px 16px ${C.accentGlow}`:"none",
            }}>{recepAuth?"★ RECEPCIÓN":"🔒 RECEPCIÓN"}</button>
          </div>
          {recepAuth && (
            <button onClick={()=>{ setRecepAuth(false); setView("client"); }} style={{
              padding:"7px 14px", borderRadius:"8px", border:`1px solid rgba(255,80,80,0.25)`,
              background:"rgba(255,60,60,0.07)", color:"rgba(255,120,120,0.8)",
              cursor:"pointer", fontFamily:"'Gill Sans',sans-serif", fontWeight:600, fontSize:"11px", letterSpacing:"1px",
            }}>SALIR</button>
          )}
        </div>
      </nav>

      <div style={{ position:"relative", zIndex:1 }}>
        {view==="client" ? (
          <ClientView today={today} todayKey={todayKey} bookings={bookings} saveBookings={saveBookings}/>
        ) : (
          <ReceptionistViewInner today={today} todayKey={todayKey} bookings={bookings} cobros={cobros} openModal={openModal}/>
        )}
      </div>

      <CobroModal modal={modal} form={form} setForm={setForm} saved={saved} onSave={handleSave} onClose={()=>setModal(null)}/>
    </div>
  );
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────
function GlassCard({ children }) {
  return <div style={{ ...glassCard, padding:"26px" }}>{children}</div>;
}
function SectionTitle({ icon, children }) {
  return (
    <div style={{ marginBottom:"20px" }}>
      <h2 style={{ fontFamily:"'Cormorant Garamond','Georgia',serif", fontSize:"22px", fontWeight:700, margin:0, color:"#e8f0ff", display:"flex", alignItems:"center", gap:"10px", letterSpacing:"1px" }}>
        <span style={{ color:C.blueL }}>{icon}</span>{children}
      </h2>
    </div>
  );
}
function FieldLabel({ children }) {
  return <div style={{ fontSize:"10px", fontWeight:700, letterSpacing:"3px", color:C.blueL, marginBottom:"10px", fontFamily:"'Gill Sans',sans-serif" }}>{children}</div>;
}
const ModalLabel = FieldLabel;
function NavBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`,
      color:C.muted, width:"32px", height:"32px", borderRadius:"8px",
      cursor:"pointer", fontSize:"18px", display:"flex", alignItems:"center", justifyContent:"center",
      outline:"none", transition:"all 0.15s",
    }}
    onMouseEnter={e=>e.currentTarget.style.background="rgba(20,60,200,0.22)"}
    onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
    >{children}</button>
  );
}
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"none", color:C.blueXL, cursor:"pointer",
      fontSize:"12px", fontWeight:600, padding:"0 0 16px",
      display:"flex", alignItems:"center", gap:"6px", outline:"none", letterSpacing:"2px",
      fontFamily:"'Gill Sans',sans-serif",
    }}>← VOLVER</button>
  );
}
function PrimaryBtn({ children, onClick, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:"100%", padding:"15px", borderRadius:"13px", border:"none",
      background:!disabled?`linear-gradient(135deg,${C.blue},${C.blueM})`:"rgba(255,255,255,0.04)",
      color:!disabled?"#fff":"rgba(255,255,255,0.2)",
      cursor:!disabled?"pointer":"not-allowed",
      fontSize:"13px", fontWeight:700, letterSpacing:"2px",
      transition:"all 0.2s", outline:"none",
      boxShadow:!disabled?`0 8px 28px ${C.accentGlow}`:"none",
      fontFamily:"'Gill Sans',sans-serif",
      ...style,
    }}>{children}</button>
  );
}
function StyledInput({ value, onChange, placeholder, style }) {
  return (
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{
      width:"100%", padding:"13px 15px",
      background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`,
      borderRadius:"11px", color:"#e8f0ff", fontSize:"15px",
      outline:"none", boxSizing:"border-box", transition:"border-color 0.2s",
      fontFamily:"'Gill Sans','Trebuchet MS',sans-serif",
      ...style,
    }}
    onFocus={e=>e.target.style.borderColor=C.blueM}
    onBlur={e=>e.target.style.borderColor=C.border}
    />
  );
}
function InfoRow({ label, value, last }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:last?"none":`1px solid rgba(255,255,255,0.06)` }}>
      <span style={{ color:C.muted, fontSize:"13px", fontFamily:"'Gill Sans',sans-serif" }}>{label}</span>
      <span style={{ color:"#e8f0ff", fontSize:"14px", fontWeight:600, fontFamily:"'Cormorant Garamond',serif" }}>{value}</span>
    </div>
  );
}
function MiniLegend({ color, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px" }}>
      <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:color }}/>
      <span style={{ fontSize:"10px", color:C.muted, fontFamily:"'Gill Sans',sans-serif" }}>{label}</span>
    </div>
  );
}
const tdStyle = { padding:"12px 16px", fontSize:"13px", color:"#9ab0cc", verticalAlign:"middle", fontFamily:"'Gill Sans',sans-serif" };
