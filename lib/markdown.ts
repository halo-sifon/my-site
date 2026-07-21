export type MarkdownInline =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "code";
      text: string;
    }
  | {
      type: "link";
      text: string;
      href: string;
    };

export type MarkdownBlock =
  | {
      type: "heading";
      level: 1 | 2;
      children: MarkdownInline[];
    }
  | {
      type: "paragraph";
      children: MarkdownInline[];
    }
  | {
      type: "list";
      items: MarkdownInline[][];
    };

function pushText(tokens: MarkdownInline[], text: string) {
  if (!text) {
    return;
  }

  const lastToken = tokens.at(-1);
  if (lastToken?.type === "text") {
    lastToken.text += text;
    return;
  }

  tokens.push({ type: "text", text });
}

function findNextSyntaxIndex(text: string, startIndex: number) {
  const codeIndex = text.indexOf("`", startIndex);
  const linkIndex = text.indexOf("[", startIndex);

  if (codeIndex === -1) {
    return linkIndex;
  }

  if (linkIndex === -1) {
    return codeIndex;
  }

  return Math.min(codeIndex, linkIndex);
}

function isSafeLinkHref(href: string) {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseMarkdownInline(text: string): MarkdownInline[] {
  const tokens: MarkdownInline[] = [];
  let index = 0;

  while (index < text.length) {
    const syntaxIndex = findNextSyntaxIndex(text, index);
    if (syntaxIndex === -1) {
      pushText(tokens, text.slice(index));
      break;
    }

    pushText(tokens, text.slice(index, syntaxIndex));

    if (text[syntaxIndex] === "`") {
      const closingIndex = text.indexOf("`", syntaxIndex + 1);
      if (closingIndex === -1) {
        pushText(tokens, text.slice(syntaxIndex));
        break;
      }

      tokens.push({
        type: "code",
        text: text.slice(syntaxIndex + 1, closingIndex),
      });
      index = closingIndex + 1;
      continue;
    }

    const closeBracketIndex = text.indexOf("](", syntaxIndex + 1);
    const closeParenIndex =
      closeBracketIndex === -1
        ? -1
        : text.indexOf(")", closeBracketIndex + 2);

    if (closeBracketIndex === -1 || closeParenIndex === -1) {
      pushText(tokens, text[syntaxIndex]);
      index = syntaxIndex + 1;
      continue;
    }

    const label = text.slice(syntaxIndex + 1, closeBracketIndex);
    const href = text.slice(closeBracketIndex + 2, closeParenIndex).trim();

    if (!label || !isSafeLinkHref(href)) {
      pushText(tokens, text.slice(syntaxIndex, closeParenIndex + 1));
      index = closeParenIndex + 1;
      continue;
    }

    tokens.push({ type: "link", text: label, href });
    index = closeParenIndex + 1;
  }

  return tokens;
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: MarkdownInline[][] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }

    blocks.push({
      type: "paragraph",
      children: parseMarkdownInline(paragraphLines.join(" ")),
    });
    paragraphLines.length = 0;
  }

  function flushList() {
    if (listItems.length === 0) {
      return;
    }

    blocks.push({ type: "list", items: [...listItems] });
    listItems.length = 0;
  }

  for (const rawLine of markdown.replaceAll("\r\n", "\n").split("\n")) {
    const line = rawLine.trimEnd();
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2,
        children: parseMarkdownInline(headingMatch[2].trim()),
      });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(parseMarkdownInline(line.slice(2).trim()));
      continue;
    }

    flushList();
    paragraphLines.push(trimmedLine);
  }

  flushParagraph();
  flushList();

  return blocks;
}
