import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export type StoredSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
};

const STORAGE_KEY = "aria.sessions.v1";

function readSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId() {
  return `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function titleFromMessages(messages: UIMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return "New session";
  const text = firstUser.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
  if (!text) return "New session";
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export function useSessions() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readSessions();
    if (stored.length > 0) {
      setSessions(stored);
      setActiveId(stored[0]!.id);
    } else {
      const first: StoredSession = {
        id: newId(),
        title: "New session",
        updatedAt: Date.now(),
        messages: [],
      };
      setSessions([first]);
      setActiveId(first.id);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: StoredSession[]) => {
    setSessions(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 40)));
    }
  }, []);

  const saveMessages = useCallback(
    (id: string, messages: UIMessage[]) => {
      setSessions((current) => {
        const next = current.map((session) =>
          session.id === id
            ? {
                ...session,
                messages,
                title: titleFromMessages(messages),
                updatedAt: Date.now(),
              }
            : session,
        );
        const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted.slice(0, 40)));
        }
        return sorted;
      });
    },
    [],
  );

  const startSession = useCallback(() => {
    const session: StoredSession = {
      id: newId(),
      title: "New session",
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions((current) => {
      const next = [session, ...current];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 40)));
      }
      return next;
    });
    setActiveId(session.id);
    return session.id;
  }, []);

  const removeSession = useCallback(
    (id: string) => {
      const remaining = sessions.filter((session) => session.id !== id);
      if (remaining.length === 0) {
        const session: StoredSession = {
          id: newId(),
          title: "New session",
          updatedAt: Date.now(),
          messages: [],
        };
        persist([session]);
        setActiveId(session.id);
        return;
      }
      persist(remaining);
      if (activeId === id) setActiveId(remaining[0]!.id);
    },
    [activeId, persist, sessions],
  );

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;

  return {
    sessions,
    activeSession,
    activeId,
    hydrated,
    setActiveId,
    startSession,
    removeSession,
    saveMessages,
  };
}
