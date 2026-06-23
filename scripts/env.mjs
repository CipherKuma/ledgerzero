import fs from "node:fs";
import path from "node:path";

export function readFrontendEnv(root = process.cwd()) {
  const envPath = path.join(root, "frontend", ".env.local");
  const text = fs.readFileSync(envPath, "utf8");
  return Object.fromEntries(
    text
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

export function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}
