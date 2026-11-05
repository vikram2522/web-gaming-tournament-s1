import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listRegistrations, setPaymentStatus, type PaymentStatus } from "@/lib/organizer.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/organizer")({
  head: () => ({
    meta: [
      { title: "Organizer — WEB GAMING" },
      { name: "description", content: "Organizer review of WEB GAMING tournament registrations and payments." },
      { property: "og:title", content: "Organizer — WEB GAMING" },
      { property: "og:description", content: "Review registrations and verify entry payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Organizer,
});

type Row = Awaited<ReturnType<typeof listRegistrations>>[number];
const LABEL: Record<PaymentStatus, string> = { pending: "Pending", verified: "Verified", follow_up: "Needs follow-up" };
const ORGANIZER_WA = "919390085923";

function Organizer() {
  const load = useServerFn(listRegistrations);
  const update = useServerFn(setPaymentStatus);
  const [pass, setPass] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [err, setErr] = useState("");

  async function refresh(p = pass) {
    setErr("");
    try { setRows(await load({ data: { pass: p } })); } catch (e) { setErr((e as Error).message); }
  }
  async function mark(r: Row, status: PaymentStatus) {
    const note = status === "follow_up" ? prompt("Note for follow-up (optional)", r.organizer_note ?? "") ?? "" : "";
    try { await update({ data: { pass, id: r.id, status, note } }); await refresh(); } catch (e) { setErr((e as Error).message); }
  }

  if (!rows) {
    return (
      <main className="mx-auto max-w-sm p-6 pt-24 space-y-4">
        <h1 className="font-display text-2xl text-primary">Organizer login</h1>
        <form onSubmit={(e) => { e.preventDefault(); refresh(); }} className="space-y-3">
          <Input type="password" placeholder="Organizer passcode" value={pass} onChange={(e) => setPass(e.target.value)} />
          <Button type="submit" className="w-full">Open</Button>
        </form>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </main>
    );
  }

  const shown = rows.filter((r) => filter === "all" || r.payment_status === filter);
  const count = (s: PaymentStatus) => rows.filter((r) => r.payment_status === s).length;

  return (
    <main className="mx-auto max-w-4xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl text-primary">Registrations ({rows.length}/12)</h1>
        <Button variant="outline" size="sm" onClick={() => refresh()}>Refresh</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "verified", "follow_up"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? `All (${rows.length})` : `${LABEL[f]} (${count(f)})`}
          </Button>
        ))}
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      {shown.length === 0 && <p className="text-muted-foreground">No registrations here.</p>}
      <div className="space-y-3">
        {shown.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">#{String(r.slot_number).padStart(2, "0")} · {r.team_name}</p>
              <span className={`rounded px-2 py-0.5 text-xs ${r.payment_status === "verified" ? "bg-primary text-primary-foreground" : r.payment_status === "follow_up" ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>
                {LABEL[r.payment_status as PaymentStatus]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Captain {r.captain} · {r.phone} · {new Date(r.created_at).toLocaleString()}</p>
            <p className="text-sm">Players: {r.players.map((p, i) => `${p} (ID: ${r.player_ids?.[i] ?? "—"})`).join(", ")}</p>
            {r.organizer_note && <p className="text-sm text-destructive">Note: {r.organizer_note}</p>}
            <div className="flex flex-wrap gap-2">
              {r.proofUrl && <Button asChild size="sm" variant="outline"><a href={r.proofUrl} target="_blank" rel="noreferrer">View payment</a></Button>}
              <Button size="sm" onClick={() => mark(r, "verified")}>Mark verified</Button>
              <Button size="sm" variant="destructive" onClick={() => mark(r, "follow_up")}>Needs follow-up</Button>
              <Button size="sm" variant="ghost" onClick={() => mark(r, "pending")}>Reset</Button>
              <Button asChild size="sm" variant="outline">
                <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`WEB GAMING: payment for team ${r.team_name} (slot ${r.slot_number}) ${r.payment_status === "verified" ? "is verified ✅" : "needs follow-up — please contact the organizer at wa.me/" + ORGANIZER_WA}`)}`} target="_blank" rel="noreferrer">Message captain</a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
