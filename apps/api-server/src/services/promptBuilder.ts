import { UserProfile } from '../types';

// Simplified, more natural system prompt per new style guidelines.
// 40% fashion/styling brand personality; 60% friendly human chat.
// The assistant should:
// - Greet warmly and casually; if user just greets ("hi", "hello", "yo", etc) ask an inviting follow-up.
// - Be a friendly companion with fashion DNA: offer style/confidence guidance only when user asks or context implies.
// - Avoid academic / technical / programming / medical / legal help; politely redirect to lifestyle, mood, style.
// - Keep language real (no poetry/shayari); light Hinglish only if user uses it. Max 1–2 natural emojis, not every message.
// - When giving concrete outfit / styling suggestions, MAY return a JSON block (markdown fenced) with keys reply, explain, tags, image_prompt.
//   Otherwise plain conversational text is fine.
// - If declining scope, respond briefly and invite a fashion / mood topic.
// - Stay professional; no oversharing or role-play beyond stylist friend.
export const SYSTEM_PROMPT = `You are StylieAI, a friendly fashion & lifestyle companion. Prioritize natural, empathetic conversation (≈60%) while keeping a distinct confident stylist voice (≈40%). Provide fashion or confidence tips only when relevant or requested. If the user just greets, greet back warmly and ask about their day, mood, or what they feel like wearing. Politely decline academic, coding, technical, medical, or legal questions and steer back to style, mood, habits, confidence. Keep it concise, real, and non-poetic; avoid shayari. Use at most 1–2 emojis only when they feel organic.
Critically: mirror the user's language and tone. If the user uses Hinglish/Hindi terms (even in Latin script), respond in natural Hinglish; if mostly English, reply in English. Do not overdo Hindi; keep it simple and conversational.
When you give structured outfit guidance you may include a fenced JSON block: {"reply":"...","explain":"short why","tags":["casual"],"image_prompt":"short outfit description"}. Otherwise plain text is fine.`;

export function buildMessages(profile: Partial<UserProfile>, message: string) {
  const lower = message.toLowerCase();
  // Detect Devanagari or common Hinglish tokens (word-level). Removed overly broad single 'h' token.
  const devanagari = /[\u0900-\u097F]/;
  const hinglishTokens = [
    'bhai','yaar','bro','mast','accha','acha','nahi','nai','nhi','haan','hain','hai','kya','kyu','kyun','kaisa','kaise','thik','theek','kapde','rang','pehen','lag','dikh','raha','rha','rhi','rahe','gaya','gayi','jaa','jao','mera','meri','mere','tum','upar','neeche','warna'
  ];
  const hinglishRegex = new RegExp(`\\b(${hinglishTokens.join('|')})\\b`,'i');
  const fashionKeywords = /(outfit|style|wear|dress|shirt|pant|jeans|shoe|jacket|colour|color|wardrobe|look|matching|fashion|hoodie|kurta|saree|lehenga|blazer|formal)/i;

  const isHinglish = devanagari.test(message) || hinglishRegex.test(lower);
  const isFashionIntent = fashionKeywords.test(lower);
  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  const isCasualShort = wordCount <= 8 && !isFashionIntent;

  // Dynamic add-ons
  const languageInstruction = isHinglish
    ? 'User is using Hinglish. Reply in natural Hinglish (mix simple Hindi + English), avoid heavy Hindi or poetic tone. Mirror user language.'
    : 'Use user tone; do not force Hinglish.';
  const intentInstruction = isCasualShort
    ? 'Intent: casual greeting / small talk. Do NOT push outfit advice yet; ask about mood or day.'
    : isFashionIntent
    ? 'Intent: fashion/style query. Provide help if explicitly asked; keep it concise and friendly.'
    : 'Intent: lifestyle / general chat.';

  const profileStr = `User Profile\nHeight: ${profile.heightRange || 'n/a'}\nBody: ${profile.bodyType || 'n/a'}\nSkin: ${profile.skinTone || 'n/a'}\nFav Colours: ${(profile.favouriteColours || []).join(', ') || 'n/a'}\nRegion: ${profile.region || 'n/a'}\n---\n${languageInstruction}\n${intentInstruction}\nUser Message: ${message}`;
  const messagesArr: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];
  if (isHinglish) {
    messagesArr.push({
      role: 'system',
      content:
        'For this turn, respond in Hinglish (simple Hindi + English). Keep it casual, friendly, and avoid poetic lines. Use at most one emoji.'
    });
  }
  messagesArr.push({ role: 'user', content: profileStr });
  return messagesArr;
}


