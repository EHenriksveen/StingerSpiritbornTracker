import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronRight, CircleHelp, CloudOff, Download,
  Filter, Flame, Home, PackageCheck, RotateCcw, Search, Settings,
  Share, ShieldCheck, Smartphone, Swords, Target, Upload, X
} from "lucide-react";
const Button = ({ className = "", children, ...props }) => (
  <button
    className={`inline-flex items-center justify-center px-4 py-2 font-medium transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Card = ({ className = "", children, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardContent = ({ className = "", children, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full rounded-xl px-3 py-2 outline-none transition focus:border-emerald-400/50 ${className}`}
    {...props}
  />
);

const STORAGE_KEY = "stinger-spiritborn-pwa-v3";

const gear = [
  {
    id: "kepeleke", name: "Rod of Kepeleke", slot: "Våpen", tier: "S", boss: "Duriel / Andariel",
    note: "Prioriteres først. Byggets viktigste våpen.",
    affixes: ["Maximum Vigor", "Core Skill Damage", "Critical Strike Damage", "Resource Generation"]
  },
  {
    id: "midnight-sun", name: "Ring of the Midnight Sun", slot: "Ring", tier: "S", boss: "Astaroth",
    note: "Viktig for stabil Vigor og jevn rotasjon.",
    affixes: ["Critical Strike Chance", "Maximum Vigor", "Lucky Hit Chance", "Attack Speed"]
  },
  {
    id: "ebewaka", name: "Harmony of Ebewaka", slot: "Hjelm", tier: "A", boss: "Bartuc / Grigoire",
    note: "Stor skadeøkning når resten av oppsettet fungerer.",
    affixes: ["Ranks to Core Skills", "Maximum Life", "Critical Strike Chance", "Resource Cost Reduction"]
  }
];

const bosses = [
  { id: "duriel", name: "Duriel", targets: ["Rod of Kepeleke"], color: "from-amber-500 to-orange-700" },
  { id: "andariel", name: "Andariel", targets: ["Rod of Kepeleke"], color: "from-fuchsia-500 to-violet-800" },
  { id: "astaroth", name: "Astaroth", targets: ["Ring of the Midnight Sun"], color: "from-red-500 to-red-900" },
  { id: "bartuc", name: "Bartuc", targets: ["Harmony of Ebewaka"], color: "from-emerald-500 to-teal-900" },
  { id: "grigoire", name: "Grigoire", targets: ["Harmony of Ebewaka"], color: "from-cyan-500 to-blue-900" }
];

const blank = () => ({
  gear: Object.fromEntries(gear.map(g => [g.id, {
    owned: false, ancestral: false, masterwork: 0,
    affixes: Object.fromEntries(g.affixes.map(a => [a, false]))
  }])),
  materials: Object.fromEntries(bosses.map(b => [b.id, 0])),
  pit: 100,
  onlyMissing: false,
  updatedAt: new Date().toISOString()
});

function safeMerge(raw) {
  const base = blank();
  if (!raw || typeof raw !== "object") return base;
  for (const item of gear) {
    const saved = raw.gear?.[item.id] || {};
    base.gear[item.id] = {
      ...base.gear[item.id], ...saved,
      affixes: { ...base.gear[item.id].affixes, ...(saved.affixes || {}) }
    };
  }
  return {
    ...base, ...raw,
    gear: base.gear,
    materials: { ...base.materials, ...(raw.materials || {}) }
  };
}

