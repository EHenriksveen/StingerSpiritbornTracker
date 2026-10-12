
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ChevronRight, CircleHelp, CloudOff, Download,
  ExternalLink, Filter, Flame, Gauge, Home, PackageCheck, RotateCcw,
  Search, Settings, Share, ShieldCheck, Smartphone, Sparkles, Swords,
  Target, Upload, X, Zap
} from "lucide-react";

const Button = ({ className = "", children, ...props }) => (
  <button className={`inline-flex items-center justify-center px-4 py-2 font-medium transition ${className}`} {...props}>{children}</button>
);
const Card = ({ className = "", children, ...props }) => <div className={className} {...props}>{children}</div>;
const CardContent = ({ className = "", children, ...props }) => <div className={className} {...props}>{children}</div>;
const Input = ({ className = "", ...props }) => <input className={`w-full rounded-xl px-3 py-2 outline-none transition focus:border-emerald-400/50 ${className}`} {...props} />;

const STORAGE_KEY = "stinger-spiritborn-storms-push-v1";
const SOURCE_URL = "https://maxroll.gg/d4/build-guides/stinger-spiritborn-guide";

// TODO: legg disse filene i public/items/
const itemImage = (filename) =>
  `${import.meta.env.BASE_URL}items/${filename}`;

const ITEM_IMAGES = {
  kepeleke: itemImage("rod-of-kepeleke.webp"),
  "midnight-sun": itemImage("midnight-sun.webp"),
  starless: itemImage("starless-skies.webp"),
  ebewaka: itemImage("ebewaka.webp"),
  hesha: itemImage("hesha.webp"),
  tibault: itemImage("tibault.webp"),
  gloves: itemImage("legendary-gloves.webp"),
  amulet: itemImage("legendary-amulet.webp"),
  boots: itemImage("legendary-boots.webp"),
};


