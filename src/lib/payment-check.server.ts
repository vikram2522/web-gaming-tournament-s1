import { generateResponse } from "@lovable.dev/ai-gateway";
import { ENTRY_FEE_RUPEES } from "./tournament";

export type PaymentCheck = { ok: boolean; reason: string };

/** Uses AI vision to confirm the image is a real, successful UPI/bank payment of exactly the entry fee. */
export async function checkPaymentScreenshot(file: File): Promise<PaymentCheck> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const dataUrl = `data:${file.type};base64,${btoa(bin)}`;

  const res = await generateResponse({
    model: "openai/gpt-6-astra",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You verify entry-fee payments for a gaming tournament. Look at this image and decide if it is a genuine screenshot of a COMPLETED/SUCCESSFUL payment (UPI app like PhonePe, Google Pay, Paytm, BHIM, or a bank app) of exactly ₹${ENTRY_FEE_RUPEES}. Reject: random photos, selfies, game screenshots, QR codes, pending/failed payments, any amount other than ₹${ENTRY_FEE_RUPEES}, or images that look edited. Reply in JSON {"ok": boolean, "reason": string} where reason is one short sentence for the player.`,
          },
          { type: "input_image", image_url: dataUrl, detail: "high" },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "payment_check",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { ok: { type: "boolean" }, reason: { type: "string" } },
          required: ["ok", "reason"],
        },
      },
    },
  });

  let text = "";
  for (const item of res.output ?? []) {
    if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
  }
  try {
    const parsed = JSON.parse(text) as PaymentCheck;
    return { ok: parsed.ok === true, reason: String(parsed.reason ?? "") };
  } catch {
    return { ok: false, reason: "Could not read the screenshot. Upload a clear payment screenshot." };
  }
}
