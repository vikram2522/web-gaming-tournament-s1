import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import heroAsset from "@/assets/web-gaming-hero.png.asset.json";
import paymentQr from "@/assets/tournament-payment-qr.jpeg.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";
import { countdownParts, ENTRY_FEE_RUPEES, MATCH_AT, organizerLink, WHATSAPP_COMMUNITY } from "@/lib/tournament";
import { listTeams, registerTeam } from "@/lib/registration.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WEB GAMING — Tournament Registration" },
      { name: "description", content: "Register your squad for the WEB GAMING tournament. ₹300 first prize, 12 slots, rules and points table." },
      { property: "og:title", content: "WEB GAMING — Tournament Registration" },
      { property: "og:description", content: "Register your squad for the WEB GAMING tournament. 12 slots, ₹300 first prize." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const TOTAL_SLOTS = 12;
const PRIZES = [
  { place: "1st Prize", amount: "₹300" },
  { place: "MVP", amount: "₹100" },
];
const RULES = [
  "Teams must join the room 10 minutes before match time.",
  "Any hacks, panels or teaming leads to instant disqualification.",
  "Organizer's decision is final in all disputes.",
  "After completing registration, send a screenshot of your registration to the organizer.",
];
const POINTS: [string, number][] = [
  ["1st · BOOYAH", 10],
  ["2nd", 9],
  ["3rd", 8],
  ["4th", 7],
  ["5th", 6],
  ["6th", 5],
  ["7th", 4],
  ["8th", 3],
  ["9th–10th", 2],
  ["11th–12th", 1],
];

type Team = { name: string; captain: string; phone: string; players: string[] };

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const values = countdownParts(to, now ?? Date.parse(to));
  const parts = ["Days", "Hrs", "Min", "Sec"].map((label, i) =>
    [label, now === null ? "--" : String(values[i] ?? 0).padStart(2, "0")] as const);
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

type Done = { slot: number; team: Team; paymentUrl: string };

function Index() {
  const [teams, setTeams] = useState<{ slot_number: number; team_name: string }[]>([]);
  const [tab, setTab] = useState<"register" | "teams" | "rules" | "points">("register");
  const [form, setForm] = useState<Team>({ name: "", captain: "", phone: "", players: ["", "", "", ""] });
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fetchTeams = useServerFn(listTeams);
  const register = useServerFn(registerTeam);

  useEffect(() => { fetchTeams().then(setTeams).catch(() => {}); }, [fetchTeams]);
  const left = TOTAL_SLOTS - teams.length;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (left <= 0 || !file) return;
    setBusy(true); setError("");
    const fd = new FormData();
    fd.set("name", form.name); fd.set("captain", form.captain); fd.set("phone", form.phone);
    form.players.filter(Boolean).forEach((p) => fd.append("players", p));
    fd.set("payment", file);
    const playerCount = form.players.filter(Boolean).length;
    try {
      const res = await register({ data: fd });
      window.__lovableEvents?.track?.("project.registration_submitted", { result: "success", player_count: playerCount });
      window.__lovableEvents?.track?.("project.payment_screenshot_uploaded", { file_type: file.type, size_kb: Math.round(file.size / 1024) });
      window.__lovableEvents?.track?.("project.team_slot_assigned", { slot_number: res.slot, slots_filled: res.slot });
      setDone({ slot: res.slot, team: form, paymentUrl: res.paymentUrl });
      setForm({ name: "", captain: "", phone: "", players: ["", "", "", ""] });
      setFile(null); (e.target as HTMLFormElement).reset();
      setTeams(await fetchTeams());
    } catch (err) {
      window.__lovableEvents?.track?.("project.registration_submitted", { result: "failed", player_count: playerCount });
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally { setBusy(false); }
  };

  const input = "w-full bg-muted border border-input px-3 py-2.5 text-lg outline-none focus:border-ring";
  const tabs = [["register", "Register"], ["teams", "Teams"], ["rules", "Rules"], ["points", "Points"]] as const;
  const bySlot = new Map(teams.map((t) => [t.slot_number, t.team_name]));

  return (
    <main className="min-h-screen">
      <section className="relative">
        <img src={heroAsset.url} alt="WEB GAMING spider logo on black and red smoke" width={1536} height={1024} className="h-[60vh] w-full object-cover" />
        <div className="hero-fade absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-5 pb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Squad registration</p>
          <h1 className="mt-2 text-5xl font-bold uppercase md:text-7xl">WEB GAMING</h1>
          <p className="mt-3 mb-5 text-lg text-muted-foreground">Match begins in</p>
          <Countdown to={MATCH_AT} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-3 gap-3 px-5 py-6">
        {[["Prize pool", "₹400"], ["Slots left", `${left}/${TOTAL_SLOTS}`], ["Mode", "Squad · TPP"]].map(([k, v]) => (
          <div key={k} className="clip-corner bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="font-display text-xl font-bold md:text-2xl">{v}</div>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {PRIZES.map((p, i) => (
            <div key={p.place} className={`clip-corner p-5 text-center ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              <div className="text-sm uppercase tracking-widest opacity-80">{p.place}</div>
              <div className="font-display text-3xl font-bold">{p.amount}</div>
            </div>
          ))}
        </div>
      </section>

      <nav className="sticky top-0 z-10 border-y bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl px-5">
          {tabs.map(([k, l]) => (
             <Button variant="ghost" key={k} onClick={() => setTab(k)}
              className={`font-display flex-1 border-b-2 py-3 uppercase tracking-wider ${tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              {l}
             </Button>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-5 py-8">
        {tab === "register" && (
          <form onSubmit={submit} className="space-y-4">
            <h2 className="text-2xl font-bold uppercase">Team registration</h2>
            {done && (
              <div className="space-y-3 border-l-4 border-primary bg-card p-4">
                <p className="text-lg font-semibold">Registered! {done.team.name} got slot #{String(done.slot).padStart(2, "0")}.</p>
                <p className="text-muted-foreground">Now send both messages to the organizer on WhatsApp:</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild><a target="_blank" rel="noopener noreferrer" href={organizerLink(
                    `New registration — WEB GAMING\nSlot: #${done.slot}\nTeam: ${done.team.name}\nCaptain: ${done.team.captain}\nWhatsApp: ${done.team.phone}\nPlayers: ${done.team.players.filter(Boolean).join(", ")}`)}>1. Send registration</a></Button>
                  <Button asChild variant="outline"><a target="_blank" rel="noopener noreferrer" href={organizerLink(
                    `Payment done — WEB GAMING\nTeam: ${done.team.name} (slot #${done.slot})\nEntry fee: ₹${ENTRY_FEE_RUPEES}\nScreenshot: ${done.paymentUrl}`)}>2. Send payment done</a></Button>
                </div>
              </div>
            )}
             <div className="flex flex-wrap items-center justify-between gap-3 border-y py-4">
               <p className="text-lg font-semibold">Entry fee: <span className="text-primary">₹{ENTRY_FEE_RUPEES} per squad</span></p>
               <Dialog>
                 <DialogTrigger asChild>
                   <Button type="button" variant="outline"><QrCode />Open payment QR</Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-[min(32rem,calc(100vw-2rem))] max-h-[90dvh] overflow-y-auto">
                   <DialogHeader>
                     <DialogTitle>Squad entry payment</DialogTitle>
                     <DialogDescription>₹{ENTRY_FEE_RUPEES} per squad</DialogDescription>
                   </DialogHeader>
                   <img src={paymentQr.url} alt="Tournament entry payment QR code" className="mx-auto h-auto w-full" />
                 </DialogContent>
               </Dialog>
             </div>
            {left <= 0 && <p className="text-destructive">All slots are filled.</p>}
            <div className="grid gap-4 md:grid-cols-2">
              <input required placeholder="Team name" className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required placeholder="Captain name" className={input} value={form.captain} onChange={(e) => setForm({ ...form, captain: e.target.value })} />
              <input required type="tel" pattern="[0-9+ ]{10,15}" placeholder="WhatsApp number (+91…)" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <h3 className="pt-2 text-lg uppercase text-muted-foreground">Players in-game names</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {form.players.map((p, i) => (
                <input key={i} required placeholder={`Player ${i + 1}`} className={input} value={p}
                  onChange={(e) => { const pl = [...form.players]; pl[i] = e.target.value; setForm({ ...form, players: pl }); }} />
              ))}
            </div>
            {form.players.length < 5 && (
               <Button variant="link" type="button" className="text-primary" onClick={() => setForm({ ...form, players: [...form.players, ""] })}>+ Add substitute</Button>
            )}
            <label className="block space-y-2 border border-dashed border-primary bg-card p-4">
              <span className="block text-lg font-semibold uppercase">Payment screenshot <span className="text-primary">*</span></span>
              <span className="block text-sm text-muted-foreground">Upload the screenshot of your ₹{ENTRY_FEE_RUPEES} entry fee payment (PNG, JPG or WEBP, under 5 MB).</span>
              <input required type="file" accept="image/png,image/jpeg,image/webp" aria-label="Payment screenshot"
                className="block w-full text-base file:mr-3 file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {error && <p className="border-l-4 border-destructive bg-card p-3 text-destructive">{error}</p>}
            <a href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer" className="block bg-card p-3 text-center text-lg font-semibold text-primary underline underline-offset-4">ANY UPDATES JOIN WHATSAPP COMMUNITY</a>
             <Button type="submit" disabled={left <= 0 || busy} className="clip-corner font-display h-auto w-full bg-primary py-4 text-lg font-bold uppercase text-primary-foreground disabled:opacity-40">
              {busy ? "Submitting…" : "Submit registration"}
             </Button>
          </form>
        )}

        {tab === "teams" && (
          <div>
            <h2 className="mb-4 text-2xl font-bold uppercase">Teams · {teams.length}/{TOTAL_SLOTS}</h2>
            <ol className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1).map((s) => (
                <li key={s} className="clip-corner flex items-center gap-4 bg-card p-4 text-lg">
                  <span className="font-display text-primary">#{String(s).padStart(2, "0")}</span>
                  {bySlot.get(s) ?? <span className="text-muted-foreground">Open slot</span>}
                </li>
              ))}
            </ol>
          </div>
        )}



        {tab === "rules" && (
          <ol className="space-y-3">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-4 bg-card p-4 text-lg"><span className="font-display text-primary">{i + 1}</span>{r}</li>
            ))}
          </ol>
        )}

        {tab === "points" && (
          <div className="grid gap-6 md:grid-cols-2">
            <table className="w-full bg-card text-lg">
              <thead><tr className="text-left text-muted-foreground"><th className="p-3">Placement</th><th className="p-3">Points</th></tr></thead>
              <tbody>{POINTS.map(([p, pts]) => <tr key={p} className="border-t"><td className="p-3">{p}</td><td className="p-3 text-primary">{pts}</td></tr>)}</tbody>
            </table>
            <div className="clip-corner bg-card p-6">
              <div className="text-muted-foreground uppercase tracking-widest">Per kill</div>
              <div className="font-display text-5xl font-bold text-primary">1 pt</div>
              <p className="mt-3 text-sm text-muted-foreground">Position points follow your finishing position — BOOYAH gives the full 10.</p>
            </div>
          </div>
        )}
      </section>

      <footer className="border-t py-8 text-center">
         <Button asChild className="clip-corner font-display h-auto px-6 py-3 font-bold uppercase">
           <a href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer">Join WhatsApp community</a>
         </Button>
      </footer>
    </main>
  );
}