const gear = [
  {
    id: "kepeleke", name: "Rod of Kepeleke", slot: "Våpen", tier: "S", priority: 1,
    target: "Mythic-prioritet #1", farm: "Target-farm relevant boss / Mythic crafting",
    note: "Kjerneitem. Core skills critter ved full Vigor. Brukes sammen med Midnight Sun.",
    affixes: ["Best mulig unique power", "Maximum Resource / Vigor", "Critical Strike Damage", "Dexterity eller ekstra skade-multiplikator"],
    mw: "Prioriter skade-/resource-roll som gir best samlet skalering."
  },
  {
    id: "midnight-sun", name: "Ring of the Midnight Sun", slot: "Ring 1", tier: "S", priority: 2,
    target: "Mythic-prioritet #2", farm: "Target-farm relevant boss / Mythic crafting",
    note: "Ikke bruk Kepeleke-oppsettet uten denne. Du må fylle Vigor helt etter proc.",
    affixes: ["Best mulig unique power", "Critical Strike Chance", "Resource Generation til 100 % refill", "Maximum Resource / relevant skade"],
    mw: "Når ringen er Mythic, kan behovet for Resource Generation på annet gear falle bort."
  },
  {
    id: "starless", name: "Ring of Starless Skies", slot: "Ring 2", tier: "S", priority: 3,
    target: "Mythic-prioritet #3", farm: "Jeweler- eller Blacksmith-cache / Mythic-kilder",
    note: "Gir skade og Resource Cost Reduction som skalerer Kepeleke-interaksjonen.",
    affixes: ["Resource Cost Reduction", "Core Skill Damage", "Critical Strike Chance", "Attack Speed / relevant skade"],
    mw: "Prioriter Resource Cost Reduction eller sterkeste offensive roll."
  },
  {
    id: "ebewaka", name: "Harmony of Ebewaka", slot: "Hjelm", tier: "S", priority: 4,
    target: "Mythic-prioritet #4", farm: "Target-farm relevant boss",
    note: "Øker skade per Spirit-tag. Blir sterkere sammen med Berû of the Multitude.",
    affixes: ["Best mulig unique power", "Ranks", "Dexterity", "Maximum Resource / relevant skade"],
    mw: "Unique power og riktige affixes er viktigere enn en tilfeldig transfiguration."
  },
  {
    id: "hesha", name: "Hesha e Kesungi", slot: "Build-unique", tier: "A", priority: 5,
    target: "Mythic-prioritet #5", farm: "Target-farm relevant boss",
    note: "Brukes med The Protector for crowd control og stor skadeøkning.",
    affixes: ["Best mulig unique power", "Ranks", "Dexterity", "Relevant offensiv affix"],
    mw: "Prioriter build-definerende roll og skade."
  },
  {
    id: "tibault", name: "Tibault’s Will", slot: "Bukse / alternativ", tier: "A", priority: 6,
    target: "Mythic-prioritet #6", farm: "Target-farm relevant boss",
    note: "Glass-cannon-alternativ som gir skade og hjelper Vigor-refill.",
    affixes: ["Best mulig unique power", "Maximum Life", "Damage Reduction / overlevelse", "Relevant skade"],
    mw: "Velg skade for push eller defensiv roll dersom du blir one-shot."
  },
  {
    id: "gloves", name: "Legendary Gloves", slot: "Hansker", tier: "A", priority: 7,
    target: "Storms Push-statstick", farm: "Helltide, boss-loot, caches og crafting",
    note: "For bossing prioriteres All Damage fremfor ren Poison Damage.",
    affixes: ["All Damage % [x]", "Ranks to Stinger / relevant skill", "Critical Strike Chance", "Attack Speed / Dexterity"],
    mw: "Capstone helst på modifiable Lightning Damage [x], ranks eller beste offensive affix."
  },
  {
    id: "amulet", name: "Legendary Amulet", slot: "Amulett", tier: "A", priority: 8,
    target: "Dobbel aspekt/transfiguration", farm: "Helltide, boss-loot, caches og crafting",
    note: "Bruk All Damage for å støtte Nimbostratal Strike. Amuletten kan få ekstra aspekt via transfiguration.",
    affixes: ["All Damage % [x]", "Ranks", "Cooldown / relevant utility", "Dexterity / offensiv multiplikator"],
    mw: "Prioriter modifiable Lightning Damage [x], ranks eller sterkeste multiplikator."
  },
  {
    id: "boots", name: "Legendary Boots", slot: "Støvler", tier: "B", priority: 9,
    target: "Mobilitet eller defensiv swap", farm: "Helltide, boss-loot, caches og crafting",
    note: "Boss-swap: Aspect of Recalling Feathers. Ghostwalker for fart, Rallying Reversal for mer DR.",
    affixes: ["Movement Speed", "Maximum Life", "Dexterity", "Defensiv eller utility-affix"],
    mw: "Movement Speed eller defensiv roll etter behov."
  }
];

const pushSetup = {
  skills: [
    { name: "Stinger: Nimbostratal Strike", role: "Hovedangrep for Storms Push og bossing" },
    { name: "Scourge: Vulnerable", role: "Påfører Vulnerable og Weaken" },
    { name: "Toxic Skin", role: "Unhindered og støtte til rotasjonen" },
    { name: "Ravager: Flurry of Claws", role: "Cooldown Efficiency / Rate" },
    { name: "The Protector", role: "Barrier, Resolve, Unstoppable og Hesha-synergi" },
    { name: "Armored Hide: Ferocious Meal", role: "Boss-swap for Ferocity-generering" }
  ],
  spiritHall: [
    { name: "Jaguar Main Hall", detail: "Boss- og Storms Push-valg" },
    { name: "Eagle Secondary Hall", detail: "Push-oppsettets sekundærvalg" }
  ],
  mechanics: [
    "Poison fiender først, bruk så Stinger til Vigor er tom.",
    "Kepeleke og Midnight Sun må fungere som et par, med nok resource generation til full refill.",
    "Hold Ultimate aktiv for å bygge og bevare Supremacy-stacks.",
    "Prodigy’s Tempo og Ravager håndterer mesteparten av cooldown-behovet.",
    "Toxic Skin holder deg Unhindered og motvirker movement-speed-straffen fra Splinter of Pain."
  ]
};

