import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyTelegram, registrationMessage } from '../lib/notify-telegram.server';

const registration = { team_name: 'Test squad', player_name: 'Captain', game_id: 'Not provided', whatsapp_number: '+910000000000' };

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Telegram registration alerts', () => {
  it('uses the requested message fields without inventing a game ID', () => {
    expect(registrationMessage(registration)).toBe('New Registration! Team: Test squad, Player: Captain, Game ID: Not provided, WhatsApp: +910000000000');
  });

  it('sends the registration to the configured chat', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-credential');
    vi.stubEnv('TELEGRAM_CHAT_ID', 'test-chat');
    const request = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', request);
    expect(await notifyTelegram(registration)).toBe(true);
    const call = request.mock.calls[0];
    if (!call) throw new Error('Telegram request was not sent');
    expect(JSON.parse(call[1].body)).toEqual({ chat_id: 'test-chat', text: registrationMessage(registration) });
  });

  it('does not undo registration when Telegram is unavailable', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-credential');
    vi.stubEnv('TELEGRAM_CHAT_ID', 'test-chat');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await notifyTelegram(registration)).toBe(false);
  });
});