export interface ContentPart {
  text: string;
  isTag: boolean;
}

export function splitContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const re = /(^|\s)(#[\w]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ text: content.slice(last, match.index + match[1].length), isTag: false });
    }
    parts.push({ text: match[2], isTag: true });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push({ text: content.slice(last), isTag: false });
  }
  if (parts.length === 0) parts.push({ text: content, isTag: false });
  return parts;
}

export const REACTIONS: { kind: string; emoji: string; label: string }[] = [
  { kind: 'like', emoji: '👍', label: 'Like' },
  { kind: 'love', emoji: '❤️', label: 'Love' },
  { kind: 'haha', emoji: '😂', label: 'Haha' },
  { kind: 'wow', emoji: '😮', label: 'Wow' },
  { kind: 'sad', emoji: '😢', label: 'Sad' },
  { kind: 'angry', emoji: '😡', label: 'Angry' },
];

export function reactionEmoji(kind: string | null | undefined): string {
  if (!kind) return '';
  return REACTIONS.find((r) => r.kind === kind)?.emoji ?? '';
}
