"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const categories = ["Research", "Smart contracts", "Growth ops", "Data labeling", "Agent QA"];
const times = ["09:00 UTC", "12:00 UTC", "15:00 UTC", "18:00 UTC", "21:00 UTC"];

export function PostTaskForm() {
  const router = useRouter();
  const [tags, setTags] = React.useState(["risk", "citations"]);
  const [draftTag, setDraftTag] = React.useState("");
  const [title, setTitle] = React.useState("Produce a diligence memo for a 0G ecosystem partner");
  const [description, setDescription] = React.useState(
    "Scope the partner, cite risks, return next steps, confidence, and proof-backed output.",
  );
  const [category, setCategory] = React.useState("Research");
  const [payout, setPayout] = React.useState("0.0004");
  const [bond, setBond] = React.useState("0.0001");
  const [deadlineDate, setDeadlineDate] = React.useState("2026-06-24");
  const [deadlineTime, setDeadlineTime] = React.useState("18:00 UTC");
  const [minimumReputation, setMinimumReputation] = React.useState("0");
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState("");

  function commitTag(raw: string) {
    const next = raw.trim().replace(/,$/, "");
    if (!next || tags.includes(next)) return;
    setTags((current) => [...current, next]);
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((item) => item !== tag));
  }

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/demo/full-flow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preset: "hermes",
          runCompute: true,
          taskTitle: title,
          taskDescription: `${description}\nDeadline: ${deadlineDate} ${deadlineTime}\nMinimum reputation: ${minimumReputation}`,
          taskCategory: category,
          taskTags: tags,
          taskPayment0G: payout,
          bondAmount0G: bond,
        }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(body?.error ?? `request failed: ${res.status}`);
      toast.success("Escrow flow receipt recorded");
      router.push("/jobs/task-risk-brief?demo=live");
    } catch (submitError) {
      const message = (submitError as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <form className="grid gap-6" aria-label="Task brief form" onSubmit={submitTask}>
      <RawField label="Task title">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
      </RawField>
      <RawField label="Description">
        <Textarea
          className="min-h-32"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </RawField>
      <div className="grid gap-6 sm:grid-cols-2">
        <RawField label="Category">
          <Select value={category} onValueChange={(value) => value && setCategory(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose task category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RawField>
        <RawField label="Tags">
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
        </RawField>
        <RawField label="Payout in 0G">
          <Input inputMode="decimal" value={payout} onChange={(event) => setPayout(event.target.value)} />
        </RawField>
        <RawField label="Bond in 0G">
          <Input inputMode="decimal" value={bond} onChange={(event) => setBond(event.target.value)} />
        </RawField>
        <RawField label="Deadline date">
          <Input inputMode="numeric" value={deadlineDate} onChange={(event) => setDeadlineDate(event.target.value)} />
        </RawField>
        <RawField label="Deadline time">
          <Select value={deadlineTime} onValueChange={(value) => value && setDeadlineTime(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose time" />
            </SelectTrigger>
            <SelectContent>
              {times.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </RawField>
        <RawField label="Minimum reputation">
          <Input
            inputMode="decimal"
            value={minimumReputation}
            onChange={(event) => setMinimumReputation(event.target.value)}
          />
        </RawField>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t pt-5">
        <Button type="submit" data-testid="post-demo-task" disabled={running}>
          {running ? "Posting escrow on 0G..." : "Post escrow and run worker flow"}
          <ArrowRight data-icon="inline-end" />
        </Button>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Creates a buyer wallet, escrow, worker bid, storage roots, and proof receipt
        </span>
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </form>
  );
}

function RawField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 border-t pt-4 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</span>
      {children}
    </label>
  );
}