export default function StingerSpiritbornPWA() {
  const [data, setData] = useState(blank);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("gear");
  const [query, setQuery] = useState("");
  const [installOpen, setInstallOpen] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(safeMerge(JSON.parse(saved)));
    } catch (e) { console.warn(e); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
  }, [data, ready]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const owned = gear.filter(g => data.gear[g.id]?.owned).length;
  const affixDone = gear.reduce((n, g) => n + g.affixes.filter(a => data.gear[g.id]?.affixes[a]).length, 0);
  const totalAffixes = gear.reduce((n, g) => n + g.affixes.length, 0);
  const score = Math.round(((owned * 2 + affixDone) / (gear.length * 2 + totalAffixes)) * 100);

  const visibleGear = useMemo(() => gear.filter(g => {
    const matches = [g.name, g.slot, g.boss, ...g.affixes].join(" ").toLowerCase().includes(query.toLowerCase());
    return matches && (!data.onlyMissing || !data.gear[g.id]?.owned);
  }), [query, data.onlyMissing, data.gear]);

  const updateGear = (id, patch) => setData(d => ({ ...d, gear: { ...d.gear, [id]: { ...d.gear[id], ...patch } } }));
  const toggleAffix = (id, affix) => updateGear(id, { affixes: { ...data.gear[id].affixes, [affix]: !data.gear[id].affixes[affix] } });

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "stinger-tracker-backup.json"; a.click();
    URL.revokeObjectURL(url); setToast("Backup lastet ned");
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setData(safeMerge(JSON.parse(String(reader.result)))); setToast("Backup importert"); }
      catch { setToast("Ugyldig backup-fil"); }
    };
    reader.readAsText(file); event.target.value = "";
  }

  function reset() {
    if (window.confirm("Nullstille all fremdrift og alle materialer?")) {
      setData(blank()); localStorage.removeItem(STORAGE_KEY); setToast("Fremdrift nullstilt");
    }
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 selection:bg-emerald-400/30">
      <div className="mx-auto min-h-screen max-w-md border-x border-white/5 bg-gradient-to-b from-[#101522] to-[#07090f] pb-28 shadow-2xl">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0c111c]/90 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-700 shadow-lg shadow-emerald-500/20">
                <Swords className="h-5 w-5" />
              </div>
              <div><h1 className="font-black leading-tight">Stinger Tracker</h1><p className="text-xs text-emerald-400">Spiritborn · Pit 150</p></div>
            </div>
            <button onClick={() => setInstallOpen(true)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300"><Smartphone className="h-5 w-5" /></button>
          </div>
        </header>

        <main className="px-4 py-5">
          <AnimatePresence mode="wait">
            {tab === "gear" && <motion.section key="gear" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <Card className="mb-5 overflow-hidden border-emerald-400/15 bg-gradient-to-br from-emerald-950/80 to-slate-950 text-white">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-400">Build readiness</p><p className="mt-1 text-3xl font-black">{score}%</p></div><p className="text-right text-xs text-slate-400">{owned}/{gear.length} items<br/>{affixDone}/{totalAffixes} affixes</p></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-black/40"><motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" animate={{width:`${score}%`}} /></div>
                </CardContent>
              </Card>

              <div className="mb-4 flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søk gear eller affix" className="border-white/10 bg-white/5 pl-9"/></div>
                <button onClick={()=>setData(d=>({...d,onlyMissing:!d.onlyMissing}))} className={`rounded-xl border px-3 ${data.onlyMissing?"border-emerald-400/40 bg-emerald-400/15 text-emerald-300":"border-white/10 bg-white/5 text-slate-400"}`}><Filter className="h-4 w-4"/></button>
              </div>

              <div className="space-y-4">{visibleGear.map((item, idx) => {
                const p = data.gear[item.id];
                return <motion.div key={item.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*.06}} className={`overflow-hidden rounded-3xl border ${p.owned?"border-emerald-400/40 bg-emerald-950/20":"border-white/8 bg-white/[.035]"}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3"><div><div className="mb-1 flex gap-2"><span className="rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-bold text-violet-300">{item.slot}</span><span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">{item.tier}-TIER</span></div><h2 className="text-lg font-black">{item.name}</h2><p className="mt-1 text-xs text-slate-400">{item.note}</p></div>
                      <button aria-label="Marker item" onClick={()=>updateGear(item.id,{owned:!p.owned})} className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${p.owned?"border-emerald-400 bg-emerald-400 text-slate-950":"border-white/10 bg-white/5"}`}>{p.owned?<Check className="h-6 w-6"/>:<PackageCheck className="h-5 w-5"/>}</button>
                    </div>
                    <div className="my-4 flex items-center gap-2 rounded-2xl bg-cyan-400/8 p-3 text-sm text-cyan-200"><Target className="h-4 w-4 shrink-0"/><span>Farm: <b>{item.boss}</b></span></div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Affix-prioritet</p>
                    <div className="space-y-2">{item.affixes.map((a,i)=><button key={a} onClick={()=>toggleAffix(item.id,a)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${p.affixes[a]?"border-emerald-400/30 bg-emerald-400/10 text-emerald-200":"border-white/5 bg-black/15 text-slate-300"}`}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-bold">{p.affixes[a]?<Check className="h-3.5 w-3.5"/>:i+1}</span>{a}</button>)}</div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button onClick={()=>updateGear(item.id,{ancestral:!p.ancestral})} className={`rounded-xl border p-3 text-xs font-bold ${p.ancestral?"border-violet-400/40 bg-violet-400/10 text-violet-200":"border-white/5 bg-white/[.03] text-slate-500"}`}>Ancestral {p.ancestral&&"✓"}</button>
                      <select value={p.masterwork} onChange={e=>updateGear(item.id,{masterwork:Number(e.target.value)})} className="rounded-xl border border-white/5 bg-[#101522] p-3 text-xs font-bold text-slate-300"><option value="0">MW 0/12</option><option value="4">MW 4/12</option><option value="8">MW 8/12</option><option value="12">MW 12/12</option></select>
                    </div>
                  </div>
                </motion.div>
              })}</div>
            </motion.section>}

            {tab === "farm" && <motion.section key="farm" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Boss farming</p><h2 className="mt-1 text-2xl font-black">Materialer og mål</h2><p className="mt-2 text-sm text-slate-400">Registrer hvor mange boss-runs du har klare. Loot-tabeller kan endres i patcher, så dobbeltsjekk alltid bossens visning i spillet.</p></div>
              <div className="space-y-3">{bosses.map(b=><div key={b.id} className="rounded-3xl border border-white/8 bg-white/[.035] p-4"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${b.color}`}><Flame className="h-5 w-5"/></div><div className="min-w-0 flex-1"><h3 className="font-black">{b.name}</h3><p className="truncate text-xs text-slate-400">{b.targets.join(", ")}</p></div><ChevronRight className="h-4 w-4 text-slate-600"/></div><div className="mt-4 flex items-center justify-between rounded-2xl bg-black/20 p-2"><button onClick={()=>setData(d=>({...d,materials:{...d.materials,[b.id]:Math.max(0,d.materials[b.id]-1)}}))} className="h-10 w-12 rounded-xl bg-white/5 text-xl">−</button><div className="text-center"><div className="text-2xl font-black">{data.materials[b.id]}</div><div className="text-[10px] uppercase tracking-widest text-slate-500">klare runs</div></div><button onClick={()=>setData(d=>({...d,materials:{...d.materials,[b.id]:d.materials[b.id]+1}}))} className="h-10 w-12 rounded-xl bg-emerald-400/15 text-xl text-emerald-300">+</button></div></div>)}</div>
            </motion.section>}

            {tab === "progress" && <motion.section key="progress" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Pit progress</p><h2 className="mt-1 text-2xl font-black">Veien mot 150</h2>
              <div className="mt-5 rounded-3xl border border-white/8 bg-white/[.035] p-5"><div className="text-center"><p className="text-sm text-slate-400">Høyeste fullførte Pit</p><p className="my-3 text-6xl font-black text-cyan-300">{data.pit}</p></div><input aria-label="Pit nivå" type="range" min="1" max="150" value={data.pit} onChange={e=>setData(d=>({...d,pit:Number(e.target.value)}))} className="w-full accent-cyan-400"/><div className="mt-2 flex justify-between text-xs text-slate-600"><span>1</span><span>150</span></div></div>
              <div className="mt-4 space-y-3">{[{n:100,t:"Farming-klar"},{n:120,t:"Solid endgame"},{n:135,t:"Push-oppsett"},{n:150,t:"Målet"}].map(m=><div key={m.n} className={`flex items-center gap-3 rounded-2xl border p-4 ${data.pit>=m.n?"border-cyan-400/30 bg-cyan-400/10":"border-white/5 bg-white/[.025] opacity-60"}`}><div className={`grid h-9 w-9 place-items-center rounded-full ${data.pit>=m.n?"bg-cyan-400 text-slate-950":"bg-white/5"}`}>{data.pit>=m.n?<Check className="h-5 w-5"/>:<Target className="h-4 w-4"/>}</div><div><b>Pit {m.n}</b><p className="text-xs text-slate-400">{m.t}</p></div></div>)}</div>
            </motion.section>}

            {tab === "settings" && <motion.section key="settings" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-400">Innstillinger</p><h2 className="mt-1 text-2xl font-black">Data og installasjon</h2>
              <div className="mt-5 space-y-3">
                <button onClick={()=>setInstallOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Smartphone className="h-5 w-5 text-emerald-400"/><div className="flex-1"><b>Installer på iPhone</b><p className="text-xs text-slate-400">Vis trinn-for-trinn</p></div><ChevronRight className="h-4 w-4"/></button>
                <button onClick={exportBackup} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Download className="h-5 w-5 text-cyan-400"/><div className="flex-1"><b>Eksporter backup</b><p className="text-xs text-slate-400">Last ned fremdriften som JSON</p></div></button>
                <button onClick={()=>fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Upload className="h-5 w-5 text-violet-400"/><div className="flex-1"><b>Importer backup</b><p className="text-xs text-slate-400">Gjenopprett på en annen enhet</p></div></button>
                <input ref={fileRef} type="file" accept="application/json" onChange={importBackup} className="hidden"/>
                <button onClick={reset} className="flex w-full items-center gap-3 rounded-2xl border border-red-400/15 bg-red-400/5 p-4 text-left text-red-300"><RotateCcw className="h-5 w-5"/><div><b>Nullstill alt</b><p className="text-xs text-red-300/60">Kan ikke angres uten backup</p></div></button>
              </div>
              <div className="mt-5 flex gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4"><CloudOff className="h-5 w-5 shrink-0 text-emerald-400"/><p className="text-xs leading-relaxed text-slate-400">Fremdriften lagres lokalt på enheten. Eksporter backup før du sletter nettleserdata eller bytter iPhone.</p></div>
            </motion.section>}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 border-t border-white/5 bg-[#0b0f18]/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
          {[{id:"gear",label:"Gear",icon:ShieldCheck},{id:"farm",label:"Farm",icon:Flame},{id:"progress",label:"Pit",icon:Target},{id:"settings",label:"Mer",icon:Settings}].map(x=>{const Icon=x.icon;return <button key={x.id} onClick={()=>setTab(x.id)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${tab===x.id?"bg-emerald-400/10 text-emerald-300":"text-slate-500"}`}><Icon className="h-5 w-5"/>{x.label}</button>})}
        </nav>
      </div>

      <AnimatePresence>{installOpen&&<motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setInstallOpen(false)}><motion.div initial={{y:80}} animate={{y:0}} exit={{y:80}} onClick={e=>e.stopPropagation()} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#121824] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-400">iPhone PWA</p><h3 className="text-xl font-black">Legg til på Hjem-skjermen</h3></div><button onClick={()=>setInstallOpen(false)} className="rounded-full bg-white/5 p-2"><X className="h-5 w-5"/></button></div><ol className="space-y-3">{[{i:Share,t:"Åpne Del-menyen i Safari"},{i:Home,t:"Velg «Legg til på Hjem-skjermen»"},{i:Smartphone,t:"Slå på «Åpne som nettapp» og trykk Legg til"}].map((s,i)=><li key={s.t} className="flex items-center gap-3 rounded-2xl bg-white/[.04] p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300"><s.i className="h-5 w-5"/></div><div><span className="text-[10px] uppercase text-slate-500">Trinn {i+1}</span><p className="text-sm font-bold">{s.t}</p></div></li>)}</ol><p className="mt-4 flex gap-2 text-xs text-slate-500"><CircleHelp className="h-4 w-4 shrink-0"/>Appen må først publiseres på en HTTPS-adresse. Når den er installert, åpnes den uten vanlig Safari-linje.</p><Button onClick={()=>setInstallOpen(false)} className="mt-5 w-full rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-300">Skjønner</Button></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{toast&&<motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-xl">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}