export function tryParseJsonFromMarkdown(text: string) {
  // Always return a structured object even when JSON is not present.
  // 1) Try to parse any fenced JSON blocks
  const objects: any[] = [];
  const fencedRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let m: RegExpExecArray | null;
  while ((m = fencedRegex.exec(text)) !== null) {
    try {
      const obj = JSON.parse(m[1]);
      objects.push(obj);
    } catch {
      // ignore invalid fenced JSON blocks
    }
  }

  // 2) Look for a trailing inline JSON object with selected_item_ids
  let replyText = text;
  let selectedIds: string[] | undefined;
  const tailMatch = text.match(/\{[\s\S]*?"selected_item_ids"\s*:\s*\[[^\]]*\][\s\S]*\}\s*$/i);
  if (tailMatch && typeof tailMatch.index === 'number') {
    const jsonStr = tailMatch[0];
    try {
      const obj = JSON.parse(jsonStr);
      if (Array.isArray(obj.selected_item_ids)) {
        selectedIds = obj.selected_item_ids.map((v: any) => String(v));
        // remove the JSON tail from the human reply
        replyText = text.slice(0, tailMatch.index).trim();
      }
      objects.push(obj);
    } catch {
      // keep original text if parse fails
    }
  }

  // 3) Consolidate data from any parsed objects
  let replyFromJson: string | undefined;
  let explain: string | undefined;
  let tags: any = undefined;
  let image_prompt: string | undefined;

  for (const o of objects) {
    if (typeof o !== 'object' || o == null) continue;
    if (!replyFromJson && typeof o.reply === 'string') replyFromJson = o.reply;
    if (!explain && typeof o.explain === 'string') explain = o.explain;
    if (!image_prompt && typeof o.image_prompt === 'string') image_prompt = o.image_prompt;
    if (!tags && o.tags) tags = o.tags;
    if (!selectedIds && Array.isArray(o.selected_item_ids)) {
      selectedIds = o.selected_item_ids.map((v: any) => String(v));
    }
  }

  const reply = (replyFromJson || replyText || '').toString();
  return {
    reply,
    explain: explain || undefined,
    tags: tags || [],
    image_prompt,
    selected_item_ids: selectedIds,
  };
}


