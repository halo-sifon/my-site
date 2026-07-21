import { Fragment, type ReactNode } from "react";

import {
  parseMarkdownBlocks,
  type MarkdownBlock,
  type MarkdownInline,
} from "@/lib/markdown";

type MarkdownContentProps = {
  content: string;
  className?: string;
  compact?: boolean;
};

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function renderInline(tokens: MarkdownInline[], keyPrefix: string) {
  return tokens.map((token, index): ReactNode => {
    const key = `${keyPrefix}-${index}`;

    if (token.type === "code") {
      return (
        <code
          className="rounded-sm bg-canvas-soft px-1.5 py-0.5 font-mono text-[0.92em] text-ink"
          key={key}
        >
          {token.text}
        </code>
      );
    }

    if (token.type === "link") {
      return (
        <a
          className="text-link underline-offset-4 hover:underline"
          href={token.href}
          key={key}
          rel="noreferrer"
          target="_blank"
        >
          {token.text}
        </a>
      );
    }

    return <Fragment key={key}>{token.text}</Fragment>;
  });
}

function renderBlock(block: MarkdownBlock, index: number, compact: boolean) {
  const key = `block-${index}`;

  if (block.type === "heading" && block.level === 1) {
    return (
      <h1
        className={compact ? "text-display-sm text-ink" : "text-display-md text-ink"}
        key={key}
      >
        {renderInline(block.children, key)}
      </h1>
    );
  }

  if (block.type === "heading") {
    return (
      <h2
        className={classNames(
          compact ? "text-body-lg-strong" : "text-display-sm",
          "pt-2 text-ink"
        )}
        key={key}
      >
        {renderInline(block.children, key)}
      </h2>
    );
  }

  if (block.type === "list") {
    return (
      <ul
        className={classNames(
          compact ? "text-body-sm" : "text-body-md",
          "list-disc space-y-2 pl-6 leading-7 text-body"
        )}
        key={key}
      >
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-item-${itemIndex}`}>
            {renderInline(item, `${key}-item-${itemIndex}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p
      className={classNames(
        compact ? "text-body-sm" : "text-body-md",
        "leading-7 text-body"
      )}
      key={key}
    >
      {renderInline(block.children, key)}
    </p>
  );
}

export function MarkdownContent({
  content,
  className,
  compact = false,
}: MarkdownContentProps) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className={classNames(compact ? "space-y-4" : "space-y-5", className)}>
      {blocks.map((block, index) => renderBlock(block, index, compact))}
    </div>
  );
}
