import { createServerFn } from "@tanstack/react-start";

export const PAYMENT_STATUSES = ["pending", "verified", "follow_up"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

function checkPass(pass: unknown) {
  const real = process.env["ORGANIZER_PASSCODE"];
  if (!real) throw new Error("Organizer passcode is not set up yet");
  if (typeof pass !== "string" || pass !== real) throw new Error("Wrong passcode");
}

export const listRegistrations = createServerFn({ method: "POST" })
  .validator((i: { pass: string }) => i)
  .handler(async ({ data }) => {
    checkPass(data.pass);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("registrations")
      .select("id, slot_number, team_name, captain, phone, players, payment_path, payment_status, organizer_note, created_at")
      .order("slot_number");
    if (error) throw new Error("Could not load registrations");
    const paths = (rows ?? []).map((r) => r.payment_path);
    const signed = paths.length
      ? (await supabaseAdmin.storage.from("payment-proofs").createSignedUrls(paths, 60 * 60)).data ?? []
      : [];
    return (rows ?? []).map((r, i) => ({ ...r, payment_path: undefined, proofUrl: signed[i]?.signedUrl ?? "" }));
  });

export const setPaymentStatus = createServerFn({ method: "POST" })
  .validator((i: { pass: string; id: string; status: PaymentStatus; note?: string }) => {
    if (!PAYMENT_STATUSES.includes(i.status)) throw new Error("Bad status");
    return i;
  })
  .handler(async ({ data }) => {
    checkPass(data.pass);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("registrations")
      .update({ payment_status: data.status, organizer_note: data.note?.slice(0, 500) ?? null })
      .eq("id", data.id);
    if (error) throw new Error("Could not update");
    return { ok: true };
  });
