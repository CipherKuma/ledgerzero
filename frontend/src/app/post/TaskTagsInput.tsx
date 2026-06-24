"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TaskTagsInput({
  tags,
  onTagsChange,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const [draftTag, setDraftTag] = useState("");

  function commitTag(raw: string) {
    const next = raw.trim().replace(/,$/, "");
    if (!next || tags.includes(next)) return;
    onTagsChange([...tags, next]);
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((item) => item !== tag));
  }

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border border-input bg-background/70 px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          {tag}
          <button
            type="button"
            className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${tag}`}
            onClick={() => removeTag(tag)}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        value={draftTag}
        placeholder="type then space"
        onChange={(event) => setDraftTag(event.target.value)}
        onBlur={() => {
          commitTag(draftTag);
          setDraftTag("");
        }}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitTag(draftTag);
            setDraftTag("");
          }
        }}
      />
    </div>
  );
}