const talisman = [
  { name: "Berû of the Multitude, 5-piece", detail: "Gir Stinger en ekstra Spirit-tag og skalerer med Harmony of Ebewaka." },
  { name: "6-slot Seal", detail: "Foretrekkes slik at du kan bruke både 5-piece-settet og Protean Heart." },
  { name: "Protean Heart", detail: "Høy prioritet. Dobler main stats, åpner bonusnoder og gir sterk skadeøkning." },
  { name: "Locran’s Talisman", detail: "Mer skade, men mindre healing og svakere tilgang til enkelte bonusnoder." }
];

const splinters = [
  { name: "Splinter of Hellfire", status: "Best", detail: "Fungerer med Rod of Kepeleke." },
  { name: "Splinter of Pain", status: "Brukbar", detail: "Fartsstraffen motvirkes av Toxic Skin mens du er Unhindered." },
  { name: "Splinter of Anguish", status: "Unngå", detail: "Skader oppsettets ytelse." },
  { name: "Splinter of Sin", status: "Unngå", detail: "Skader oppsettets ytelse." }
];

const bosses = [
  { id: "kepeleke", name: "Kepeleke-jakt", target: "Rod of Kepeleke", color: "from-amber-500 to-orange-800" },
  { id: "midnight", name: "Midnight Sun-jakt", target: "Ring of the Midnight Sun", color: "from-red-500 to-rose-900" },
  { id: "ebewaka", name: "Ebewaka-jakt", target: "Harmony of Ebewaka", color: "from-emerald-500 to-teal-900" },
  { id: "mythic", name: "Mythic-jakt", target: "Starless Skies og Mythic upgrades", color: "from-violet-500 to-indigo-900" }
];

