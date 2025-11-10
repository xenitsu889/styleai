import React, { useState, useEffect } from "react";
import { ArrowLeft, Wand2, Sparkles, RefreshCw } from "lucide-react";
import { WardrobeHistory } from "./WardrobeHistory";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { WardrobeItem } from "../App";
import { ensureUserId, sendChat, fetchChatHistory } from "../services/api";

interface WardrobeAssistProps {
  wardrobeItems: WardrobeItem[];
  onNavigate: (page: string) => void;
}

interface OutfitSuggestion {
  items: WardrobeItem[];
  explanation: string;
  occasion?: string;
}

export const WardrobeAssist: React.FC<WardrobeAssistProps> = ({
  wardrobeItems,
  onNavigate,
}): React.ReactElement => {
  const MAX_ITEMS = 3; // allow up to three items (e.g., top + bottom + jacket/accessory)
  const [generatedOutfits, setGeneratedOutfits] = useState<OutfitSuggestion[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [explain, setExplain] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [replyText, setReplyText] = useState<string | null>(null);
  const [itemExplains, setItemExplains] = useState<Record<string, string>>({});
  const [itemLoading, setItemLoading] = useState<Record<string, boolean>>({});
  const [alternatives, setAlternatives] = useState<WardrobeItem[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      prompt: string;
      reply: string;
      timestamp: string;
      selected_item_ids: string[];
    }>
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isLastFromHistory, setIsLastFromHistory] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    rawReply?: string | null;
    structured?: any[];
    parsedIds?: string[];
    matchedIds?: string[];
  }>({});

  const generateOutfit = async (customPrompt?: string) => {
    setIsGenerating(true);
    setExplain(null);
    setFollowUps([]);
    try {
      const userId = ensureUserId();
      const userPrompt =
        customPrompt || prompt || "Pick an outfit from my wardrobe for today";
      // Add language hint for Hinglish
      // Build a small inventory list so the model can pick actual item IDs from user's wardrobe.
      const inventory = wardrobeItems
        .map((w) => `${w.id}: ${w.name} (${w.category})`)
        .join("\n");

      // Decide reply language based on user prompt (simple heuristic)
      const detectPreferredLanguage = (text: string) => {
        if (!text) return "english";
        // If Devanagari characters present, prefer Hinglish/Hindi
        if (/[\u0900-\u097F]/.test(text)) return "hinglish";
        // Common Romanized Hindi / Hinglish tokens (cover more informal/romanized variants)
        const hinglishTokens = [
          "hai",
          "hota",
          "hoti",
          "hoga",
          "hoge",
          "chahe",
          "chahta",
          "chahti",
          "chahiye",
          "chaiye",
          "kuch",
          "toh",
          // removed ambiguous token 'to' (matches English 'to' and caused false positives)
          "aur",
          "ke",
          "ka",
          "ki",
          "kya",
          "nahi",
          "tum",
          "tu",
          "mera",
          "meri",
          "raha",
          "rahi",
          "karo",
          "maja",
        ];
        const low = text.toLowerCase();
        for (const t of hinglishTokens) {
          // match token boundaries or common concatenations
          const re = new RegExp(`(^|\\s)${t}($|\\s|[.!?,])`, "i");
          if (re.test(low)) return "hinglish";
        }
        return "english";
      };

      const lang = detectPreferredLanguage(userPrompt);

      // Light-weight occasion detector to guide selection (interview, date, casual, drive, party)
      // Stricter occasion detector: require at least 2 keyword matches to classify
      const detectOccasion = (text?: string) => {
        if (!text) return "other";
        const low = text.toLowerCase();
        const buckets: { [key: string]: string[] } = {
          interview: [
            "interview",
            "job interview",
            "panel",
            "interview outfit",
          ],
          date: ["date", "dating", "date night"],
          drive: ["drive", "long drive", "road trip"],
          party: ["party", "club", "wedding", "celebration", "party night"],
          casual: ["casual", "everyday", "casual outing"],
        };

        for (const key of Object.keys(buckets)) {
          let matches = 0;
          for (const kw of buckets[key]) {
            if (
              new RegExp(
                `\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`
              ).test(low)
            ) {
              matches += 1;
            }
          }
          if (matches >= 2) return key;
        }

        return "other";
      };

      const occasion = detectOccasion(userPrompt);

      // Strong instructions: do NOT include IDs in the human-readable reply. If selecting items,
      // return a single JSON object on its own line at the end of the response exactly like:
      // { "selected_item_ids": ["id1","id2"] }
      // Do NOT repeat the IDs anywhere else in the text.
      const languageInstruction =
        lang === "hinglish"
          ? "Please reply in Hinglish (use Romanized Hindi / Latin script). Give the explanation and 'why' in Hinglish so the user sees the reasoning in the same language as their question."
          : "Please reply in English.";

      // Prefer men's pairings unless user specifies otherwise
      const personaInstruction =
        "Assume the outfit is for a man unless the user explicitly says otherwise. Prefer typical men's pairings (top + bottom), and include a jacket or accessory only when relevant or available.";

      const message =
        (inventory ? `My wardrobe items:\n${inventory}\n\n` : "") +
        userPrompt +
        `\n\n${languageInstruction} ${personaInstruction} IMPORTANT: Only choose up to ${MAX_ITEMS} items from the list above. Do NOT include item IDs inside the normal reply text. If you select items, append a single JSON object on its own line at the end of your response exactly like:\n{ "selected_item_ids": ["id1","id2"] } and do not include these ids anywhere else in the reply.`;
      const resp = await sendChat(userId, message, { mode: "wardrobe" });

      // Add to history
      // Helper: try to parse a JSON object with selected_item_ids from the assistant reply
      const parseSelectedIdsFromReply = (text?: string): string[] => {
        if (!text) return [];
        // First, try to find a fenced code block with JSON: ```json { ... } ```
        const fenceMatch = text.match(/```(?:json\s*)?([\s\S]*?)```/m);
        const tryParse = (candidate: string | null | undefined) => {
          if (!candidate) return null;
          try {
            const obj = JSON.parse(candidate.trim());
            if (Array.isArray(obj.selected_item_ids))
              return obj.selected_item_ids.map(String);
          } catch (e) {
            return null;
          }
          return null;
        };

        if (fenceMatch) {
          const parsed = tryParse(fenceMatch[1]);
          if (parsed) return parsed;
        }

        // Try to find a JSON object inline
        const jsonMatch = text.match(
          /\{[\s\S]*\"selected_item_ids\"[\s\S]*\}/m
        );
        if (jsonMatch) {
          const parsed = tryParse(jsonMatch[0]);
          if (parsed) return parsed;
        }

        // Fallback: bracketed IDs like [id1,id2]
        const bracket = (text || "").match(/\[([^\]]+)\]/);
        if (bracket && bracket[1]) {
          return bracket[1]
            .split(/[,\s]+/)
            .map((s: string) => s.replace(/['"\[\]]/g, "").trim())
            .filter(Boolean);
        }
        return [];
      };

      // Extract structured JSON objects from the assistant reply (handles multiple JSON objects inside a code fence)
      const parseAllJsonObjects = (text?: string) => {
        if (!text) return [] as any[];
        const objs: any[] = [];
        // Find all {...} blocks and try to JSON.parse them individually
        const matches = text.match(/\{[\s\S]*?\}/g);
        if (!matches) return objs;
        for (const m of matches) {
          try {
            const o = JSON.parse(m);
            objs.push(o);
          } catch (e) {
            // ignore parse errors
          }
        }
        return objs;
      };

      let selIds: string[] = (resp as any).selected_item_ids || [];
      // Try to extract structured objects from the raw reply (this will catch both the reply/explain object and the selected_item_ids object)
      const structured = parseAllJsonObjects(resp.reply || "");
      // If structured objects found, prefer those values
      let parsedReplyFromJson: string | null = null;
      if (structured.length > 0) {
        for (const o of structured) {
          if (o && typeof o === "object") {
            if (!parsedReplyFromJson && (o.reply || o.explain)) {
              parsedReplyFromJson = (o.reply || o.explain) as string;
            }
            if (
              Array.isArray(o.selected_item_ids) &&
              o.selected_item_ids.length > 0
            ) {
              selIds = o.selected_item_ids.map(String);
            }
          }
        }
      }

      // If we still don't have selIds, try to parse from inline text
      if ((!selIds || selIds.length === 0) && resp.reply) {
        selIds = parseSelectedIdsFromReply(resp.reply || "");

        // If assistant didn't return explicit IDs, try to parse mentioned items by name/color
        // and map them to actual wardrobe item IDs present in the user's wardrobe.
        const parseMentionedItemsFromReply = (text?: string): string[] => {
          if (!text) return [];
          const low = text.toLowerCase();
          const colors = extractColors(text);
          const categoryKeywords = [
            "shirt",
            "t-shirt",
            "tshirt",
            "top",
            "jeans",
            "pant",
            "pants",
            "trouser",
            "shorts",
            "dress",
            "skirt",
            "jacket",
            "coat",
            "sweater",
            "hoodie",
          ];

          const foundIds: string[] = [];

          // 1) Exact item name mentions
          for (const w of wardrobeItems) {
            const name = (w.name || "").toLowerCase();
            if (name && low.includes(name)) {
              foundIds.push(w.id);
            }
          }

          if (foundIds.length >= MAX_ITEMS)
            return Array.from(new Set(foundIds)).slice(0, MAX_ITEMS);

          // 2) Color + category matches like "green t-shirt" or "black jeans"
          for (const color of colors) {
            for (const cat of categoryKeywords) {
              const re = new RegExp(`\\b${color}\\s+${cat}\\b`, "i");
              if (re.test(low)) {
                const matches = wardrobeItems.filter((w) => {
                  const wn = (w.name || "").toLowerCase();
                  const wc = (w.category || "").toLowerCase();
                  return (
                    (wn.includes(color) || wc.includes(color)) &&
                    wc.includes(cat)
                  );
                });
                for (const m of matches) {
                  if (!foundIds.includes(m.id)) foundIds.push(m.id);
                  if (foundIds.length >= MAX_ITEMS) break;
                }
                if (foundIds.length >= MAX_ITEMS) break;
              }
            }
            if (foundIds.length >= MAX_ITEMS) break;
          }

          if (foundIds.length >= MAX_ITEMS)
            return Array.from(new Set(foundIds)).slice(0, MAX_ITEMS);

          // 3) Category-only matches when colors aren't present (e.g., "jeans")
          for (const cat of categoryKeywords) {
            const re = new RegExp(`\\b${cat}\\b`, "i");
            if (re.test(low)) {
              const matches = wardrobeItems.filter((w) =>
                (w.category || "").toLowerCase().includes(cat)
              );
              for (const m of matches) {
                if (!foundIds.includes(m.id)) foundIds.push(m.id);
                if (foundIds.length >= MAX_ITEMS) break;
              }
            }
            if (foundIds.length >= MAX_ITEMS) break;
          }

          return Array.from(new Set(foundIds)).slice(0, MAX_ITEMS);
        };

        if ((!selIds || selIds.length === 0) && resp.reply) {
          const mentioned = parseMentionedItemsFromReply(resp.reply || "");
          if (mentioned && mentioned.length > 0) selIds = mentioned;
        }
      }
      // Populate debug info so engineers can inspect parsing/mapping behavior
      try {
        const matchedIds = (selIds || []).filter((id) =>
          wardrobeItems.some((w) => w.id === id)
        );
        setDebugInfo({
          rawReply: resp.reply || null,
          structured: structured || [],
          parsedIds: selIds || [],
          matchedIds,
        });
      } catch (e) {
        // swallow debug errors
      }
      // Keep a cleaned version of the reply for UI (strip IDs from human text)
      const stripIdsFromText = (text?: string) => {
        if (!text) return "";
        let cleaned = text;
        // Remove fenced code blocks (```json ... ``` or ```) that may contain the JSON
        cleaned = cleaned.replace(/```(?:json\s*)?[\s\S]*?```/g, "");
        // Remove any inline JSON block containing selected_item_ids
        cleaned = cleaned.replace(
          /\{[\s\S]*\"selected_item_ids\"[\s\S]*\}/g,
          ""
        );
        // Remove ANY remaining JSON-like object blocks (conservative removal of {...} containing a colon or quotes)
        cleaned = cleaned.replace(/\{[^}]*[:\"][^}]*\}/g, "");
        // Remove bracketed ID lists and any remaining square-bracket groups
        cleaned = cleaned.replace(/\[[^\]]+\]/g, "");
        // Remove leftover triple backticks and stray braces/quotes
        cleaned = cleaned.replace(/```/g, "").replace(/[{}"']/g, "");
        // Remove literal escaped newlines (e.g. "\\n\\n") that appear when assistant returns JSON-like text
        cleaned = cleaned.replace(/\\n+/g, " ");
        // Remove common artifact labels that the assistant or parser may append (e.g., 'json reply:', 'reply:', 'explain:', 'tags:', 'image_prompt:')
        cleaned = cleaned.replace(
          /\b(json\s*reply|json|reply|explain)\s*[:\-]\s*/gi,
          ""
        );
        // Remove trailing tags or image_prompt labels and any following content
        cleaned = cleaned.replace(/\b(tags|image_prompt)\s*[:\-][\s\S]*$/i, "");
        // Remove any isolated punctuation streaks like '].' or '.,' that may remain
        cleaned = cleaned.replace(/[\]\[\.,]{1,}/g, " ");
        // Collapse multiple spaces and newlines
        cleaned = cleaned
          .replace(/\s{2,}/g, " ")
          .replace(/\n{2,}/g, "\n")
          .trim();
        return cleaned;
      };

      // Prefer parsed reply from structured JSON if present, otherwise strip IDs from plain text reply
      const cleanedReply = parsedReplyFromJson
        ? stripIdsFromText(parsedReplyFromJson)
        : stripIdsFromText(resp.reply || "");

      setHistory((prev) => [
        {
          prompt: userPrompt,
          reply: cleanedReply,
          timestamp: new Date().toLocaleString(),
          selected_item_ids: selIds,
        },
        ...prev,
      ]);

      // If model returned selected_item_ids, map to local wardrobe items
      if (selIds && selIds.length > 0) {
        let picked = selIds
          .map((id: any) => wardrobeItems.find((w) => w.id === id))
          .filter(Boolean) as WardrobeItem[];

        // Deduplicate by normalized category: treat "t-shirt" and "shirt" as the same logical type
        const seen = new Set<string>();
        let unique: WardrobeItem[] = [];
        for (const p of picked) {
          const key = normalizeCategory(p.category);
          if (!seen.has(key)) {
            unique.push(p);
            seen.add(key);
          }
        }

        // If occasion is interview, avoid including outerwear (jackets) unless user explicitly asked for jacket
        const wantsJacketFromPrompt =
          /\b(jacket|coat|outerwear|blazer)\b/i.test(userPrompt || "") ||
          /\b(jacket|coat|outerwear|blazer)\b/i.test(resp.reply || "");
        if (occasion === "interview" && !wantsJacketFromPrompt) {
          // move any outerwear from unique to alternatives and mark as removed
          const still: WardrobeItem[] = [];
          const moved: WardrobeItem[] = [];
          for (const u of unique) {
            if (normalizeCategory(u.category) === "outerwear") moved.push(u);
            else still.push(u);
          }
          unique = still;
          // ensure moved items are available as alternatives later
          setAlternatives((prev) => [...moved, ...prev]);
        }

        // For interviews prefer fewer items (top + bottom) unless user requested more
        const effectiveMax =
          occasion === "interview" ? Math.min(MAX_ITEMS, 2) : MAX_ITEMS;

        // If we ended up with 0 items after dedupe (unlikely), fall back to a selection from wardrobe
        if (unique.length === 0) {
          const shuffled = [...wardrobeItems].sort(() => Math.random() - 0.5);
          setGeneratedOutfits([
            {
              items: shuffled.slice(
                0,
                Math.min(MAX_ITEMS, wardrobeItems.length)
              ),
              explanation: "Random selection",
            },
          ]);
        } else {
          // Fill up to effectiveMax items with other categories if needed
          if (unique.length < effectiveMax) {
            const filler = wardrobeItems
              .filter((w) => !seen.has(normalizeCategory(w.category)))
              .slice(0, effectiveMax - unique.length);
            unique.push(...filler);
          }
          // After we have a candidate list, remove conflicting tops
          const finalSelection = dedupeConflictingTops(
            unique.slice(0, effectiveMax),
            resp.reply || ""
          );
          // Respect explicit user instruction to exclude jackets
          const jacketIntent = detectJacketIntent(
            userPrompt || resp.reply || ""
          );
          let keptItems = finalSelection.kept;
          let removedItems = finalSelection.removed;
          if (jacketIntent === "exclude") {
            const still: WardrobeItem[] = [];
            const moved: WardrobeItem[] = [];
            for (const it of keptItems) {
              if (normalizeCategory(it.category) === "outerwear")
                moved.push(it);
              else still.push(it);
            }
            keptItems = still;
            removedItems = [...moved, ...removedItems];
          }
          // Ensure minimum items (2) unless user requested fewer
          keptItems = ensureMinItems(keptItems, 2);
          setGeneratedOutfits([
            {
              items: keptItems,
              explanation: cleanedReply || resp.reply || "",
            },
          ]);
          setAlternatives(removedItems);
        }
      } else {
        // fallback: choose a deterministic selection from wardrobe (prefer matching color or category)
        const pick = selectFromWardrobe(
          resp.reply || "",
          wardrobeItems,
          MAX_ITEMS
        );

        // After initial pick, apply top dedupe and honor explicit jacket exclusion
        const finalSelectionFallback = dedupeConflictingTops(
          pick,
          resp.reply || ""
        );
        const jacketIntent = detectJacketIntent(userPrompt || resp.reply || "");
        let fallbackKept = finalSelectionFallback.kept;
        let fallbackRemoved = finalSelectionFallback.removed;

        if (jacketIntent === "exclude") {
          const still: WardrobeItem[] = [];
          const moved: WardrobeItem[] = [];
          for (const it of fallbackKept) {
            if (normalizeCategory(it.category) === "outerwear") moved.push(it);
            else still.push(it);
          }
          fallbackKept = still;
          fallbackRemoved = [...moved, ...fallbackRemoved];
        }

        // Ensure minimum of 2 items for the fallback selection (unless user explicitly requested fewer via prompt — currently we respect minimum 2)
        fallbackKept = ensureMinItems(fallbackKept, 2);

        setGeneratedOutfits([
          {
            items: fallbackKept,
            explanation: cleanedReply || resp.reply || "Random selection",
          },
        ]);
        setAlternatives(fallbackRemoved);
      }

      // Show cleaned reply text (no ids) to the user. Avoid falling back to raw resp.reply (which may contain JSON)
      const replyForUi =
        parsedReplyFromJson || cleanedReply || (resp as any).explain || null;
      if (replyForUi) setReplyText(replyForUi);
      // Prefer structured 'explain' when available, otherwise use the replyForUi so users see natural-language reasons
      // But treat backend sentinel 'Unable to parse JSON' as non-informative and prefer replyForUi instead
      const rawExplain = (resp as any).explain;
      const finalExplain =
        rawExplain &&
        String(rawExplain).toLowerCase().includes("unable to parse json")
          ? replyForUi
          : rawExplain || replyForUi;
      setExplain(finalExplain);
      if ((resp as any).follow_ups) setFollowUps((resp as any).follow_ups);
      // Ensure freshly generated outfits are not marked as "last from history"
      setIsLastFromHistory(false);
    } catch (err) {
      // clear debug info on error
      setDebugInfo({});
      const shuffled = [...wardrobeItems].sort(() => Math.random() - 0.5);
      setGeneratedOutfits([
        {
          items: shuffled.slice(0, Math.min(MAX_ITEMS, wardrobeItems.length)),
          explanation: "Random selection",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: extract all color words from text
  const extractColors = (text: string) => {
    if (!text) return [];
    const colors = [
      "red",
      "blue",
      "green",
      "black",
      "white",
      "yellow",
      "pink",
      "purple",
      "brown",
      "grey",
      "gray",
      "beige",
      "orange",
      "navy",
      "maroon",
    ];
    const low = text.toLowerCase();
    return colors.filter((c) => low.includes(c));
  };

  // Generate a short 1-2 line prompt/summary for the Outfit Details card.
  // Prefer a concise summary from `explain`. If missing, synthesize from items and occasion.
  const makeShortPrompt = (
    explainText?: string | null,
    outfit?: OutfitSuggestion
  ) => {
    const maxChars = 200;
    const clean = (s = "") => s.replace(/\s+/g, " ").trim();
    if (explainText) {
      const s = clean(explainText);
      // split into sentences and take up to 2
      const parts = s
        .split(/[.?!]\s/)
        .map((p) => p.trim())
        .filter(Boolean);
      let short = parts.slice(0, 2).join(". ");
      if (!short && s) short = s;
      if (short.length > maxChars) short = short.slice(0, maxChars - 3) + "...";
      return short;
    }
    if (outfit && outfit.items && outfit.items.length > 0) {
      const names = outfit.items
        .map((i) => i.name)
        .filter(Boolean)
        .slice(0, 3);
      const occ = outfit.occasion ? ` for ${outfit.occasion}` : "";
      let short = `${names.join(" + ")}${occ}`;
      short = clean(short);
      if (short.length > maxChars) short = short.slice(0, maxChars - 3) + "...";
      return short;
    }
    return "";
  };

  const isTopCategory = (cat?: string) => {
    if (!cat) return false;
    const c = cat.toLowerCase();
    return (
      c.includes("shirt") ||
      c.includes("t-shirt") ||
      c.includes("tshirt") ||
      c.includes("top") ||
      c.includes("jumper") ||
      c.includes("blouse")
    );
  };

  // Normalize categories into broad groups so we suggest only one item per logical type
  const normalizeCategory = (cat?: string) => {
    if (!cat) return "other";
    const c = cat.toLowerCase();
    if (
      c.includes("shirt") ||
      c.includes("t-shirt") ||
      c.includes("tshirt") ||
      c.includes("top") ||
      c.includes("jumper") ||
      c.includes("blouse") ||
      c.includes("tee")
    )
      return "top";
    if (
      c.includes("jean") ||
      c.includes("pant") ||
      c.includes("trouser") ||
      c.includes("short") ||
      c.includes("skirt")
    )
      return "bottom";
    if (c.includes("dress")) return "dress";
    if (c.includes("jacket") || c.includes("coat") || c.includes("blazer"))
      return "outerwear";
    if (c.includes("sweater") || c.includes("hoodie") || c.includes("cardigan"))
      return "top";
    if (c.includes("shoe") || c.includes("sneaker") || c.includes("boot"))
      return "footwear";
    return "other";
  };

  // Detect whether the user explicitly asked to include or exclude jackets/outerwear
  const detectJacketIntent = (
    text?: string
  ): "include" | "exclude" | "none" => {
    if (!text) return "none";
    const low = text.toLowerCase();

    // quick exact-word check
    const mentionRegex = /\b(jacket|coat|outerwear|blazer)\b/;
    if (!mentionRegex.test(low)) return "none";

    // token-based context windowing: look for negation/affirmation words within a few tokens before the garment mention
    const tokens = low
      .replace(/[.,!?;:()\[\]\"]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const negationWords = new Set([
      "no",
      "dont",
      "don't",
      "do not",
      "never",
      "without",
      "exclude",
      "avoid",
      "skip",
    ]);
    const positiveWords = new Set([
      "include",
      "including",
      "add",
      "with",
      "wear",
      "put",
      "wearing",
    ]);

    // find all indices where garment words appear
    const garmentWords = new Set(["jacket", "coat", "outerwear", "blazer"]);
    const indices: number[] = [];
    tokens.forEach((t, i) => {
      // strip simple plural 's'
      const bare = t.replace(/s$/i, "");
      if (garmentWords.has(bare)) indices.push(i);
    });

    // Look back up to 4 tokens for negation/positive cues
    for (const idx of indices) {
      const start = Math.max(0, idx - 4);
      const window = tokens.slice(start, idx);
      // join to handle multiword negations like 'do not'
      const windowStr = window.join(" ");
      // check explicit multiword negations first
      if (/\bdo not\b/.test(windowStr) || /\bdon'?t\b/.test(windowStr))
        return "exclude";
      // any negation token in the window implies exclusion intent
      for (const w of window) {
        if (negationWords.has(w)) return "exclude";
      }
      // any positive token in the window implies include intent
      for (const w of window) {
        if (positiveWords.has(w)) return "include";
      }
      // also patterns like 'give me' preceded by 'dont' -> 'dont give me jacket' will be detected because 'dont' is in window
    }

    // if no contextual negation but garment is mentioned, treat as include
    return "include";
  };

  // Ensure at least `minItems` are present by filling with distinct-category items
  const ensureMinItems = (items: WardrobeItem[], minItems = 2) => {
    const result = [...items];
    const seen = new Set(result.map((i) => normalizeCategory(i.category)));
    if (result.length >= minItems) return result;
    for (const w of wardrobeItems) {
      if (result.length >= minItems) break;
      const key = normalizeCategory(w.category);
      if (!seen.has(key)) {
        result.push(w);
        seen.add(key);
      }
    }
    return result;
  };

  const itemMatchesColor = (item: WardrobeItem, color: string) => {
    return (
      item.name.toLowerCase().includes(color) ||
      item.category.toLowerCase().includes(color)
    );
  };

  // Given a selected list of items, prefer tops that match the color in assistant reply and move conflicting tops to alternatives
  const dedupeConflictingTops = (
    items: WardrobeItem[],
    assistantReply: string
  ) => {
    const removed: WardrobeItem[] = [];
    const kept: WardrobeItem[] = [];
    const mentionedColors = extractColors(assistantReply);

    // split tops and others
    const tops = items.filter((i) => isTopCategory(i.category));
    const others = items.filter((i) => !isTopCategory(i.category));

    if (tops.length <= 1) {
      return { kept: items, removed };
    }

    // If colors are mentioned in the reply, strictly enforce that choice
    if (mentionedColors.length > 0) {
      // Find a top that matches any mentioned color, prioritizing first mentioned color
      let chosenTop: WardrobeItem | undefined;
      for (const color of mentionedColors) {
        chosenTop = tops.find((t) => itemMatchesColor(t, color));
        if (chosenTop) break;
      }

      if (!chosenTop) {
        // If no top matches mentioned colors, all tops go to alternatives
        removed.push(...tops);
        // And we'll ask backend for new suggestions
        console.warn(
          "No matching top found for colors:",
          mentionedColors.join(", ")
        );
      } else {
        // Keep the matching top, move others to alternatives
        kept.push(chosenTop);
        tops.forEach((t) => {
          if (t.id !== chosenTop!.id) removed.push(t);
        });
      }
    } else {
      // No colors mentioned - keep first top
      kept.push(tops[0]);
      tops.slice(1).forEach((t) => removed.push(t));
    }

    // fill kept with others (bottoms etc)
    for (const o of others) {
      if (kept.length < MAX_ITEMS) kept.push(o);
      else removed.push(o);
    }

    // If we didn't keep any tops, retry with first available
    if (!kept.some((item) => isTopCategory(item.category))) {
      kept.unshift(tops[0]);
      removed.splice(
        removed.findIndex((r) => r.id === tops[0].id),
        1
      );
    }

    return { kept, removed };
  };

  // Select up to `maxItems` items from the wardrobe based on assistant reply (colors/categories)
  function selectFromWardrobe(
    reply: string,
    wardrobe: WardrobeItem[],
    maxItems: number
  ): WardrobeItem[] {
    if (!wardrobe || wardrobe.length === 0) return [];
    const colors = extractColors(reply || "");
    // Lightweight occasion detection from prompt/reply (stricter: require >=2 keyword matches)
    const lowReply = (reply || "").toLowerCase();
    const occasion = (() => {
      const buckets: { [key: string]: string[] } = {
        interview: ["interview", "job interview", "panel", "interview outfit"],
        date: ["date", "dating", "date night"],
        drive: ["drive", "long drive", "road trip"],
        party: ["party", "club", "wedding", "celebration", "party night"],
        casual: ["casual", "everyday", "casual outing"],
      };
      for (const key of Object.keys(buckets)) {
        let matches = 0;
        for (const kw of buckets[key]) {
          if (
            new RegExp(
              `\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`
            ).test(lowReply)
          )
            matches += 1;
        }
        if (matches >= 2) return key;
      }
      return "other";
    })();

    // Prefer items that match mentioned colors
    let candidates: WardrobeItem[] = [];
    if (colors.length > 0) {
      for (const color of colors) {
        const matches = wardrobe.filter((w) => itemMatchesColor(w, color));
        for (const m of matches) {
          if (!candidates.find((c) => c.id === m.id)) candidates.push(m);
          if (candidates.length >= maxItems) break;
        }
        if (candidates.length >= maxItems) break;
      }
    }

    // If not enough, prefer a top + a bottom (or any distinct categories)
    if (candidates.length < maxItems) {
      const tops = wardrobe.filter((w) => isTopCategory(w.category));
      const others = wardrobe.filter((w) => !isTopCategory(w.category));
      if (tops.length > 0 && others.length > 0) {
        if (!candidates.find((c) => c.id === tops[0].id))
          candidates.push(tops[0]);
        if (
          candidates.length < maxItems &&
          !candidates.find((c) => c.id === others[0].id)
        )
          candidates.push(others[0]);
      }
    }

    // Ensure we include a bottom (jeans/pants) when available for mens' pairings.
    const bottoms = wardrobe.filter(
      (w) => normalizeCategory(w.category) === "bottom"
    );
    if (
      bottoms.length > 0 &&
      !candidates.find((c) => normalizeCategory(c.category) === "bottom")
    ) {
      // try to pick a bottom that matches a mentioned color first
      let chosenBottom: WardrobeItem | undefined;
      for (const color of colors) {
        chosenBottom = bottoms.find((b) => itemMatchesColor(b, color));
        if (chosenBottom) break;
      }
      if (!chosenBottom) chosenBottom = bottoms[0];
      if (
        chosenBottom &&
        candidates.length < maxItems &&
        !candidates.find((c) => c.id === chosenBottom!.id)
      ) {
        candidates.push(chosenBottom);
      }
    }

    // If the prompt/reply explicitly asks for a jacket or outerwear, try to include one when possible
    // use detectJacketIntent to avoid treating negative mentions as requests
    const jacketIntent = detectJacketIntent(reply || "");
    const outerwear = wardrobe.filter(
      (w) => normalizeCategory(w.category) === "outerwear"
    );
    // Don't auto-add outerwear for interviews unless the user explicitly asked for it
    if (
      jacketIntent === "include" &&
      outerwear.length > 0 &&
      candidates.length < maxItems &&
      occasion !== "interview"
    ) {
      let chosenOuter = outerwear.find((o) =>
        colors.some((c) => itemMatchesColor(o, c))
      );
      if (!chosenOuter) chosenOuter = outerwear[0];
      if (chosenOuter && !candidates.find((c) => c.id === chosenOuter!.id))
        candidates.push(chosenOuter);
    }

    // For interviews, prefer a formal shirt (not a t-shirt) when available
    if (occasion === "interview") {
      const formalTop = wardrobe.find((w) => {
        const name = (w.name || "").toLowerCase();
        const cat = (w.category || "").toLowerCase();
        return (
          (/\bshirt\b/.test(name) || /\bshirt\b/.test(cat)) &&
          !/t-?shirt/.test(name) &&
          !/t-?shirt/.test(cat)
        );
      });
      if (formalTop) {
        // Replace any existing top candidate (like a t-shirt) with the formal shirt, or add if space
        const topIndex = candidates.findIndex(
          (c) => normalizeCategory(c.category) === "top"
        );
        if (topIndex !== -1) {
          candidates.splice(topIndex, 1, formalTop);
        } else if (
          candidates.length < maxItems &&
          !candidates.find((c) => c.id === formalTop.id)
        ) {
          candidates.push(formalTop);
        }
      }
      // Also avoid adding outerwear by default for interviews
    }

    // Fill remaining slots with any distinct normalized-category items
    const seenCats = new Set(
      candidates.map((c) => normalizeCategory(c.category))
    );
    for (const w of wardrobe) {
      if (candidates.length >= maxItems) break;
      const key = normalizeCategory(w.category);
      if (seenCats.has(key)) continue;
      candidates.push(w);
      seenCats.add(key);
    }

    // Final fallback: random
    if (candidates.length === 0) {
      const shuffled = [...wardrobe].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(maxItems, wardrobe.length));
    }

    return candidates.slice(0, Math.min(maxItems, candidates.length));
  }

  // Ensure selected items align with words in the assistant reply (colors/categories).
  const ensureMatchesReply = (
    items: WardrobeItem[],
    reply: string,
    maxItems = MAX_ITEMS
  ): WardrobeItem[] => {
    if (!reply || !items || items.length === 0) return items.slice(0, maxItems);
    const colors = extractColors(reply || "");
    const low = (reply || "").toLowerCase();
    const categoryKeywords = [
      "shirt",
      "t-shirt",
      "tshirt",
      "top",
      "jeans",
      "pant",
      "pants",
      "trouser",
      "shorts",
      "dress",
      "skirt",
      "jacket",
      "coat",
      "sweater",
      "hoodie",
    ];

    const result: WardrobeItem[] = [];
    const used = new Set<string>();

    for (let i = 0; i < items.length && result.length < maxItems; i++) {
      const it = items[i];
      if (!it) continue;
      let ok = false;

      if (colors.length > 0) {
        for (const c of colors) {
          if (
            (it.name || "").toLowerCase().includes(c) ||
            (it.category || "").toLowerCase().includes(c)
          ) {
            ok = true;
            break;
          }
        }
      }

      if (!ok) {
        for (const cat of categoryKeywords) {
          const re = new RegExp(`\\b${cat}\\b`, "i");
          if (re.test(low)) {
            if ((it.category || "").toLowerCase().includes(cat)) {
              ok = true;
              break;
            }
          }
        }
      }

      if (ok) {
        result.push(it);
        used.add(it.id);
        continue;
      }

      // Try to find a better match in the wardrobe: same category + matching color
      let found: WardrobeItem | undefined;
      if (colors.length > 0) {
        found = wardrobeItems.find(
          (w) =>
            !used.has(w.id) &&
            (w.category || "").toLowerCase() ===
              (it.category || "").toLowerCase() &&
            colors.some(
              (c) =>
                (w.name || "").toLowerCase().includes(c) ||
                (w.category || "").toLowerCase().includes(c)
            )
        );
      }

      if (!found && colors.length > 0) {
        // any item with the color
        found = wardrobeItems.find(
          (w) =>
            !used.has(w.id) &&
            colors.some(
              (c) =>
                (w.name || "").toLowerCase().includes(c) ||
                (w.category || "").toLowerCase().includes(c)
            )
        );
      }

      if (!found) {
        // fallback: any other item of same category
        found = wardrobeItems.find(
          (w) =>
            !used.has(w.id) &&
            (w.category || "")
              .toLowerCase()
              .includes((it.category || "").toLowerCase())
        );
      }

      if (found) {
        result.push(found);
        used.add(found.id);
      } else {
        result.push(it);
        used.add(it.id);
      }
    }

    return result.slice(0, maxItems);
  };

  // On mount: restore last wardrobe-mode chat if present so the same suggestions persist across navigation
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const userId = ensureUserId();
        const data = await fetchChatHistory(userId);
        if (!mounted) return;
        let chats: any[] = data.chats || [];
        // Normalize timestamps and sort descending so we pick the newest wardrobe chat
        chats = chats
          .map((c) => ({
            ...c,
            _ts:
              c.timestamp && c.timestamp.seconds
                ? c.timestamp.seconds * 1000
                : c.timestamp
                ? new Date(c.timestamp).getTime()
                : 0,
          }))
          .sort((a, b) => (b._ts || 0) - (a._ts || 0));

        // find most recent wardrobe-mode chat (chat stored with mode === 'wardrobe' or legacy selected_item_ids)
        const wardrobeChat = chats.find(
          (c) =>
            c &&
            (c.mode === "wardrobe" ||
              (c.response && c.response.selected_item_ids))
        );
        if (!wardrobeChat) return;

        const resp = wardrobeChat.response || {};
        if (resp.selected_item_ids && resp.selected_item_ids.length > 0) {
          let picked = resp.selected_item_ids
            .map((id: string) => wardrobeItems.find((w) => w.id === id))
            .filter(Boolean) as WardrobeItem[];

          // Deduplicate categories like in generateOutfit (use normalized categories)
          const seen = new Set<string>();
          const unique: WardrobeItem[] = [];
          for (const p of picked) {
            const key = normalizeCategory(p.category);
            if (!seen.has(key)) {
              unique.push(p);
              seen.add(key);
            }
          }
          if (unique.length === 0) {
            const shuffled = [...wardrobeItems].sort(() => Math.random() - 0.5);
            setGeneratedOutfits([
              {
                items: shuffled.slice(
                  0,
                  Math.min(MAX_ITEMS, wardrobeItems.length)
                ),
                explanation:
                  (wardrobeChat.response && wardrobeChat.response.reply) || "",
              },
            ]);
            setIsLastFromHistory(true);
          } else {
            if (unique.length < MAX_ITEMS) {
              const filler = wardrobeItems
                .filter((w) => !seen.has(normalizeCategory(w.category)))
                .slice(0, MAX_ITEMS - unique.length);
              unique.push(...filler);
            }
            setGeneratedOutfits([
              {
                items: unique.slice(0, MAX_ITEMS),
                explanation:
                  (wardrobeChat.response && wardrobeChat.response.reply) || "",
              },
            ]);
            // also show the reply text in the header so it's clear what was suggested
            setReplyText(
              (wardrobeChat.response &&
                (wardrobeChat.response.reply ||
                  wardrobeChat.response.explain)) ||
                ""
            );
            setIsLastFromHistory(true);
          }
        }

        if (resp.explain) setExplain(resp.explain);
        if (resp.follow_ups) setFollowUps(resp.follow_ups);
      } catch (err) {
        // ignore restore errors — UI will work normally
      }
    };
    restore();
    return () => {
      mounted = false;
    };
  }, [wardrobeItems]);

  // Fetch wardrobe/chat-derived history from backend when history modal opens
  useEffect(() => {
    if (!showHistory) return;
    let mounted = true;
    (async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      setHistory([]);
      try {
        const userId = ensureUserId();
        const data = await fetchChatHistory(userId);
        if (!mounted) return;
        const chats: any[] = data.chats || [];
        // Pick only wardrobe-mode chats or chats that have selected_item_ids
        const wardrobeChats = chats.filter(
          (c) =>
            c &&
            (c.mode === "wardrobe" ||
              (c.response && c.response.selected_item_ids))
        );

        const entries = wardrobeChats
          .map((c) => {
            const resp = c.response || {};
            // normalize timestamp
            let ts = new Date();
            if (c.timestamp && c.timestamp.seconds) {
              ts = new Date(c.timestamp.seconds * 1000);
            } else if (c.timestamp) {
              try {
                ts = new Date(c.timestamp);
              } catch {}
            }
            return {
              prompt: c.message || resp.message || c.prompt || "",
              reply: resp.reply || resp.explain || "",
              timestamp: ts.toLocaleString(),
              selected_item_ids: resp.selected_item_ids || [],
            };
          })
          .filter(Boolean)
          .sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );

        setHistory(entries);
      } catch (err: any) {
        console.error("Failed to fetch wardrobe history:", err);
        if (!mounted) return;
        setHistoryError(err?.message || "Unable to load history");
      } finally {
        if (mounted) setHistoryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showHistory]);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {showHistory && (
        <WardrobeHistory
          entries={history}
          loading={historyLoading}
          error={historyError}
          onClose={() => setShowHistory(false)}
          onRestoreOutfit={(entry: {
            prompt: string;
            reply: string;
            selected_item_ids: string[];
          }) => {
            setShowHistory(false);
            setPrompt(entry.prompt);
            if (entry.selected_item_ids.length > 0) {
              const items = entry.selected_item_ids
                .map((id: string) => wardrobeItems.find((w) => w.id === id))
                .filter(Boolean) as WardrobeItem[];
              if (items.length > 0) {
                setGeneratedOutfits([{ items, explanation: entry.reply }]);
                setReplyText(entry.reply);
                setIsLastFromHistory(true);
              }
            }
          }}
        />
      )}

      <div className="bg-gradient-to-br from-pink-600 to-purple-600 text-white px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("dashboard")}>
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div>
              <h1 className="text-white">Wardrobe Assist</h1>
              <p className="text-white/80 text-sm">
                AI-powered outfit suggestions
              </p>
            </div>
          </div>
          {/* <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm text-white hover:bg-white/20 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={() => setDebugOpen((s) => !s)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm text-white hover:bg-white/20 transition-colors"
            >
              <span>Debug</span>
            </button>
          </div> */}
        </div>
      </div>

      <div className="px-6 py-6">
        {wardrobeItems.length < 3 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="mb-2">Not Enough Items</h2>
            <p className="text-gray-600 mb-6">
              Add at least 3 items to your wardrobe to generate outfit
              suggestions
            </p>
            <Button
              onClick={() => onNavigate("wardrobe")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Add Items to Wardrobe
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Ask the assistant (e.g. "I have to go on a date tonight")
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type occasion or instruction (date, party, interview...)"
                    className="flex-1 px-3 py-2 rounded border"
                  />
                  <div className="flex gap-2">
                    {/* <select
                      value={outfitCount}
                      onChange={(e) => setOutfitCount(Number(e.target.value))}
                      className="px-3 py-2 rounded border bg-white"
                    >
                      <option value={1}>1 Outfit</option>
                      <option value={5}>5 Outfits</option>
                    </select> */}
                    <Button
                      onClick={() => generateOutfit()}
                      disabled={isGenerating}
                      className="w-full md:w-auto bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Outfit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {isGenerating ? (
              <div className="p-6 py-14 h-20">
                <div className="border rounded-lg p-10 min-h-40 py-20 bg-white flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-slate-300 rounded-full animate-spin" />
                    <div className="text-sm text-slate-600 font-medium">
                      Generating outfit…
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              generatedOutfits.length > 0 && (
                <div>
                  <div>
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6 gap-4 md:gap-0">
                      <div className="text-center md:text-left">
                        <h2 className="mb-1">
                          Your AI-Generated{" "}
                          {generatedOutfits.length > 1 ? "Outfits" : "Outfit"}
                        </h2>
                        <p className="text-gray-600">
                          Here's what we recommend for you today
                        </p>
                        {replyText && (
                          <p className="mt-2 text-gray-700 font-medium">
                            {replyText}
                          </p>
                        )}
                      </div>

                      {debugOpen && (
                        <Card className="mt-4 p-3 bg-gray-50">
                          <div className="text-sm text-slate-800">
                            <div className="mb-2 font-medium">Debug Info</div>
                            <div className="text-xs mb-2">
                              <div className="font-semibold">Raw reply</div>
                              <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border mt-1">
                                {debugInfo.rawReply || "(none)"}
                              </pre>
                            </div>
                            <div className="text-xs mb-2">
                              <div className="font-semibold">
                                Structured JSON objects
                              </div>
                              <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border mt-1">
                                {debugInfo.structured &&
                                debugInfo.structured.length > 0
                                  ? JSON.stringify(
                                      debugInfo.structured,
                                      null,
                                      2
                                    )
                                  : "(none)"}
                              </pre>
                            </div>
                            <div className="text-xs mb-2">
                              <div className="font-semibold">
                                Parsed selected_item_ids
                              </div>
                              <div className="mt-1">
                                <div className="text-xs font-medium mb-1">
                                  Matched IDs (resolved)
                                </div>
                                {(debugInfo.matchedIds || []).length > 0 ? (
                                  <ul className="list-disc ml-5 text-xs">
                                    {(debugInfo.matchedIds || []).map((id) => {
                                      const w = wardrobeItems.find(
                                        (x) => x.id === id
                                      );
                                      return (
                                        <li key={id}>
                                          {id}{" "}
                                          {w
                                            ? `— ${w.name} (${w.category})`
                                            : "(not found)"}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <div>(none)</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                    <Button
                      onClick={() => generateOutfit()}
                      disabled={isGenerating}
                      size="sm"
                      variant="outline"
                      className="w-full md:w-auto"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          isGenerating ? "animate-spin" : ""
                        }`}
                      />
                      Regenerate
                    </Button>
                  </div>

                  <div className="space-y-8">
                    {generatedOutfits.map((outfit, outfitIndex) => (
                      <div
                        key={outfitIndex}
                        className="border rounded-lg p-6 bg-white"
                      >
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">
                            {isLastFromHistory && outfitIndex === 0
                              ? "Last generated outfit"
                              : outfit.occasion || `Outfit ${outfitIndex + 1}`}
                          </h3>
                          {/* {outfit.explanation &&
                            (() => {
                              // Avoid showing the same explanation twice: if the global replyText
                              // (shown above the outfits) is identical to this outfit's explanation,
                              // don't render it here to prevent duplicate text.
                              const normalize = (s?: string | null) =>
                                (s || "")
                                  .replace(/\s+/g, " ")
                                  .trim()
                                  .toLowerCase();
                              if (
                                normalize(outfit.explanation) ===
                                normalize(replyText)
                              ) {
                                return null;
                              }
                              return (
                                <p className="text-gray-600 mt-1">
                                  {outfit.explanation}
                                </p>
                              );
                            })()} */}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {outfit.items.map((item, index) => (
                            <Card
                              key={item.id}
                              className="p-4 flex flex-col md:flex-row items-center gap-4"
                            >
                              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-purple-600">
                                  {index + 1}
                                </span>
                              </div>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg"
                              />
                              <div className="flex-1 text-center md:text-left">
                                <p className="mb-1">{item.name}</p>
                                <p className="text-gray-600 text-sm">
                                  {item.category}
                                </p>

                                <div className="mt-2">
                                  <button
                                    className="text-sm text-purple-600 hover:underline flex items-center gap-2 mx-auto md:mx-0"
                                    onClick={async () => {
                                      try {
                                        setItemLoading((s) => ({
                                          ...s,
                                          [item.id]: true,
                                        }));
                                        const userId = ensureUserId();
                                        const q = `Why did you pick the wardrobe item with id ${item.id} and name "${item.name}" for this outfit? Please answer concisely in Hinglish.`;
                                        const resp = await sendChat(userId, q, {
                                          mode: "wardrobe",
                                        });
                                        const reason =
                                          resp.explain ||
                                          resp.reply ||
                                          "No explanation available";
                                        setItemExplains((s) => ({
                                          ...s,
                                          [item.id]: reason,
                                        }));
                                      } catch (err) {
                                        setItemExplains((s) => ({
                                          ...s,
                                          [item.id]:
                                            "Unable to fetch explanation",
                                        }));
                                      } finally {
                                        setItemLoading((s) => ({
                                          ...s,
                                          [item.id]: false,
                                        }));
                                      }
                                    }}
                                  >
                                    {itemLoading[item.id] ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
                                        <span>Thinking...</span>
                                      </>
                                    ) : (
                                      <span>Why this?</span>
                                    )}
                                  </button>

                                  <div className="mt-2 min-h-[48px]">
                                    <div
                                      className={`transition-opacity ${
                                        itemExplains[item.id]
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    >
                                      {itemExplains[item.id] && (
                                        <p className="text-sm text-gray-700">
                                          {itemExplains[item.id]}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {alternatives.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm text-gray-700">Alternatives</h3>
                        <button
                          className="text-sm text-purple-600 hover:underline"
                          onClick={() => setShowAlternatives((s) => !s)}
                        >
                          {showAlternatives ? "Hide" : "Show"}
                        </button>
                      </div>

                      {showAlternatives && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {alternatives.map((alt) => (
                            <Card
                              key={alt.id}
                              className="p-3 flex flex-col md:flex-row items-center gap-3"
                            >
                              <img
                                src={alt.image}
                                className="w-14 h-14 md:w-16 md:h-16 object-cover rounded"
                                alt={alt.name}
                              />
                              <div className="flex-1 text-center md:text-left">
                                <p className="text-sm mb-1">{alt.name}</p>
                                <p className="text-xs text-gray-500 mb-2">
                                  {alt.category}
                                </p>
                                <div className="flex gap-2 justify-center md:justify-start">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const outfitIndex =
                                        generatedOutfits.findIndex((outfit) =>
                                          outfit.items.some(
                                            (item) =>
                                              item.category === alt.category
                                          )
                                        );
                                      if (outfitIndex !== -1) {
                                        const itemIndex = generatedOutfits[
                                          outfitIndex
                                        ].items.findIndex(
                                          (item) =>
                                            item.category === alt.category
                                        );
                                        if (itemIndex !== -1) {
                                          const newOutfits = [
                                            ...generatedOutfits,
                                          ];
                                          const replaced =
                                            newOutfits[outfitIndex].items[
                                              itemIndex
                                            ];
                                          newOutfits[outfitIndex].items[
                                            itemIndex
                                          ] = alt;
                                          setGeneratedOutfits(newOutfits);
                                          setAlternatives((prev) => [
                                            replaced,
                                            ...prev.filter(
                                              (a) => a.id !== alt.id
                                            ),
                                          ]);
                                        }
                                      }
                                    }}
                                  >
                                    Replace
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setAlternatives((prev) =>
                                        prev.filter((a) => a.id !== alt.id)
                                      )
                                    }
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {followUps.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {followUps.map((f) => (
                          <button
                            key={f}
                            onClick={() => generateOutfit(f)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(explain || (generatedOutfits && generatedOutfits[0])) && (
                    <Card className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="flex gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-1" />
                        <div>
                          <h3 className="mb-2">Outfit Details</h3>
                          <p className="text-gray-700">
                            {makeShortPrompt(explain, generatedOutfits[0])}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
