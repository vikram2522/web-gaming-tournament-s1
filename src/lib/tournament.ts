export const ENTRY_FEE_RUPEES = 40;
export const MATCH_AT = "2026-11-06T14:12:30Z";
export const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/LG4T0zMRNq5CTI04BDR0IB";
export const ORGANIZER_CHAT = "https://wa.me/qr/BR6XAHQEXPUBP1?s=v";
export const ORGANIZER_WHATSAPP = "919390085923";

export function countdownParts(to: string, now: number) {
  const seconds = Math.max(0, Math.floor((new Date(to).getTime() - now) / 1000));
  return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60];
}

export function organizerLink(message: string) {
  return `https://wa.me/${ORGANIZER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
