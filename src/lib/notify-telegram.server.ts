export type TelegramRegistration = {
  team_name: string;
  player_name: string;
  game_id: string;
  whatsapp_number: string;
};

export function registrationMessage(data: TelegramRegistration) {
  return `New Registration! Team: ${data.team_name}, Player: ${data.player_name}, Game ID: ${data.game_id}, WhatsApp: ${data.whatsapp_number}`;
}

// Server-only helper: sends the payment screenshot as a photo with a short caption.
export async function sendTelegramPhoto(photoUrl: string, caption: string): Promise<boolean> {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  const chatId = process.env['TELEGRAM_CHAT_ID'];
  if (!token || !chatId) {
    console.error('Telegram notification is not configured');
    return false;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json() as { ok?: boolean; description?: string };
    if (!response.ok || result.ok !== true) {
      // Never log request URLs or exception objects: Telegram URLs contain the token.
      const description = (result.description ?? 'Telegram rejected the photo').replaceAll(token, '[redacted]');
      console.error(`Telegram photo failed [${response.status}]: ${description}`);
      return false;
    }
    return true;
  } catch {
    console.error('Telegram photo could not be delivered');
    return false;
  }
}

// Server-only helper: called only after register_team has saved the registration.
export async function notifyTelegram(data: TelegramRegistration): Promise<boolean> {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  const chatId = process.env['TELEGRAM_CHAT_ID'];
  if (!token || !chatId) {
    console.error('Telegram notification is not configured');
    return false;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: registrationMessage(data) }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await response.json() as { ok?: boolean; description?: string };
    if (!response.ok || result.ok !== true) {
      // Never log request URLs or exception objects: Telegram URLs contain the token.
      const description = (result.description ?? 'Telegram rejected the message').replaceAll(token, '[redacted]');
      console.error(`Telegram notification failed [${response.status}]: ${description}`);
      return false;
    }
    return true;
  } catch {
    console.error('Telegram notification could not be delivered');
    return false;
  }
}