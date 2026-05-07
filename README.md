<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg0:#020a18;--bg1:#041022;--bg2:#061530;
  --card:rgba(4,16,40,0.88);--border:rgba(40,90,200,0.2);
  --borderH:rgba(80,140,255,0.45);--blue:#1a4fc4;--blueM:#2d6be4;
  --blueL:#5090f0;--blueXL:#90bfff;--accent:#4080e8;
  --accentGlow:rgba(64,128,232,0.3);--green:#34d399;
  --text:#d8e8ff;--muted:#4a6890;
}
body{font-family:'Gill Sans','Trebuchet MS',sans-serif;color:var(--text);background:linear-gradient(160deg,var(--bg0) 0%,var(--bg1) 55%,var(--bg2) 100%);min-height:100vh;overflow-x:hidden;}
input::placeholder{color:rgba(100,140,200,0.4);}
.glass{background:var(--card);backdrop-filter:blur(28px);border:1px solid var(--border);border-radius:20px;box-shadow:0 8px 48px rgba(0,0,0,0.5),inset 0 1px 0 rgba(80,140,255,0.07);}
@keyframes floatStar{0%,100%{transform:translateY(0) rotate(-12deg)}50%{transform:translateY(-8px) rotate(-12deg)}}
@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(10px)}45%{transform:translateX(-8px)}60%{transform:translateX(8px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}}
@keyframes pulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div id="app"></div>
<script>
// ── Constants ──────────────────────────────────────────────────────────────
const HOURS=["12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
const SERVICES=[{id:"corte",label:"Corte",icon:"✂️",duration:"30 min"},{id:"barba",label:"Barba",icon:"🪒",duration:"20 min"},{id:"combo",label:"Corte + Barba",icon:"💈",duration:"50 min"},{id:"tenido",label:"Teñido",icon:"🎨",duration:"60 min"}];
const PAYMENTS=[{id:"efectivo",label:"Efectivo",icon:"💵"},{id:"transferencia",label:"Transferencia",icon:"📲"},{id:"debito",label:"Débito",icon:"💳"},{id:"credito",label:"Crédito",icon:"💳"},{id:"mercadopago",label:"Mercado Pago",icon:"🔵"}];
const MONTH_NAMES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTH_SHORT=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const DAY_NAMES=["Do","Lu","Ma","Mi","Ju","Vi","Sá"];
const DAY_FULL=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const RECEP_CODE="V12studio24";

// ── Firebase Config ─────────────────────────────────────────────────────────
// IMPORTANTE: Reemplazá estos valores con los de tu proyecto Firebase
// Creá uno gratis en https://console.firebase.google.com
const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  databaseURL: "https://TU_PROJECT-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT_ID",
};

// ── Storage (Firebase Realtime DB o localStorage fallback) ─────────────────
let db = null;
let useFirebase = false;