const blank = () => ({
  gear: Object.fromEntries(gear.map(g => [g.id, {
    owned: false, mythic: false, masterwork: 0,
    affixes: Object.fromEntries(g.affixes.map(a => [a, false]))
  }])),
  checklist: Object.fromEntries([
    ...pushSetup.skills.map(x => [`skill:${x.name}`, false]),
    ...pushSetup.spiritHall.map(x => [`hall:${x.name}`, false]),
    ...talisman.map(x => [`tal:${x.name}`, false])
  ]),
  runs: Object.fromEntries(bosses.map(b => [b.id, 0])),
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
  return { ...base, ...raw, gear: base.gear, checklist: { ...base.checklist, ...(raw.checklist || {}) }, runs: { ...base.runs, ...(raw.runs || {}) } };
}

export default function StingerSpiritbornStormsPushPWA() {
  const [data, setData] = useState(blank);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("gear");
  const [query, setQuery] = useState("");
  const [installOpen, setInstallOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState({});
  const fileRef = useRef(null);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setData(safeMerge(JSON.parse(saved))); }
    catch (e) { console.warn(e); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
  }, [data, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const owned = gear.filter(g => data.gear[g.id]?.owned).length;
  const affixDone = gear.reduce((n, g) => n + g.affixes.filter(a => data.gear[g.id]?.affixes[a]).length, 0);
  const totalAffixes = gear.reduce((n, g) => n + g.affixes.length, 0);
  const setupDone = Object.values(data.checklist).filter(Boolean).length;
  const totalSetup = Object.keys(data.checklist).length;
  const mythics = gear.filter(g => data.gear[g.id]?.mythic).length;
  const gaItems = gear.filter(g => (data.gear[g.id]?.greaterAffixes || 0) > 0).length;
  const totalGA = gear.reduce((sum, g) => sum + (data.gear[g.id]?.greaterAffixes || 0), 0);
  const mw8 = gear.filter(g => (data.gear[g.id]?.masterwork || 0) >= 8).length;
  const mw12 = gear.filter(g => data.gear[g.id]?.masterwork === 12).length;
  const completion = Math.round((owned / gear.length) * 100);
  const optimizationPoints = mythics * 3 + totalGA * 2 + mw8 + mw12 * 2;
  const optimizationMax = gear.length * 3 + gear.length * 8 + gear.length + gear.length * 2;
  const optimizationBonus = Math.round((optimizationPoints / optimizationMax) * 20);
  const baseScore = Math.round(((owned * 2 + affixDone + setupDone) / (gear.length * 2 + totalAffixes + totalSetup)) * 80);
  const score = Math.min(100, baseScore + optimizationBonus);
  const visibleGear = useMemo(() => gear.filter(g => {
    const match = [g.name, g.slot, g.target, g.note, ...g.affixes].join(" ").toLowerCase().includes(query.toLowerCase());
    return match && (!data.onlyMissing || !data.gear[g.id]?.owned);
  }), [query, data.onlyMissing, data.gear]);

  const updateGear = (id, patch) => setData(d => ({ ...d, gear: { ...d.gear, [id]: { ...d.gear[id], ...patch } } }));
  const toggleAffix = (id, affix) => updateGear(id, { affixes: { ...data.gear[id].affixes, [affix]: !data.gear[id].affixes[affix] } });
  const toggleCheck = key => setData(d => ({ ...d, checklist: { ...d.checklist, [key]: !d.checklist[key] } }));

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "stinger-storms-push-backup.json"; a.click();
    URL.revokeObjectURL(url); setToast("Backup lastet ned");
  }

  function importBackup(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { setData(safeMerge(JSON.parse(String(reader.result)))); setToast("Backup importert"); } catch { setToast("Ugyldig backup-fil"); } };
    reader.readAsText(file); event.target.value = "";
  }

  function reset() {
    if (window.confirm("Nullstille all Storms Push-fremdrift?")) { setData(blank()); localStorage.removeItem(STORAGE_KEY); setToast("Fremdrift nullstilt"); }
  }

  const SetupRow = ({ item, prefix, accent = "cyan" }) => {
    const key = `${prefix}:${item.name}`;
    const checked = data.checklist[key];
    return <button onClick={() => toggleCheck(key)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${checked ? `border-${accent}-400/30 bg-${accent}-400/10` : "border-white/5 bg-white/[.03]"}`}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${checked ? "bg-emerald-400 text-slate-950" : "bg-white/5 text-slate-500"}`}>{checked ? <Check className="h-5 w-5"/> : <Target className="h-4 w-4"/>}</span>
      <span><b className="block text-sm">{item.name}</b><span className="text-xs text-slate-400">{item.role || item.detail}</span></span>
    </button>;
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 selection:bg-cyan-400/30">
      <div className="mx-auto min-h-screen max-w-md border-x border-white/5 bg-gradient-to-b from-[#101522] to-[#07090f] pb-28 shadow-2xl">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0c111c]/90 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-700 shadow-lg shadow-cyan-500/20"><Zap className="h-5 w-5"/></div>
              <div><h1 className="font-black leading-tight">Storms Push Tracker</h1><p className="text-xs text-cyan-400">Stinger Spiritborn · Pit 150</p></div>
            </div>
            <button onClick={() => setInstallOpen(true)} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300"><Smartphone className="h-5 w-5"/></button>
          </div>
        </header>

        <main className="px-4 py-5">
          <AnimatePresence mode="wait">
            {tab === "gear" && <motion.section key="gear" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <Card className="mb-5 overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-950/80 via-slate-950 to-violet-950 text-white">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Storms Push readiness</p><p className="mt-1 text-3xl font-black">{score}%</p></div><p className="text-right text-xs text-slate-400">{owned}/{gear.length} items<br/>{affixDone}/{totalAffixes} rolls<br/>{setupDone}/{totalSetup} setup</p></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-black/40"><motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" animate={{width:`${score}%`}}/></div>
                </CardContent>
              </Card>

              <div className="mb-4 flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500"/><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Søk gear eller affix" className="border border-white/10 bg-white/5 pl-9 text-white"/></div>
                <button onClick={() => setData(d => ({...d, onlyMissing: !d.onlyMissing}))} className={`rounded-xl border px-3 ${data.onlyMissing ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-300" : "border-white/10 bg-white/5 text-slate-400"}`}><Filter className="h-4 w-4"/></button>
              </div>

              <div className="space-y-4">{visibleGear.map((item, idx) => {
                const p = data.gear[item.id]; const isOpen = expanded[item.id];
                return <motion.div key={item.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:Math.min(idx*.04,.25)}} className={`overflow-hidden rounded-3xl border ${p.owned ? "border-cyan-400/40 bg-cyan-950/20" : "border-white/8 bg-white/[.035]"}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className={`relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border-2 bg-black/30 ${p.mythic ? "border-violet-400 shadow-lg shadow-violet-500/40" : item.id === "gloves" || item.id === "amulet" || item.id === "boots" ? "border-orange-400/70" : "border-amber-400/70"}`}><img src={ITEM_IMAGES[item.id]} alt={item.name} className="h-full w-full object-cover" onError={(e)=>{e.currentTarget.style.display='none'}} />{!ITEM_IMAGES[item.id] && <PackageCheck className="h-7 w-7 text-orange-300"/>}{p.greaterAffixes > 0 && <span className="absolute right-0 top-0 rounded-bl-lg bg-amber-300 px-1.5 py-0.5 text-[9px] font-black text-black">{p.greaterAffixes}GA</span>}<span className="absolute bottom-0 left-0 right-0 flex justify-center bg-black/70 py-0.5 text-[9px] text-amber-300">{"★".repeat(p.masterwork >= 12 ? 3 : p.masterwork >= 8 ? 2 : p.masterwork >= 4 ? 1 : 0)}</span></div><div><div className="mb-1 flex flex-wrap gap-2"><span className="rounded-full bg-violet-400/10 px-2 py-1 text-[10px] font-bold text-violet-300">#{item.priority} {item.slot}</span><span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] font-bold text-amber-300">{item.tier}-TIER</span></div><h2 className="text-lg font-black">{item.name}</h2><p className="mt-1 text-xs text-cyan-400">{item.target}</p></div></div>
                      <button aria-label="Marker item" onClick={() => updateGear(item.id,{owned:!p.owned})} className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${p.owned ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-white/10 bg-white/5"}`}>{p.owned ? <Check className="h-6 w-6"/> : <PackageCheck className="h-5 w-5"/>}</button>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">{item.note}</p>
                    <button onClick={() => setExpanded(e => ({...e,[item.id]:!e[item.id]}))} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-white/[.04] p-3 text-sm font-bold"><span>Affix- og masterwork-detaljer</span><ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}/></button>
                    <AnimatePresence>{isOpen && <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden"><div className="pt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Rangert affix-prioritet</p><div className="space-y-2">{item.affixes.map((a,i) => <button key={a} onClick={() => toggleAffix(item.id,a)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm ${p.affixes[a] ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200" : "border-white/5 bg-black/15 text-slate-300"}`}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-bold">{p.affixes[a] ? <Check className="h-3.5 w-3.5"/> : i+1}</span>{a}</button>)}</div><div className="mt-3 rounded-xl border border-violet-400/15 bg-violet-400/5 p-3 text-xs text-violet-200"><b>Masterwork:</b> {item.mw}</div></div></motion.div>}</AnimatePresence>
                    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => updateGear(item.id,{mythic:!p.mythic})} className={`rounded-xl border p-3 text-xs font-bold ${p.mythic ? "border-violet-400/40 bg-violet-400/10 text-violet-200" : "border-white/5 bg-white/[.03] text-slate-500"}`}>Mythic {p.mythic && "✓"}</button><select value={p.masterwork} onChange={e => updateGear(item.id,{masterwork:Number(e.target.value)})} className="rounded-xl border border-white/5 bg-[#101522] p-3 text-xs font-bold text-slate-300"><option value="0">MW 0/12</option><option value="4">MW 4/12</option><option value="8">MW 8/12</option><option value="12">MW 12/12</option></select></div>
                  </div>
                </motion.div>;
              })}</div>
            </motion.section>}

            {tab === "setup" && <motion.section key="setup" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Storms Push-oppsett</p><h2 className="mt-1 text-2xl font-black">Skills og Spirit Hall</h2><p className="mt-2 text-sm text-slate-400">Sjekk av når boss-/push-varianten er aktiv.</p>
              <h3 className="mb-3 mt-6 flex items-center gap-2 font-black"><Swords className="h-5 w-5 text-cyan-400"/> Skills</h3><div className="space-y-2">{pushSetup.skills.map(x => <SetupRow key={x.name} item={x} prefix="skill"/>)}</div>
              <h3 className="mb-3 mt-6 flex items-center gap-2 font-black"><Sparkles className="h-5 w-5 text-violet-400"/> Spirit Hall</h3><div className="space-y-2">{pushSetup.spiritHall.map(x => <SetupRow key={x.name} item={x} prefix="hall" accent="violet"/>)}</div>
              <h3 className="mb-3 mt-6 flex items-center gap-2 font-black"><Gauge className="h-5 w-5 text-amber-400"/> Rotasjon og mekanikk</h3><div className="space-y-2">{pushSetup.mechanics.map((x,i) => <div key={x} className="flex gap-3 rounded-2xl border border-white/5 bg-white/[.03] p-4"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-400/10 text-xs font-black text-amber-300">{i+1}</span><p className="text-sm text-slate-300">{x}</p></div>)}</div>
            </motion.section>}

            {tab === "farm" && <motion.section key="farm" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Farming og progresjon</p><h2 className="mt-1 text-2xl font-black">Prioritert jakt</h2><p className="mt-2 text-sm text-slate-400">Bruk tellerne som personlig logg. Kontroller alltid den aktuelle loot-tabellen i spillet før du bruker bossmaterialer.</p>
              <div className="mt-5 space-y-3">{bosses.map(b => <div key={b.id} className="rounded-3xl border border-white/8 bg-white/[.035] p-4"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${b.color}`}><Flame className="h-5 w-5"/></div><div className="min-w-0 flex-1"><h3 className="font-black">{b.name}</h3><p className="truncate text-xs text-slate-400">{b.target}</p></div></div><div className="mt-4 flex items-center justify-between rounded-2xl bg-black/20 p-2"><button onClick={() => setData(d => ({...d,runs:{...d.runs,[b.id]:Math.max(0,d.runs[b.id]-1)}}))} className="h-10 w-12 rounded-xl bg-white/5 text-xl">−</button><div className="text-center"><div className="text-2xl font-black">{data.runs[b.id]}</div><div className="text-[10px] uppercase tracking-widest text-slate-500">runs / forsøk</div></div><button onClick={() => setData(d => ({...d,runs:{...d.runs,[b.id]:d.runs[b.id]+1}}))} className="h-10 w-12 rounded-xl bg-orange-400/15 text-xl text-orange-300">+</button></div></div>)}</div>
              <h3 className="mb-3 mt-6 font-black">Splinters</h3><div className="space-y-2">{splinters.map(x => <div key={x.name} className={`rounded-2xl border p-4 ${x.status === "Unngå" ? "border-red-400/15 bg-red-400/5" : x.status === "Best" ? "border-emerald-400/20 bg-emerald-400/5" : "border-white/5 bg-white/[.03]"}`}><div className="flex justify-between gap-3"><b>{x.name}</b><span className="text-xs font-black uppercase text-slate-400">{x.status}</span></div><p className="mt-1 text-xs text-slate-400">{x.detail}</p></div>)}</div>
            </motion.section>}

            {tab === "progress" && <motion.section key="progress" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-400">Pit og Talisman</p><h2 className="mt-1 text-2xl font-black">Veien mot 150</h2><div className="mt-5 rounded-3xl border border-white/8 bg-white/[.035] p-5"><div className="text-center"><p className="text-sm text-slate-400">Høyeste fullførte Pit</p><p className="my-3 text-6xl font-black text-violet-300">{data.pit}</p></div><input aria-label="Pit nivå" type="range" min="1" max="150" value={data.pit} onChange={e => setData(d => ({...d,pit:Number(e.target.value)}))} className="w-full accent-violet-400"/><div className="mt-2 flex justify-between text-xs text-slate-600"><span>1</span><span>150</span></div></div>
              <h3 className="mb-3 mt-6 font-black">Talisman-sjekkliste</h3><div className="space-y-2">{talisman.map(x => <SetupRow key={x.name} item={x} prefix="tal" accent="violet"/>)}</div>
              <div className="mt-5 space-y-3">{[{n:100,t:"Farming-klar"},{n:120,t:"Solid endgame"},{n:135,t:"Storms Push-optimalisering"},{n:150,t:"Målet"}].map(m => <div key={m.n} className={`flex items-center gap-3 rounded-2xl border p-4 ${data.pit >= m.n ? "border-violet-400/30 bg-violet-400/10" : "border-white/5 bg-white/[.025] opacity-60"}`}><div className={`grid h-9 w-9 place-items-center rounded-full ${data.pit >= m.n ? "bg-violet-400 text-slate-950" : "bg-white/5"}`}>{data.pit >= m.n ? <Check className="h-5 w-5"/> : <Target className="h-4 w-4"/>}</div><div><b>Pit {m.n}</b><p className="text-xs text-slate-400">{m.t}</p></div></div>)}</div>
            </motion.section>}

            {tab === "character" && <motion.section key="character" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-400">Character Sheet</p>
              <h2 className="mt-1 text-2xl font-black">Storms Push-status</h2>
              <p className="mt-2 text-sm text-slate-400">Samlet oversikt over gear, Mythics, Greater Affixes, Masterwork og Pit-fremdrift.</p>


              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4"><p className="text-xs text-slate-400">Readiness</p><p className="mt-1 text-3xl font-black text-violet-300">{score}%</p></div>
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"><p className="text-xs text-slate-400">Pit Record</p><p className="mt-1 text-3xl font-black text-cyan-300">{data.pit}</p></div>
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4"><p className="text-xs text-slate-400">Gear</p><p className="mt-1 text-3xl font-black text-emerald-300">{owned}/{gear.length}</p></div>
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"><p className="text-xs text-slate-400">Completion</p><p className="mt-1 text-3xl font-black text-amber-300">{completion}%</p></div>
              </div>


              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-violet-400/20 bg-violet-400/5 p-4"><p className="text-xs text-slate-400">Mythics</p><p className="text-3xl font-black text-violet-300">{mythics}</p></div>
                <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="text-xs text-slate-400">GA-items</p><p className="text-3xl font-black text-amber-300">{gaItems}</p><p className="text-[10px] text-slate-500">{totalGA} GA totalt</p></div>
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="text-xs text-slate-400">MW 8+</p><p className="text-3xl font-black text-cyan-300">{mw8}</p></div>
                <div className="rounded-3xl border border-orange-400/20 bg-orange-400/5 p-4"><p className="text-xs text-slate-400">MW 12/12</p><p className="text-3xl font-black text-orange-300">{mw12}</p></div>
              </div>


              <div className="mt-5 rounded-3xl border border-white/8 bg-white/[.035] p-5">
                <div className="flex items-center justify-between"><div><h3 className="font-black">Road to Pit 150</h3><p className="mt-1 text-xs text-slate-400">{Math.max(0,150-data.pit)} nivåer igjen</p></div><span className="text-2xl font-black text-cyan-300">{Math.round((data.pit/150)*100)}%</span></div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/40"><motion.div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" animate={{width:`${Math.min(100,(data.pit/150)*100)}%`}} /></div>
              </div>


              <h3 className="mb-3 mt-6 font-black">Item-optimalisering</h3>
              <div className="space-y-2">{gear.map(item => { const p=data.gear[item.id]; return <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.03] p-3"><div className={`grid h-10 w-10 place-items-center rounded-xl border ${p.mythic ? "border-violet-400 bg-violet-400/10 text-violet-300" : "border-amber-400/30 bg-amber-400/5 text-amber-300"}`}><PackageCheck className="h-5 w-5"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="text-[10px] text-slate-500">{p.mythic ? "Mythic" : item.id === "gloves" || item.id === "amulet" || item.id === "boots" ? "Legendary" : "Unique"} · {p.greaterAffixes || 0} GA · MW {p.masterwork || 0}/12</p></div><span className="text-xs text-amber-300">{"★".repeat(p.masterwork >= 12 ? 3 : p.masterwork >= 8 ? 2 : p.masterwork >= 4 ? 1 : 0)}</span></div>})}</div>
            </motion.section>}


            {tab === "settings" && <motion.section key="settings" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-400">Mer</p><h2 className="mt-1 text-2xl font-black">Kilde, data og installasjon</h2><div className="mt-5 space-y-3">
                <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="flex w-full items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-left"><ExternalLink className="h-5 w-5 text-cyan-400"/><div className="flex-1"><b>Åpne Maxroll-guiden</b><p className="text-xs text-slate-400">Kontroller planner, patchendringer og detaljer</p></div><ChevronRight className="h-4 w-4"/></a>
                <button onClick={() => setInstallOpen(true)} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Smartphone className="h-5 w-5 text-emerald-400"/><div className="flex-1"><b>Installer på iPhone</b><p className="text-xs text-slate-400">Vis trinn-for-trinn</p></div><ChevronRight className="h-4 w-4"/></button>
                <button onClick={exportBackup} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Download className="h-5 w-5 text-cyan-400"/><div className="flex-1"><b>Eksporter backup</b><p className="text-xs text-slate-400">Last ned fremdriften som JSON</p></div></button>
                <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[.035] p-4 text-left"><Upload className="h-5 w-5 text-violet-400"/><div className="flex-1"><b>Importer backup</b><p className="text-xs text-slate-400">Gjenopprett på en annen enhet</p></div></button><input ref={fileRef} type="file" accept="application/json" onChange={importBackup} className="hidden"/>
                <button onClick={reset} className="flex w-full items-center gap-3 rounded-2xl border border-red-400/15 bg-red-400/5 p-4 text-left text-red-300"><RotateCcw className="h-5 w-5"/><div><b>Nullstill alt</b><p className="text-xs text-red-300/60">Kan ikke angres uten backup</p></div></button>
              </div><div className="mt-5 flex gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4"><CloudOff className="h-5 w-5 shrink-0 text-cyan-400"/><p className="text-xs leading-relaxed text-slate-400">Fremdrift lagres lokalt. Build-data er en kortfattet, selvstendig oppsummering basert på Maxrolls Season 15 Stinger-guide, kontrollert 12. oktober 2026. Spillpatcher kan endre oppsettet.</p></div>
            </motion.section>}
          </AnimatePresence>
        </main>

        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 border-t border-white/5 bg-[#0b0f18]/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">{[
          {id:"gear",label:"Gear",icon:ShieldCheck},{id:"setup",label:"Setup",icon:Zap},{id:"farm",label:"Farm",icon:Flame},{id:"progress",label:"Pit",icon:Target},{id:"character",label:"Karakter",icon:Sparkles},{id:"settings",label:"Mer",icon:Settings}
        ].map(x => { const Icon=x.icon; return <button key={x.id} onClick={() => setTab(x.id)} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[9px] font-bold ${tab===x.id ? "bg-cyan-400/10 text-cyan-300" : "text-slate-500"}`}><Icon className="h-5 w-5"/>{x.label}</button>; })}</nav>
      </div>

      <AnimatePresence>{installOpen && <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setInstallOpen(false)}><motion.div initial={{y:80}} animate={{y:0}} exit={{y:80}} onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#121824] p-5 shadow-2xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-400">iPhone PWA</p><h3 className="text-xl font-black">Legg til på Hjem-skjermen</h3></div><button onClick={() => setInstallOpen(false)} className="rounded-full bg-white/5 p-2"><X className="h-5 w-5"/></button></div><ol className="space-y-3">{[{i:Share,t:"Åpne Del-menyen i Safari"},{i:Home,t:"Velg «Legg til på Hjem-skjermen»"},{i:Smartphone,t:"Slå på «Åpne som nettapp» og trykk Legg til"}].map((s,i) => <li key={s.t} className="flex items-center gap-3 rounded-2xl bg-white/[.04] p-4"><div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300"><s.i className="h-5 w-5"/></div><div><span className="text-[10px] uppercase text-slate-500">Trinn {i+1}</span><p className="text-sm font-bold">{s.t}</p></div></li>)}</ol><p className="mt-4 flex gap-2 text-xs text-slate-500"><CircleHelp className="h-4 w-4 shrink-0"/>GitHub Pages-adressen din bruker HTTPS og kan installeres som web-app.</p><Button onClick={() => setInstallOpen(false)} className="mt-5 w-full rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300">Skjønner</Button></motion.div></motion.div>}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-xl">{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}