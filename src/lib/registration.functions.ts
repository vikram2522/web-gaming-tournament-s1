import { createServerFn } from "@tanstack/react-start";
import { validatePlayerIds } from "./tournament";

const ALLOWED = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;
const MAX_BYTES = 5 * 1024 * 1024;

export const listTeams = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("list_teams");
  if (error) throw new Error("Could not load teams");
  return (data ?? []) as { slot_number: number; team_name: string }[];
});

export const registerTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Invalid form");
    const text = (k: string) => String(input.get(k) ?? "").trim();
    const players = input.getAll("players").map((p) => String(p).trim()).filter(Boolean);
    const playerIds = validatePlayerIds(input.getAll("player_ids").map(String), players);
    const file = input.get("payment");
    if (!(file instanceof File) || file.size === 0) throw new Error("Upload the payment screenshot");
    if (!(file.type in ALLOWED)) throw new Error("Screenshot must be PNG, JPG or WEBP");
    if (file.size > MAX_BYTES) throw new Error("Screenshot must be under 5 MB");
    const data = { name: text("name"), captain: text("captain"), phone: text("phone"), players, playerIds, file };
    if (!data.name || !data.captain || !/^[0-9+ ]{10,15}$/.test(data.phone)) throw new Error("Fill all fields");
    return data;
  })
  .handler(async ({ data }) => {
    const { checkPaymentScreenshot } = await import("./payment-check.server");
    let check;
    try { check = await checkPaymentScreenshot(data.file); }
    catch (e) { console.error("payment check failed", e); throw new Error("Could not check the screenshot right now, try again"); }
    if (!check.ok) throw new Error(`Payment not accepted: ${check.reason || "upload a real ₹40 payment screenshot"}`);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${crypto.randomUUID()}.${ALLOWED[data.file.type as keyof typeof ALLOWED]}`;
    const up = await supabaseAdmin.storage.from("payment-proofs").upload(path, data.file, { contentType: data.file.type });
    if (up.error) throw new Error("Screenshot upload failed, try again");
    const { data: slot, error } = await supabaseAdmin.rpc("register_team", {
      _team_name: data.name, _captain: data.captain, _phone: data.phone, _players: data.players, _payment_path: path, _player_ids: data.playerIds,
    });
    if (error) {
      await supabaseAdmin.storage.from("payment-proofs").remove([path]);
      throw new Error(error.message.includes("slots") ? "All slots are filled" : "Registration failed");
    }
    const signed = await supabaseAdmin.storage.from("payment-proofs").createSignedUrl(path, 60 * 60 * 24 * 30);
    const paymentUrl = signed.data?.signedUrl ?? "";
    const { notifyTelegram, sendTelegramPhoto } = await import('./notify-telegram.server');
    await notifyTelegram({
      team_name: data.name,
      player_name: data.captain,
      game_id: data.players.map((p, i) => `${p}: ${data.playerIds[i]}`).join(", "),
      whatsapp_number: data.phone,
    });
    if (paymentUrl) {
      await sendTelegramPhoto(
        paymentUrl,
        `Payment screenshot — WEB GAMING\nTeam: ${data.name}, Player: ${data.captain}, WhatsApp: ${data.phone}`,
      );
    }
    return { slot: slot as number, paymentUrl };
  });
