import { useCallback, useEffect, useState } from "react";

export type OrganizerItem = {
  id: string;
  folderId: string;
  title: string;
  content: string;
  kind: string;
  createdAt: number;
};

export type OrganizerFolder = {
  id: string;
  name: string;
  createdAt: number;
};

export type OrganizerState = {
  folders: OrganizerFolder[];
  items: OrganizerItem[];
};

const STORAGE_KEY = "aria.organizer.v1";
const EVENT = "aria-organizer-change";

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function read(): OrganizerState {
  if (typeof window === "undefined") return { folders: [], items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { folders: [], items: [] };
    const parsed = JSON.parse(raw) as OrganizerState;
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { folders: [], items: [] };
  }
}

function write(state: OrganizerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

export function useOrganizer() {
  const [state, setState] = useState<OrganizerState>({ folders: [], items: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const apply = useCallback((next: OrganizerState) => {
    setState(next);
    write(next);
  }, []);

  const createFolder = useCallback(
    (name: string) => {
      const current = read();
      const folder: OrganizerFolder = {
        id: newId("f"),
        name: name.trim() || "Untitled folder",
        createdAt: Date.now(),
      };
      apply({ ...current, folders: [folder, ...current.folders] });
      return folder;
    },
    [apply],
  );

  const renameFolder = useCallback(
    (id: string, name: string) => {
      const current = read();
      apply({
        ...current,
        folders: current.folders.map((folder) =>
          folder.id === id ? { ...folder, name: name.trim() || folder.name } : folder,
        ),
      });
    },
    [apply],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      const current = read();
      apply({
        folders: current.folders.filter((folder) => folder.id !== id),
        items: current.items.filter((item) => item.folderId !== id),
      });
    },
    [apply],
  );

  const saveItem = useCallback(
    (input: { folderId: string; title: string; content: string; kind?: string }) => {
      const current = read();
      const item: OrganizerItem = {
        id: newId("i"),
        folderId: input.folderId,
        title: input.title.trim() || "Untitled item",
        content: input.content,
        kind: input.kind ?? "note",
        createdAt: Date.now(),
      };
      apply({ ...current, items: [item, ...current.items] });
      return item;
    },
    [apply],
  );

  const deleteItem = useCallback(
    (id: string) => {
      const current = read();
      apply({ ...current, items: current.items.filter((item) => item.id !== id) });
    },
    [apply],
  );

  const moveItem = useCallback(
    (id: string, folderId: string) => {
      const current = read();
      apply({
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, folderId } : item)),
      });
    },
    [apply],
  );

  return {
    folders: state.folders,
    items: state.items,
    hydrated,
    createFolder,
    renameFolder,
    deleteFolder,
    saveItem,
    deleteItem,
    moveItem,
  };
}
