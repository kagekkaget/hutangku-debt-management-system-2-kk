import { NextResponse } from "next/server";

export const json = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, init);

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export function num(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function str(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseBody<T extends Record<string, unknown>>(body: T) {
  return {
    name: str(body.name as FormDataEntryValue),
    value: body,
  };
}
