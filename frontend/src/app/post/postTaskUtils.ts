import { parseEther } from "viem";

export const categories = ["Research", "Smart contracts", "Growth ops", "Data labeling", "Agent QA"];
export const GAS_BUFFER = parseEther("0.0002");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const escrowAbi = [
  {
    type: "function",
    name: "postTask",
    stateMutability: "payable",
    inputs: [
      { name: "taskId", type: "bytes32" },
      { name: "payment", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "minReputation", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

export function dateStringFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromDateString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function defaultDeadlineDate() {
  return dateStringFromDate(new Date(Date.now() + ONE_DAY_MS));
}

export function formatDeadlineDate(value: string) {
  const date = dateFromDateString(value);
  if (!date) return "Pick a date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function rememberTaskMetadata(record: {
  id: string;
  txHash: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
}) {
  window.localStorage.setItem(`ledger-zero-task:${record.id}`, JSON.stringify(record));
  const rawIndex = window.localStorage.getItem("ledger-zero-task-index");
  const index = rawIndex ? (JSON.parse(rawIndex) as string[]) : [];
  window.localStorage.setItem(
    "ledger-zero-task-index",
    JSON.stringify([record.id, ...index.filter((entry) => entry !== record.id)].slice(0, 50)),
  );
  window.dispatchEvent(new Event("ledger-zero-task-metadata"));
}
