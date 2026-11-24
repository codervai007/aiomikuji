"use client";
import { useEffect, useState } from "react";

/** Live state the kiosk shares with the big monitor. */
export type Step = { s: "idle" | "run" | "done" | "warn"; t: string };
export type MonitorState = {
  phase: "idle" | "input" | "drawing" | "done";
  steps: Step[];
  prompt: string;
  answer: string;
  checks: string;
  fortune?: string;
  win?: boolean;
  no?: number;
  at: number;
};

export const IDLE_STEPS: Step[] = Array.from({ length: 5 }, () => ({ s: "idle", t: "" }));
export const EMPTY_MONITOR: MonitorState = { phase: "idle", steps: IDLE_STEPS, prompt: "", answer: "", checks: "", at: 0 };

const CHANNEL = "omikuji-booth";
const LAST_KEY = "omikuji-monitor-last";

let channel: BroadcastChannel | null = null;
function getChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

/** Kiosk side: send the current state to every monitor open in this browser. */
export function publishMonitor(state: MonitorState) {
  getChannel()?.postMessage(state);
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Monitor side: the latest state from the kiosk. */
export function useMonitorFeed(): MonitorState {
  const [state, setState] = useState<MonitorState>(EMPTY_MONITOR);
  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_KEY);
      if (last) setState(JSON.parse(last));
    } catch {
      /* ignore */
    }
    const ch = getChannel();
    const onMsg = (e: MessageEvent<MonitorState>) => setState(e.data);
    ch?.addEventListener("message", onMsg);
    // Fallback for browsers without BroadcastChannel.
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_KEY && e.newValue) {
        try {
          setState(JSON.parse(e.newValue));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch?.removeEventListener("message", onMsg);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return state;
}