async function initFirebase() {
  try {
    // Intentar cargar Firebase dinámicamente
    await loadScript("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
    await loadScript("https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js");
    if (FIREBASE_CONFIG.apiKey !== "TU_API_KEY") {
      firebase.initializeApp(FIREBASE_CONFIG);
      db = firebase.database();
      useFirebase = true;
      // Escuchar cambios en tiempo real
      db.ref("v12_bookings").on("value", snap => {
        if (snap.exists()) setState({ bookings: snap.val() });
      });
      db.ref("v12_cobros").on("value", snap => {
        if (snap.exists()) setState({ cobros: snap.val() });
      });
    }
  } catch(e) {
    console.log("Firebase no disponible, usando localStorage");
  }
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function storageGet(key) {
  if (useFirebase) {
    const snap = await db.ref(key).get();
    return snap.exists() ? snap.val() : null;
  }
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
}

async function storageSet(key, val) {
  if (useFirebase) {
    await db.ref(key).set(val);
  } else {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function toDK(y,m,d){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function parseDK(dk){const[y,m,d]=dk.split("-");return new Date(+y,+m-1,+d);}
function fmtDate(dk){if(!dk)return"";const dt=parseDK(dk);const[,m,d]=dk.split("-");return`${DAY_FULL[dt.getDay()]} ${d} de ${MONTH_NAMES[+m-1]}`;}
function getDIM(y,m){return new Date(y,m+1,0).getDate();}
function getFirst(y,m){return new Date(y,m,1).getDay();}
const today=new Date();
const todayKey=toDK(today.getFullYear(),today.getMonth(),today.getDate());

// ── App State ────────────────────────────────────────────────────────────────
let state={
  bookings:{},cobros:{},
  view:"client",recepAuth:false,showPin:false,
  step:"calendar",viewMonth:today.getMonth(),viewYear:today.getFullYear(),
  selDate:null,selTime:null,selSvc:null,name:"",phone:"",lastBooking:null,
  recepTab:"grilla",recepViewMonth:today.getMonth(),recepViewYear:today.getFullYear(),recepSelDate:todayKey,filterPay:"Todos",
  modal:null,modalForm:{barber:"",payment:"",price:""},modalSaved:false,
  pinCode:"",pinShake:false,pinShow:false,pinTries:0,
  loading:true,syncing:false,
};

// ── Render engine ────────────────────────────────────────────────────────────
function setState(patch){Object.assign(state,typeof patch==="function"?patch(state):patch);render();}
function el(tag,attrs,...children){
  const e=document.createElement(tag);
  if(attrs)Object.entries(attrs).forEach(([k,v])=>{
    if(k==="style"&&typeof v==="object")Object.assign(e.style,v);
    else if(k.startsWith("on")&&typeof v==="function")e.addEventListener(k.slice(2).toLowerCase(),v);
    else if(k==="className")e.className=v;
    else e.setAttribute(k,v);
  });
  children.flat(Infinity).forEach(c=>{if(c==null||c===false)return;e.appendChild(typeof c==="string"?document.createTextNode(c):c);});
  return e;
}

// ── Data Load & Save ─────────────────────────────────────────────────────────
async function loadData(){
  await initFirebase();
  if (!useFirebase) {
    // Sin Firebase, cargar desde localStorage
    const[b,c]=await Promise.all([storageGet("v12_bookings"),storageGet("v12_cobros")]);
    setState({bookings:b||{},cobros:c||{},loading:false});
    // Polling cada 10s para sincronización entre pestañas (mismo dispositivo)
    setInterval(async()=>{
      const[b,c]=await Promise.all([storageGet("v12_bookings"),storageGet("v12_cobros")]);
      if(b||c)setState({bookings:b||state.bookings,cobros:c||state.cobros});
    },10000);
  } else {
    setState({loading:false});
  }
}

async function saveBookings(updated){
  setState({bookings:updated,syncing:true});
  await storageSet("v12_bookings",updated);
  setState({syncing:false});
}
async function saveCobros(updated){
  setState({cobros:updated,syncing:true});
  await storageSet("v12_cobros",updated);
  setState({syncing:false});
}

// ── SVG Star Background ──────────────────────────────────────────────────────
function StarBg(){
  return el("div",{style:{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}},
    el("div",{style:{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 60% at 50% 50%,rgba(20,60,180,0.13) 0%,transparent 65%),radial-gradient(ellipse 40% 35% at 80% 15%,rgba(30,80,200,0.09) 0%,transparent 55%),radial-gradient(ellipse 30% 30% at 10% 85%,rgba(20,60,180,0.06) 0%,transparent 50%)"}}),
  );
}

// ── Logo ─────────────────────────────────────────────────────────────────────
function LogoMark(size=36){
  const ns="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(ns,"svg");
  svg.setAttribute("viewBox","0 0 40 40");svg.setAttribute("width",size);svg.setAttribute("height",size);
  svg.innerHTML=`<defs><linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8ab4f8"/><stop offset="50%" stop-color="#4080e8"/><stop offset="100%" stop-color="#1a4fc4"/></linearGradient><filter id="gf"><feGaussianBlur stdDeviation="1.5" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="20,2 24.5,13.5 37,13.5 27,20.5 30.5,32 20,25.5 9.5,32 13,20.5 3,13.5 15.5,13.5" fill="none" stroke="url(#sg)" stroke-width="2.2" filter="url(#gf)"/><text x="20" y="20" text-anchor="middle" dominant-baseline="middle" fill="#c0d8ff" font-size="8" font-weight="700" font-family="Georgia,serif" filter="url(#gf)">V12</text>`;
  return svg;
}

// ── Sync indicator ────────────────────────────────────────────────────────────
function SyncBadge(){
  const label = useFirebase ? (state.syncing ? "↻ GUARDANDO..." : "🔥 FIREBASE EN VIVO") : (state.syncing ? "↻ GUARDANDO..." : "☁ LOCAL");
  const color = useFirebase ? (state.syncing ? "var(--blueL)" : "var(--green)") : "var(--muted)";
  return el("span",{style:{fontSize:"10px",color,letterSpacing:"2px",fontFamily:"Gill Sans,sans-serif"}},label);
}

// ── PIN LOGIN ─────────────────────────────────────────────────────────────────
function renderPin(){
  const div=el("div",{style:{minHeight:"100vh",background:"linear-gradient(160deg,var(--bg0) 0%,var(--bg1) 55%,var(--bg2) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",position:"relative",overflow:"hidden"}},
    StarBg(),
    el("div",{className:"glass",style:{width:"100%",maxWidth:"420px",padding:"48px 40px",textAlign:"center",position:"relative",zIndex:1,animation:state.pinShake?"shake 0.5s ease":"fadeUp 0.5s ease"}},
      el("div",{style:{marginBottom:"28px",animation:"pulse 3s ease-in-out infinite"}},LogoMark(64)),
      el("div",{style:{fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:700,fontSize:"32px",color:"#e8f0ff",letterSpacing:"2px",marginBottom:"4px"}},"V12 STUDIO"),
      el("div",{style:{fontSize:"11px",color:"var(--muted)",letterSpacing:"5px",marginBottom:"36px"}},"BARBER SHOP · RECEPCIÓN"),
      el("div",{style:{fontSize:"12px",color:"var(--blueXL)",marginBottom:"10px",textAlign:"left",fontWeight:500,letterSpacing:"2px"}},"CÓDIGO DE ACCESO"),
      el("div",{style:{position:"relative",marginBottom:state.pinTries>0?"8px":"20px"}},
        el("input",{type:state.pinShow?"text":"password",value:state.pinCode,placeholder:"••••••••••",autofocus:true,
          style:{width:"100%",padding:"14px 48px 14px 16px",background:"rgba(255,255,255,0.04)",border:`1px solid ${state.pinShake?"rgba(255,80,80,0.6)":"var(--border)"}`,borderRadius:"12px",color:"#fff",fontSize:"18px",letterSpacing:state.pinShow?"2px":"6px",outline:"none",boxSizing:"border-box"},
          oninput:e=>setState({pinCode:e.target.value}),
          onkeydown:e=>{if(e.key==="Enter")submitPin();},
        }),
        el("button",{onclick:()=>setState({pinShow:!state.pinShow}),style:{position:"absolute",right:"14px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:"18px"}},state.pinShow?"🙈":"👁"),
      ),
      state.pinTries>0?el("div",{style:{fontSize:"12px",color:"#ff7070",marginBottom:"12px",textAlign:"left"}},"✕ Código incorrecto."):null,
      el("button",{onclick:submitPin,style:{width:"100%",padding:"15px",borderRadius:"12px",border:"none",cursor:"pointer",background:"linear-gradient(135deg,var(--blue),var(--accent))",color:"#fff",fontWeight:700,fontSize:"14px",letterSpacing:"3px",boxShadow:"0 8px 28px var(--accentGlow)",marginBottom:"16px"}},"INGRESAR →"),
      el("button",{onclick:()=>setState({showPin:false}),style:{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:"12px",letterSpacing:"2px"}},"← VOLVER"),
    )
  );
  return div;
}
function submitPin(){
  if(state.pinCode===RECEP_CODE){setState({recepAuth:true,showPin:false,view:"receptionist",pinCode:"",pinTries:0});}
  else{setState({pinShake:true,pinTries:state.pinTries+1,pinCode:""});setTimeout(()=>setState({pinShake:false}),600);}
}

// ── COBRO MODAL ───────────────────────────────────────────────────────────────
function CobroModal(){
  const{modal,modalForm,modalSaved}=state;
  if(!modal)return null;
  const bk=modal.booking,svc=SERVICES.find(s=>s.id===bk.service);
  const ready=modalForm.barber&&modalForm.payment&&modalForm.price;
  const overlay=el("div",{style:{position:"fixed",inset:0,zIndex:100,background:"rgba(1,6,18,0.92)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"},onclick:e=>{if(e.target===overlay)setState({modal:null});}},
    el("div",{className:"glass",style:{padding:"36px",width:"100%",maxWidth:"460px",boxShadow:"0 40px 80px rgba(0,0,0,0.7)",position:"relative"}},
      el("div",{style:{marginBottom:"26px"}},
        el("div",{style:{fontSize:"10px",letterSpacing:"4px",color:"var(--blueL)",fontWeight:700,marginBottom:"8px"}},"REGISTRAR COBRO"),
        el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"24px",fontWeight:700,color:"#fff"}},bk.name),
        el("div",{style:{fontSize:"13px",color:"var(--muted)",marginTop:"4px"}},`${modal.time} · ${svc?.icon} ${svc?.label}`),
      ),
      el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"PELUQUERO"),
      el("input",{type:"text",value:modalForm.barber,placeholder:"Nombre del peluquero",oninput:e=>setState({modalForm:{...modalForm,barber:e.target.value}}),style:{width:"100%",padding:"13px 15px",background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:"11px",color:"#e8f0ff",fontSize:"15px",outline:"none",boxSizing:"border-box",marginBottom:"20px"}}),
      el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"MEDIO DE PAGO"),
      el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px",marginBottom:"20px"}},
        ...PAYMENTS.map(p=>el("button",{onclick:()=>setState({modalForm:{...modalForm,payment:p.id}}),style:{padding:"9px 6px",borderRadius:"9px",border:"none",cursor:"pointer",background:modalForm.payment===p.id?"linear-gradient(135deg,var(--blue),var(--accent))":"rgba(255,255,255,0.04)",color:modalForm.payment===p.id?"#fff":"var(--muted)",fontWeight:600,fontSize:"12px",transition:"all .15s"}},`${p.icon} ${p.label}`))
      ),
      el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"MONTO"),
      el("div",{style:{position:"relative",marginBottom:"28px"}},
        el("span",{style:{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",color:"var(--blueL)",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"22px"}},"$"),
        el("input",{type:"number",value:modalForm.price,placeholder:"0",oninput:e=>setState({modalForm:{...modalForm,price:e.target.value}}),style:{width:"100%",padding:"14px 14px 14px 38px",background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:"11px",color:"#fff",fontSize:"24px",fontFamily:"'Cormorant Garamond',serif",fontWeight:700,outline:"none",boxSizing:"border-box"}}),
      ),
      el("div",{style:{display:"flex",gap:"10px"}},
        el("button",{onclick:()=>setState({modal:null}),style:{flex:1,padding:"13px",borderRadius:"10px",border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",fontWeight:600,fontSize:"13px"}},"Cancelar"),
        el("button",{onclick:saveCobro,disabled:!ready,style:{flex:2,padding:"13px",borderRadius:"10px",border:"none",cursor:ready?"pointer":"not-allowed",background:modalSaved?"var(--green)":ready?"linear-gradient(135deg,var(--blue),var(--accent))":"rgba(255,255,255,0.04)",color:modalSaved?"#000":ready?"#fff":"#444",fontWeight:700,fontSize:"14px",letterSpacing:"1px",transition:"all .2s"}},modalSaved?"✓ GUARDADO":"GUARDAR COBRO"),
      ),
    )
  );
  return overlay;
}
async function saveCobro(){
  const{modal,modalForm,cobros}=state;
  if(!modalForm.barber||!modalForm.payment||!modalForm.price)return;
  const updated={...cobros,[modal.dateKey]:{...(cobros[modal.dateKey]||{}),[modal.time]:{...modalForm,price:parseFloat(modalForm.price)}}};
  setState({modalSaved:true});
  await saveCobros(updated);
  setTimeout(()=>setState({modal:null,modalSaved:false}),900);
}

// ── CLIENT VIEW ───────────────────────────────────────────────────────────────
function ClientView(){
  const{step,viewMonth,viewYear,selDate,selTime,selSvc,name,phone,lastBooking,bookings}=state;
  const dayBk=dk=>bookings[dk]||{};
  const taken=(dk,t)=>!!dayBk(dk)[t];
  const freeSlots=selDate?HOURS.filter(h=>!taken(selDate,h)).length:0;
  const dim=getDIM(viewYear,viewMonth),first=getFirst(viewYear,viewMonth);

  const wrap=el("div",{style:{maxWidth:"520px",margin:"0 auto",padding:"clamp(20px,4vw,44px) 16px 60px"}});
  const logoWrap=el("div",{style:{display:"flex",justifyContent:"center",marginBottom:"20px"}});
  const floatDiv=el("div",{style:{animation:"floatStar 4s ease-in-out infinite"}});floatDiv.appendChild(LogoMark(72));logoWrap.appendChild(floatDiv);
  const h1=el("h1",{style:{fontFamily:"'Cormorant Garamond',Georgia,serif",fontWeight:700,fontSize:"clamp(42px,12vw,72px)",margin:"0 0 4px",lineHeight:0.95,letterSpacing:"4px",background:"linear-gradient(135deg,#fff 0%,var(--blueXL) 40%,var(--blueL) 70%,#fff 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"shimmer 6s linear infinite"}},"V12 STUDIO");
  const hero=el("div",{style:{textAlign:"center",marginBottom:"40px"}},logoWrap,h1,
    el("div",{style:{fontSize:"11px",color:"var(--muted)",letterSpacing:"6px",marginTop:"10px"}},"BARBER SHOP"),
    el("div",{style:{width:"60px",height:"1px",background:"linear-gradient(90deg,transparent,var(--blueM),transparent)",margin:"14px auto 0"}}),
    el("p",{style:{color:"var(--muted)",fontSize:"11px",letterSpacing:"3px",marginTop:"14px"}},"RESERVÁ TU TURNO · MAR A SÁB · 12–20 HS"),
  );
  wrap.appendChild(hero);

  if(step==="calendar"){
    const card=el("div",{className:"glass",style:{padding:"26px",animation:"fadeUp .38s ease"}});
    card.appendChild(el("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:700,color:"#e8f0ff",marginBottom:"20px"}},"★ Elegí el día"));
    const nav=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}});
    nav.appendChild(navBtn("‹",()=>{if(viewMonth===0)setState({viewMonth:11,viewYear:viewYear-1});else setState({viewMonth:viewMonth-1});}));
    nav.appendChild(el("span",{style:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"19px",color:"#e8f0ff"}},`${MONTH_NAMES[viewMonth]} ${viewYear}`));
    nav.appendChild(navBtn("›",()=>{if(viewMonth===11)setState({viewMonth:0,viewYear:viewYear+1});else setState({viewMonth:viewMonth+1});}));
    card.appendChild(nav);
    const grid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",marginBottom:"8px"}});
    DAY_NAMES.forEach(d=>grid.appendChild(el("div",{style:{textAlign:"center",fontSize:"10px",color:"var(--muted)",fontWeight:700,letterSpacing:"1px",padding:"3px 0"}},d)));
    card.appendChild(grid);
    const dGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px"}});
    for(let i=0;i<first;i++)dGrid.appendChild(el("div",{}));
    for(let i=0;i<dim;i++){
      const day=i+1,dk=toDK(viewYear,viewMonth,day);
      const dt=new Date(viewYear,viewMonth,day),tm=new Date(today.getFullYear(),today.getMonth(),today.getDate());
      const isPast=dt<tm,dow=dt.getDay(),isClosed=dow===0||dow===1,isDisabled=isPast||isClosed;
      const isToday=dk===todayKey,hasTurnos=Object.keys(dayBk(dk)).length>0,isSel=dk===selDate;
      const btn=el("button",{onclick:()=>{if(!isDisabled){setState({selDate:dk,selTime:null,selSvc:null,name:"",phone:"",step:"time"});}},
        style:{aspectRatio:"1",borderRadius:"9px",border:isToday&&!isSel?"1px solid rgba(40,100,200,0.5)":"1px solid transparent",background:isSel?"linear-gradient(135deg,var(--blue),var(--blueM))":isToday?"rgba(30,70,200,0.22)":isDisabled?"transparent":"rgba(255,255,255,0.03)",color:isDisabled?"rgba(255,255,255,0.12)":isSel?"#fff":isToday?"var(--blueXL)":"var(--text)",cursor:isDisabled?"not-allowed":"pointer",fontSize:"13px",fontWeight:isSel||isToday?700:400,position:"relative",outline:"none",transition:"all .15s",textDecoration:isClosed&&!isPast?"line-through":"none",boxShadow:isSel?"0 4px 18px var(--accentGlow)":"none"}},
        String(day));
      if(hasTurnos&&!isDisabled){const dot=el("div",{style:{position:"absolute",bottom:"3px",left:"50%",transform:"translateX(-50%)",width:"3px",height:"3px",borderRadius:"50%",background:isSel?"#fff":"var(--blueL)"}});btn.appendChild(dot);}
      dGrid.appendChild(btn);
    }
    card.appendChild(dGrid);
    card.appendChild(el("div",{style:{marginTop:"16px",padding:"10px 14px",background:"rgba(30,70,200,0.07)",borderRadius:"10px",fontSize:"11px",color:"var(--muted)",textAlign:"center"}},"★ Días con turnos agendados · Dom y Lun cerrado"));
    wrap.appendChild(card);
  }

  if(step==="time"&&selDate){
    const card=el("div",{className:"glass",style:{padding:"26px",animation:"fadeUp .38s ease"}});
    card.appendChild(backBtn(()=>setState({step:"calendar"})));
    card.appendChild(el("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:700,color:"#e8f0ff",marginBottom:"8px"}},`★ ${fmtDate(selDate)}`));
    card.appendChild(el("div",{style:{color:"var(--blueL)",fontSize:"12px",marginBottom:"22px",fontWeight:600,letterSpacing:"2px"}},`${freeSlots} HORARIOS DISPONIBLES`));
    card.appendChild(el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"SERVICIO"));
    const sGrid=el("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"26px"}});
    SERVICES.forEach(s=>{
      const b=el("button",{onclick:()=>setState({selSvc:s.id}),style:{padding:"16px 10px",borderRadius:"14px",border:selSvc===s.id?"1px solid var(--blueL)":"1px solid rgba(255,255,255,0.07)",cursor:"pointer",background:selSvc===s.id?"linear-gradient(135deg,var(--blue),var(--blueM))":"rgba(255,255,255,0.04)",color:selSvc===s.id?"#fff":"var(--muted)",outline:"none",transition:"all .18s",boxShadow:selSvc===s.id?"0 6px 22px var(--accentGlow)":"none"}},
        el("div",{style:{fontSize:"24px",marginBottom:"6px"}},s.icon),
        el("div",{style:{fontWeight:700,fontSize:"13px",letterSpacing:"0.5px"}},s.label),
        el("div",{style:{fontSize:"11px",opacity:0.6,marginTop:"3px"}},s.duration),
      );
      sGrid.appendChild(b);
    });
    card.appendChild(sGrid);
    card.appendChild(el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"HORARIO"));
    const hGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px"}});
    HOURS.forEach(h=>{
      const isTaken=taken(selDate,h),isSel=selTime===h;
      hGrid.appendChild(el("button",{onclick:()=>{if(!isTaken)setState({selTime:h});},disabled:isTaken,style:{padding:"10px 4px",borderRadius:"9px",border:isSel?"1px solid var(--blueL)":"1px solid rgba(255,255,255,0.07)",background:isSel?"linear-gradient(135deg,var(--blue),var(--blueM))":isTaken?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.04)",color:isTaken?"rgba(255,255,255,0.15)":isSel?"#fff":"var(--text)",cursor:isTaken?"not-allowed":"pointer",fontSize:"13px",fontWeight:isSel?700:400,textDecoration:isTaken?"line-through":"none",outline:"none",transition:"all .15s",boxShadow:isSel?"0 4px 14px var(--accentGlow)":"none"}},h));
    });
    card.appendChild(hGrid);
    const cont=primaryBtn("Continuar →",()=>{if(selTime&&selSvc)setState({step:"form"});},!selTime||!selSvc);
    cont.style.marginTop="26px";
    card.appendChild(cont);
    wrap.appendChild(card);
  }

  if(step==="form"&&selDate){
    const svc=SERVICES.find(s=>s.id===selSvc);
    const card=el("div",{className:"glass",style:{padding:"26px",animation:"fadeUp .38s ease"}});
    card.appendChild(backBtn(()=>setState({step:"time"})));
    card.appendChild(el("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"22px",fontWeight:700,color:"#e8f0ff",marginBottom:"20px"}},"★ Tus datos"));
    card.appendChild(el("div",{style:{background:"rgba(20,60,180,0.1)",border:"1px solid rgba(40,100,200,0.25)",borderRadius:"14px",padding:"16px",marginBottom:"24px"}},
      el("div",{style:{fontSize:"10px",color:"var(--blueL)",fontWeight:700,letterSpacing:"3px",marginBottom:"8px"}},"RESUMEN"),
      el("div",{style:{fontSize:"14px",color:"#fff",fontFamily:"'Cormorant Garamond',serif"}},`★ ${fmtDate(selDate)} · ${selTime}`),
      el("div",{style:{fontSize:"14px",color:"#fff",marginTop:"5px",fontFamily:"'Cormorant Garamond',serif"}},`${svc?.icon} ${svc?.label}`),
    ));
    card.appendChild(el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"TU NOMBRE"));
    card.appendChild(el("input",{type:"text",value:name,placeholder:"Nombre completo",oninput:e=>setState({name:e.target.value}),style:{width:"100%",padding:"13px 15px",background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:"11px",color:"#e8f0ff",fontSize:"15px",outline:"none",boxSizing:"border-box",marginBottom:"16px"}}));
    card.appendChild(el("div",{style:{fontSize:"10px",fontWeight:700,letterSpacing:"3px",color:"var(--blueL)",marginBottom:"10px"}},"TELÉFONO (OPCIONAL)"));
    card.appendChild(el("input",{type:"text",value:phone,placeholder:"Ej: 11 1234-5678",oninput:e=>setState({phone:e.target.value}),style:{width:"100%",padding:"13px 15px",background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",borderRadius:"11px",color:"#e8f0ff",fontSize:"15px",outline:"none",boxSizing:"border-box",marginBottom:"26px"}}));
    card.appendChild(primaryBtn("✓ Confirmar turno",handleConfirm,!name.trim()));
    wrap.appendChild(card);
  }

  if(step==="confirm"&&lastBooking){
    const svc=SERVICES.find(s=>s.id===lastBooking.service);
    const card=el("div",{className:"glass",style:{padding:"26px",animation:"fadeUp .38s ease",textAlign:"center"}});
    const ns="http://www.w3.org/2000/svg";
    const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 80 80");svg.setAttribute("width","80");svg.setAttribute("height","80");svg.setAttribute("style","animation:floatStar 3s ease-in-out infinite;margin:0 auto 22px;display:block");
    svg.innerHTML=`<defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5090f0"/><stop offset="100%" stop-color="#1a4fc4"/></linearGradient><filter id="gf2"><feGaussianBlur stdDeviation="3" result="cb"/><feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><polygon points="40,4 48,28 74,28 53,44 61,68 40,54 19,68 27,44 6,28 32,28" fill="url(#cg)" filter="url(#gf2)" opacity="0.9"/><text x="40" y="43" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="18" font-weight="700">✓</text>`;
    card.appendChild(svg);
    card.appendChild(el("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",fontWeight:700,color:"#fff",letterSpacing:"1px",marginBottom:"6px"}},"¡Turno confirmado!"));
    card.appendChild(el("p",{style:{color:"var(--muted)",fontSize:"14px",marginBottom:"28px"}},`Te esperamos, ${lastBooking.name}`));
    const box=el("div",{style:{background:"rgba(20,60,180,0.1)",border:"1px solid rgba(40,100,200,0.25)",borderRadius:"14px",padding:"18px",textAlign:"left",marginBottom:"22px"}});
    [["★ Fecha",fmtDate(lastBooking.date)],["◷ Hora",lastBooking.time],["✂ Servicio",svc?.label],["◆ Nombre",lastBooking.name]].forEach(([l,v],i,a)=>{
      box.appendChild(el("div",{style:{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:i<a.length-1?"1px solid rgba(255,255,255,0.06)":"none"}},
        el("span",{style:{color:"var(--muted)",fontSize:"13px"}},l),
        el("span",{style:{color:"#e8f0ff",fontSize:"14px",fontWeight:600,fontFamily:"'Cormorant Garamond',serif"}},v),
      ));
    });
    card.appendChild(box);
    card.appendChild(el("button",{onclick:()=>setState({step:"calendar",selDate:null,selTime:null,selSvc:null,name:"",phone:"",lastBooking:null}),style:{width:"100%",padding:"13px",borderRadius:"12px",border:"1px solid rgba(40,100,200,0.35)",background:"rgba(20,60,180,0.1)",color:"var(--blueXL)",cursor:"pointer",fontWeight:600,fontSize:"13px",letterSpacing:"2px"}},"AGENDAR OTRO TURNO"));
    wrap.appendChild(card);
  }

  return wrap;
}

async function handleConfirm(){
  const{name,phone,selDate,selTime,selSvc,bookings}=state;
  if(!name.trim()||!selTime||!selSvc)return;
  const updated={...bookings,[selDate]:{...(bookings[selDate]||{}),[selTime]:{name:name.trim(),phone:phone.trim(),service:selSvc}}};
  await saveBookings(updated);
  setState({lastBooking:{date:selDate,time:selTime,service:selSvc,name:name.trim()},step:"confirm"});
}

// ── RECEPTIONIST VIEW ─────────────────────────────────────────────────────────
function ReceptionistView(){
  const{recepTab,recepViewMonth,recepViewYear,recepSelDate,bookings,cobros,filterPay}=state;
  const dayBk=dk=>bookings[dk]||{};
  const todayCobros=Object.values(cobros[todayKey]||{});
  const todayTotal=todayCobros.reduce((s,c)=>s+(c.price||0),0);
  const dim=getDIM(recepViewYear,recepViewMonth),first=getFirst(recepViewYear,recepViewMonth);

  const wrap=el("div",{style:{maxWidth:"1100px",margin:"0 auto",padding:"32px clamp(12px,3vw,32px) 60px"}});

  const hdr=el("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"16px",marginBottom:"28px"}});
  hdr.appendChild(el("div",{},
    el("div",{style:{fontSize:"10px",letterSpacing:"5px",color:"var(--blueL)",fontWeight:700,marginBottom:"6px"}},"PANEL DE RECEPCIÓN"),
    el("h2",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,5vw,38px)",fontWeight:700,margin:0,color:"#fff"}},"Gestión de Cobros"),
  ));
  const tabs=el("div",{style:{display:"flex",gap:"8px",alignItems:"center"}});
  ["grilla","resumen"].forEach(t=>{
    tabs.appendChild(el("button",{onclick:()=>setState({recepTab:t}),style:{padding:"8px 22px",borderRadius:"9px",border:"none",cursor:"pointer",background:recepTab===t?"linear-gradient(135deg,var(--blue),var(--blueM))":"rgba(255,255,255,0.04)",color:recepTab===t?"#fff":"var(--muted)",fontWeight:600,fontSize:"12px",letterSpacing:"1px",transition:"all .2s",boxShadow:recepTab===t?"0 4px 14px var(--accentGlow)":"none"}},t==="grilla"?"★ Grilla":"◆ Resumen"));
  });
  hdr.appendChild(tabs);
  wrap.appendChild(hdr);

  const stats=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"28px"}});
  [{label:"Turnos hoy",value:Object.keys(dayBk(todayKey)).length,icon:"★",color:"var(--blueXL)"},{label:"Cobros hoy",value:todayCobros.length,icon:"✓",color:"var(--green)"},{label:"Recaudado hoy",value:`$${todayTotal.toLocaleString("es-AR")}`,icon:"◆",color:"var(--blueL)"}].forEach(s=>{
    stats.appendChild(el("div",{className:"glass",style:{padding:"20px"}},
      el("div",{style:{fontSize:"22px",marginBottom:"8px",color:s.color}},s.icon),
      el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"28px",fontWeight:700,color:s.color}},String(s.value)),
      el("div",{style:{fontSize:"11px",color:"var(--muted)",letterSpacing:"2px",marginTop:"2px"}},s.label),
    ));
  });
  wrap.appendChild(stats);

  if(recepTab==="grilla"){
    const grid=el("div",{style:{display:"grid",gridTemplateColumns:"240px 1fr",gap:"20px",alignItems:"start"}});
    const cal=el("div",{className:"glass",style:{padding:"16px"}});
    const cn=el("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}});
    cn.appendChild(navBtn("‹",()=>{if(recepViewMonth===0)setState({recepViewMonth:11,recepViewYear:recepViewYear-1});else setState({recepViewMonth:recepViewMonth-1});}));
    cn.appendChild(el("span",{style:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"15px",color:"#e8f0ff"}},`${MONTH_SHORT[recepViewMonth]} ${recepViewYear}`));
    cn.appendChild(navBtn("›",()=>{if(recepViewMonth===11)setState({recepViewMonth:0,recepViewYear:recepViewYear+1});else setState({recepViewMonth:recepViewMonth+1});}));
    cal.appendChild(cn);
    const dnh=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}});
    DAY_NAMES.forEach(d=>dnh.appendChild(el("div",{style:{textAlign:"center",fontSize:"9px",color:"var(--muted)",fontWeight:700,padding:"2px 0"}},d)));
    cal.appendChild(dnh);
    const dg=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}});
    for(let i=0;i<first;i++)dg.appendChild(el("div",{}));
    for(let i=0;i<dim;i++){
      const day=i+1,dk=toDK(recepViewYear,recepViewMonth,day);
      const isSel=dk===recepSelDate,isToday=dk===todayKey;
      const hasTurnos=Object.keys(dayBk(dk)).length>0,hasCobros=!!(cobros[dk]&&Object.keys(cobros[dk]).length);
      const b=el("button",{onclick:()=>setState({recepSelDate:dk}),style:{aspectRatio:"1",borderRadius:"6px",border:isToday&&!isSel?"1px solid rgba(40,100,200,0.45)":"1px solid transparent",background:isSel?"linear-gradient(135deg,var(--blue),var(--blueM))":isToday?"rgba(30,70,200,0.22)":"rgba(255,255,255,0.03)",color:isSel?"#fff":isToday?"var(--blueXL)":"#aac",cursor:"pointer",fontSize:"11px",fontWeight:isSel||isToday?700:400,position:"relative",outline:"none",transition:"all .15s"}},String(day));
      if(hasTurnos&&!isSel){const dot=el("div",{style:{position:"absolute",bottom:"2px",left:"50%",transform:"translateX(-50%)",width:"3px",height:"3px",borderRadius:"50%",background:hasCobros?"var(--green)":"var(--blueL)"}});b.appendChild(dot);}
      dg.appendChild(b);
    }
    cal.appendChild(dg);
    cal.appendChild(el("div",{style:{marginTop:"12px",borderTop:"1px solid var(--border)",paddingTop:"10px"}},
      miniLegend("var(--blueL)","Turno pendiente"),
      miniLegend("var(--green)","Con cobro registrado"),
    ));
    grid.appendChild(cal);

    const right=el("div",{});
    right.appendChild(el("div",{style:{marginBottom:"14px"}},
      el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"20px",fontWeight:700,color:"#fff"}},fmtDate(recepSelDate)),
      el("div",{style:{fontSize:"11px",color:"var(--muted)",marginTop:"2px",letterSpacing:"1px"}},"Click en un turno para registrar el cobro"),
    ));
    const sGrid=el("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:"9px"}});
    HOURS.forEach(hour=>{
      const bk=dayBk(recepSelDate)[hour],cob=cobros[recepSelDate]?.[hour];
      const svc=SERVICES.find(s=>s.id===bk?.service);
      const card=el("div",{className:"glass",
        style:{padding:"13px",border:`1px solid ${cob?"rgba(52,211,153,0.28)":bk?"rgba(30,80,200,0.35)":"rgba(255,255,255,0.04)"}`,background:cob?"rgba(52,211,153,0.05)":bk?"rgba(20,55,180,0.08)":"rgba(255,255,255,0.01)",opacity:!bk?0.4:1,cursor:bk?"pointer":"default",transition:"all .15s"},
        onclick:()=>{
          if(!bk)return;
          const ex=cobros[recepSelDate]?.[hour]||{};
          setState({modal:{dateKey:recepSelDate,time:hour,booking:bk},modalForm:{barber:ex.barber||"",payment:ex.payment||"",price:ex.price||""},modalSaved:false});
        },
      });
      card.appendChild(el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"16px",color:cob?"var(--green)":bk?"var(--blueXL)":"#2a3a5a",marginBottom:"5px"}},hour));
      if(!bk){card.appendChild(el("div",{style:{fontSize:"10px",color:"#1a2a40",letterSpacing:"2px"}},"LIBRE"));}
      else{
        card.appendChild(el("div",{style:{fontWeight:600,fontSize:"12px",color:"#e8f0ff",marginBottom:"2px"}},bk.name));
        card.appendChild(el("div",{style:{fontSize:"11px",color:"var(--muted)"}},`${svc?.icon} ${svc?.label}`));
        if(cob){
          card.appendChild(el("div",{style:{marginTop:"6px",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:"5px"}},
            el("div",{style:{fontSize:"11px",color:"var(--green)",fontWeight:700}},`✓ $${cob.price?.toLocaleString("es-AR")}`),
            el("div",{style:{fontSize:"10px",color:"var(--muted)"}},`✂ ${cob.barber}`),
          ));
        }else{
          card.appendChild(el("span",{style:{fontSize:"10px",background:"rgba(20,60,180,0.2)",color:"var(--blueXL)",padding:"3px 8px",borderRadius:"5px",fontWeight:600,letterSpacing:"1px",display:"inline-block",marginTop:"6px"}},"COBRAR →"));
        }
      }
      sGrid.appendChild(card);
    });
    right.appendChild(sGrid);
    grid.appendChild(right);
    wrap.appendChild(grid);
  }

  if(recepTab==="resumen"){
    const allCobros=Object.entries(cobros).flatMap(([date,times])=>
      Object.entries(times).map(([time,data])=>({date,time,client:bookings[date]?.[time]?.name||"—",service:bookings[date]?.[time]?.service||"—",...data}))
    ).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
    const filtered=filterPay==="Todos"?allCobros:allCobros.filter(c=>c.payment===filterPay);
    const total=filtered.reduce((s,c)=>s+(c.price||0),0);
    const fRow=el("div",{style:{display:"flex",gap:"10px",alignItems:"center",marginBottom:"20px",flexWrap:"wrap"}});
    fRow.appendChild(el("div",{style:{fontSize:"10px",color:"var(--muted)",fontWeight:700,letterSpacing:"3px"}},"FILTRAR:"));
    ["Todos",...PAYMENTS.map(p=>p.id)].forEach(p=>{
      const pm=PAYMENTS.find(x=>x.id===p);
      fRow.appendChild(el("button",{onclick:()=>setState({filterPay:p}),style:{padding:"6px 14px",borderRadius:"7px",border:"none",cursor:"pointer",background:filterPay===p?"linear-gradient(135deg,var(--blue),var(--blueM))":"rgba(255,255,255,0.04)",color:filterPay===p?"#fff":"var(--muted)",fontWeight:600,fontSize:"12px",transition:"all .15s"}},pm?`${pm.icon} ${pm.label}`:"Todos"));
    });
    fRow.appendChild(el("div",{style:{marginLeft:"auto",textAlign:"right"}},
      el("div",{style:{fontSize:"10px",color:"var(--muted)",letterSpacing:"3px"}},"TOTAL FILTRADO"),
      el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontSize:"32px",fontWeight:700,color:"var(--blueL)"}},`$${total.toLocaleString("es-AR")}`),
    ));
    wrap.appendChild(fRow);
    if(filtered.length===0){wrap.appendChild(el("div",{className:"glass",style:{padding:"60px",textAlign:"center",color:"var(--muted)",fontFamily:"'Cormorant Garamond',serif",fontSize:"18px"}},"★ Sin cobros registrados aún"));}
    else{
      const table=el("div",{className:"glass",style:{overflow:"hidden"}});
      const t=document.createElement("table");t.style.cssText="width:100%;border-collapse:collapse;";
      const thead=document.createElement("thead");
      const hr=document.createElement("tr");hr.style.borderBottom="1px solid var(--border)";
      ["Fecha","Hora","Cliente","Servicio","Peluquero","Pago","Precio"].forEach(h=>{const th=document.createElement("th");th.style.cssText="padding:12px 16px;text-align:left;font-size:10px;letter-spacing:2px;color:var(--muted);font-weight:700;";th.textContent=h;hr.appendChild(th);});
      thead.appendChild(hr);t.appendChild(thead);
      const tbody=document.createElement("tbody");
      filtered.forEach((c,i)=>{
        const tr=document.createElement("tr");
        tr.style.borderBottom=i<filtered.length-1?"1px solid rgba(30,70,200,0.08)":"none";
        tr.onmouseenter=()=>tr.style.background="rgba(20,55,180,0.06)";
        tr.onmouseleave=()=>tr.style.background="transparent";
        const svc=SERVICES.find(s=>s.id===c.service);
        const pm=PAYMENTS.find(p=>p.id===c.payment);
        [
          {v:fmtDate(c.date)},{v:c.time,color:"var(--blueXL)",bold:true,serif:true},
          {v:c.client},{v:`${svc?.icon||""} ${svc?.label||c.service}`},
          {v:`✂ ${c.barber}`,color:"#e8f0ff",bold:true},
          {v:pm?`${pm.icon} ${pm.label}`:c.payment,badge:true},
          {v:`$${(c.price||0).toLocaleString("es-AR")}`,color:"var(--green)",bold:true,serif:true,big:true},
        ].forEach(cell=>{
          const td=document.createElement("td");
          td.style.cssText="padding:12px 16px;font-size:13px;color:#9ab0cc;vertical-align:middle;";
          if(cell.color)td.style.color=cell.color;
          if(cell.bold)td.style.fontWeight="700";
          if(cell.serif)td.style.fontFamily="'Cormorant Garamond',serif";
          if(cell.big)td.style.fontSize="15px";
          if(cell.badge){const s=document.createElement("span");s.style.cssText="background:rgba(20,60,180,0.15);border-radius:5px;padding:3px 9px;font-size:12px;";s.textContent=cell.v;td.appendChild(s);}
          else td.textContent=cell.v;
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      t.appendChild(tbody);table.appendChild(t);wrap.appendChild(table);
    }
  }

  return wrap;
}

// ── UI helpers ─────────────────────────────────────────────────────────────────
function navBtn(label,onclick){
  const b=el("button",{onclick,style:{background:"rgba(255,255,255,0.04)",border:"1px solid var(--border)",color:"var(--muted)",width:"32px",height:"32px",borderRadius:"8px",cursor:"pointer",fontSize:"18px",display:"flex",alignItems:"center",justifyContent:"center",outline:"none",transition:"all .15s"}},label);
  b.onmouseenter=()=>b.style.background="rgba(20,60,200,0.22)";
  b.onmouseleave=()=>b.style.background="rgba(255,255,255,0.04)";
  return b;
}
function backBtn(onclick){return el("button",{onclick,style:{background:"none",border:"none",color:"var(--blueXL)",cursor:"pointer",fontSize:"12px",fontWeight:600,padding:"0 0 16px",display:"flex",alignItems:"center",gap:"6px",outline:"none",letterSpacing:"2px"}},"← VOLVER");}
function primaryBtn(text,onclick,disabled){
  return el("button",{onclick,disabled,style:{width:"100%",padding:"15px",borderRadius:"13px",border:"none",background:!disabled?"linear-gradient(135deg,var(--blue),var(--blueM))":"rgba(255,255,255,0.04)",color:!disabled?"#fff":"rgba(255,255,255,0.2)",cursor:!disabled?"pointer":"not-allowed",fontSize:"13px",fontWeight:700,letterSpacing:"2px",transition:"all .2s",outline:"none",boxShadow:!disabled?"0 8px 28px var(--accentGlow)":"none"}},text);
}
function miniLegend(color,label){
  return el("div",{style:{display:"flex",alignItems:"center",gap:"7px",marginBottom:"5px"}},
    el("div",{style:{width:"7px",height:"7px",borderRadius:"50%",background:color}}),
    el("span",{style:{fontSize:"10px",color:"var(--muted)"}},label),
  );
}

// ── MAIN RENDER ───────────────────────────────────────────────────────────────
function render(){
  const app=document.getElementById("app");app.innerHTML="";
  if(state.showPin){app.appendChild(renderPin());return;}

  if(state.loading){
    app.appendChild(el("div",{style:{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"20px"}},
      el("div",{style:{width:"40px",height:"40px",border:"3px solid rgba(64,128,232,0.2)",borderTop:"3px solid var(--blueM)",borderRadius:"50%",animation:"spin 1s linear infinite"}}),
      el("div",{style:{color:"var(--muted)",fontSize:"12px",letterSpacing:"4px"}},"CARGANDO TURNOS..."),
    ));
    return;
  }

  app.appendChild(StarBg());
  app.appendChild(el("div",{style:{position:"fixed",top:0,left:0,right:0,height:"2px",zIndex:20,background:"linear-gradient(90deg,transparent,var(--blue),var(--blueL),var(--blueM),transparent)"}}));

  const nav=el("nav",{style:{position:"sticky",top:0,zIndex:15,background:"rgba(2,8,22,0.9)",backdropFilter:"blur(24px)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 clamp(16px,4vw,52px)",height:"66px"}});
  const logo=el("div",{style:{display:"flex",alignItems:"center",gap:"14px"}});
  logo.appendChild(LogoMark(38));
  logo.appendChild(el("div",{},
    el("div",{style:{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:"20px",color:"#e8f0ff",letterSpacing:"3px"}},"V12 STUDIO"),
    el("div",{style:{fontSize:"9px",color:"var(--muted)",letterSpacing:"4px",lineHeight:1}},"BARBER SHOP"),
  ));
  nav.appendChild(logo);
  const navR=el("div",{style:{display:"flex",alignItems:"center",gap:"8px"}});
  navR.appendChild(SyncBadge());
  const tabsNav=el("div",{style:{display:"flex",gap:"4px",background:"rgba(255,255,255,0.03)",borderRadius:"11px",padding:"4px"}});
  ["client","receptionist"].forEach(v=>{
    const lbl=v==="client"?"✂ TURNOS":(state.recepAuth?"★ RECEPCIÓN":"🔒 RECEPCIÓN");
    tabsNav.appendChild(el("button",{onclick:()=>{if(v==="receptionist"&&!state.recepAuth)setState({showPin:true});else setState({view:v});},style:{padding:"7px 20px",borderRadius:"8px",border:"none",cursor:"pointer",background:state.view===v?"linear-gradient(135deg,var(--blue),var(--blueM))":"transparent",color:state.view===v?"#fff":"var(--muted)",fontWeight:600,fontSize:"12px",letterSpacing:"1px",transition:"all .2s",boxShadow:state.view===v?"0 4px 16px var(--accentGlow)":"none"}},lbl));
  });
  navR.appendChild(tabsNav);
  if(state.recepAuth){navR.appendChild(el("button",{onclick:()=>setState({recepAuth:false,view:"client"}),style:{padding:"7px 14px",borderRadius:"8px",border:"1px solid rgba(255,80,80,0.25)",background:"rgba(255,60,60,0.07)",color:"rgba(255,120,120,0.8)",cursor:"pointer",fontWeight:600,fontSize:"11px",letterSpacing:"1px"}},"SALIR"));}
  nav.appendChild(navR);
  app.appendChild(nav);

  const content=el("div",{style:{position:"relative",zIndex:1}});
  content.appendChild(state.view==="client"?ClientView():ReceptionistView());
  app.appendChild(content);

  const modal=CobroModal();
  if(modal)app.appendChild(modal);

  app.appendChild(el("div",{style:{position:"fixed",bottom:"10px",right:"16px",fontSize:"10px",color:"rgba(50,100,200,0.3)",letterSpacing:"4px",zIndex:5}},"V12 STUDIO © 2025"));
}

// ── Boot ───────────────────────────────────────────────────────────────────────
loadData();
</script>
</body>
</html>
