import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paradox Cup S1 — Tournament Registration" },
      { name: "description", content: "Register your squad for Paradox Cup Season 1. Prize pool, slots, rules and points table." },
      { property: "og:title", content: "Paradox Cup S1 — Tournament Registration" },
      { property: "og:description", content: "Register your squad for Paradox Cup Season 1." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TOTAL_SLOTS = 25;
const OPENS_AT = new Date(Date.now() + 2 * 864e5).toISOString();
const PRIZES = [
  { place: "1st", amount: "₹5,000" },
  { place: "2nd", amount: "₹3,000" },
  { place: "3rd", amount: "₹2,000" },
];
const RULES = [
  "Squad of 4 players, 1 optional substitute.",
  "Mobile devices only. Emulators and iPads are not allowed.",
  "Teams must join the room 10 minutes before match time.",
  "Any hacks or teaming leads to instant disqualification.",
  "Organizer's decision is final in all disputes.",
];
const POINTS = [[1, 15], [2, 12], [3, 10], [4, 8], [5, 6], [6, 4], [7, 2], [8, 1]];

type Team = { name: string; tag: string; captain: string; phone: string; players: string[] };
const KEY = "tournament-teams";

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(to).getTime() - (now ?? 0));
  const parts = [["Days", 864e5], ["Hrs", 36e5], ["Min", 6e4], ["Sec", 1e3]].map(([l, ms], i, a) => {
    const v = i === 0 ? Math.floor(diff / (ms as number)) : Math.floor((diff % (a[i - 1]![1] as number)) / (ms as number));
    return [l, now === null ? "--" : String(v).padStart(2, "0")] as const;
  });
  return (
    <div className="flex gap-3">
      {parts.map(([l, v]) => (
        <div key={l} className="clip-corner bg-card px-4 py-3 text-center min-w-16">
          <div className="font-display text-3xl font-bold text-primary">{v}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
        </div>
      ))}
    </div>
  );
}

function Index() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<"register" | "teams" | "rules" | "points">("register");
  const [form, setForm] = useState<Team>({ name: "", tag: "", captain: "", phone: "", players: ["", "", "", ""] });
  const [done, setDone] = useState(false);

  useEffect(() => { setTeams(JSON.parse(localStorage.getItem(KEY) || "[]")); }, []);
  const left = TOTAL_SLOTS - teams.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (left <= 0) return;
    const next = [...teams, { ...form, players: form.players.filter(Boolean) }];
    setTeams(next); localStorage.setItem(KEY, JSON.stringify(next));
    setForm({ name: "", tag: "", captain: "", phone: "", players: ["", "", "", ""] });
    setDone(true); setTab("teams");
  };

  const input = "w-full bg-muted border border-input px-3 py-2.5 text-lg outline-none focus:border-ring";
  const tabs = [["register", "Register"], ["teams", "Teams"], ["rules", "Rules"], ["points", "Points"]] as const;

  return (
    <main className="min-h-screen">
      <section className="relative">
        <img src={hero} alt="Squad on a ridge at dusk" className="h-[60vh] w-full object-cover" />
        <div className="hero-fade absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Paradox Esports presents</p>
          <h1 className="mt-2 text-5xl font-bold uppercase md:text-7xl">Paradox Cup <span className="text-primary">S1</span></h1>
          <p className="mt-3 mb-5 text-lg text-muted-foreground">Registration opens in</p>
          <Countdown to={OPENS_AT} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-3 gap-3 px-5 py-6">
        {[["Prize pool", "₹10,000"], ["Slots left", `${left}/${TOTAL_SLOTS}`], ["Mode", "Squad · TPP"]].map(([k, v]) => (
          <div key={k} className="clip-corner bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="font-display text-xl font-bold md:text-2xl">{v}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {PRIZES.map((p, i) => (
            <div key={p.place} className={`clip-corner p-4 text-center ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              <div className="text-sm uppercase tracking-widest opacity-80">{p.place}</div>
              <div className="font-display text-2xl font-bold">{p.amount}</div>
            </div>
          ))}
        </div>
      </section>

      <nav className="sticky top-0 z-10 border-y bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl px-5">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`font-display flex-1 border-b-2 py-3 uppercase tracking-wider ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-5 py-8">
        {tab === "register" && (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-2xl font-bold uppercase">Team registration</h2>
            {left <= 0 && <p className="text-destructive">All slots are filled.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              <input required placeholder="Team name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required placeholder="Team tag (e.g. PDX)" maxLength={5} className={input} value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })} />
              <input required placeholder="Captain name" className={input} value={form.captain} onChange={(e) => setForm({ ...form, captain: e.target.value })} />
              <input required type="tel" pattern="[0-9+ ]{10,15}" placeholder="WhatsApp number (+91…)" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <h3 className="pt-2 text-lg uppercase text-muted-foreground">Players in-game names</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {form.players.map((p, i) => (
                <input key={i} required={i < 4} placeholder={i < 4 ? `Player ${i + 1}` : "Substitute"} className={input} value={p}
                  onChange={(e) => { const pl = [...form.players]; pl[i] = e.target.value; setForm({ ...form, players: pl }); }} />
              ))}
            </div>
            {form.players.length < 5 && (
              <button type="button" className="text-primary" onClick={() => setForm({ ...form, players: [...form.players, ""] })}>+ Add substitute</button>
            )}
            <p className="text-sm text-muted-foreground">Your contact details go only to the organizer.</p>
            <button disabled={left <= 0} className="clip-corner font-display w-full bg-primary py-4 text-lg font-bold uppercase text-primary-foreground disabled:opacity-40">
              Submit registration
            </button>
          </form>
        )}

        {tab === "teams" && (
          <div>
            {done && <p className="mb-4 border-l-4 border-primary bg-card p-3">Registered! The organizer will contact you on WhatsApp.</p>}
            <h2 className="mb-4 text-2xl font-bold uppercase">Slot list</h2>
            <ol className="space-y-2">
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => {
                const t = teams[i];
                return (
                  <li key={i} className="flex items-center gap-4 bg-card px-4 py-3">
                    <span className="font-display w-8 text-primary">#{String(i + 1).padStart(2, "0")}</span>
                    {t ? <><span className="font-semibold">{t.name}</span><span className="text-muted-foreground">[{t.tag}]</span></> : <span className="text-muted-foreground">Open slot</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {tab === "rules" && (
          <ol className="space-y-3">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-4 bg-card p-4 text-lg"><span className="font-display text-accent">{i + 1}</span>{r}</li>
            ))}
          </ol>
        )}

        {tab === "points" && (
          <div className="grid gap-6 md:grid-cols-2">
            <table className="w-full bg-card text-lg">
              <thead><tr className="text-left text-muted-foreground"><th className="p-3">Placement</th><th className="p-3">Points</th></tr></thead>
              <tbody>{POINTS.map(([p, pts]) => <tr key={p} className="border-t"><td className="p-3">#{p}</td><td className="p-3 text-primary">{pts}</td></tr>)}</tbody>
            </table>
            <div className="clip-corner bg-card p-6">
              <div className="text-muted-foreground uppercase tracking-widest">Per finish</div>
              <div className="font-display text-5xl font-bold text-accent">1 pt</div>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t py-8 text-center">
        <a href="https://wa.me/910000000000" className="clip-corner font-display inline-block bg-accent px-6 py-3 font-bold uppercase text-accent-foreground">Message on WhatsApp</a>
      </footer>
    </main>
  );
}
