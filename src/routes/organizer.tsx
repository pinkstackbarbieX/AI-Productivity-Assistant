import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Copy,
  Folder,
  FolderPlus,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOrganizer, type OrganizerItem } from "@/hooks/useOrganizer";

export const Route = createFileRoute("/organizer")({
  head: () => ({
    meta: [
      { title: "Organizer · Aria saved work and folders" },
      {
        name: "description",
        content:
          "Group saved tasks, drafts and generated work into folders. Browse, open, copy or delete anything Aria produced — no login required.",
      },
      { property: "og:title", content: "Organizer · Aria saved work and folders" },
      {
        property: "og:description",
        content: "Folders for your saved tasks, drafts and generated work in Aria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizerPage,
});

function OrganizerPage() {
  const {
    folders,
    items,
    hydrated,
    createFolder,
    renameFolder,
    deleteFolder,
    saveItem,
    deleteItem,
  } = useOrganizer();

  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [newFolder, setNewFolder] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [reading, setReading] = useState<OrganizerItem | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const visible = useMemo(
    () => (activeFolder === "all" ? items : items.filter((item) => item.folderId === activeFolder)),
    [activeFolder, items],
  );

  const folderName = (id: string) => folders.find((folder) => folder.id === id)?.name ?? "Unfiled";

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to your clipboard");
    } catch {
      toast.error("Copying is blocked in this browser.");
    }
  };

  const addFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    const folder = createFolder(name);
    setNewFolder("");
    setActiveFolder(folder.id);
    toast.success(`Folder “${folder.name}” created`);
  };

  const addNote = () => {
    if (!noteBody.trim()) {
      toast.error("Add some content to save.");
      return;
    }
    const target =
      activeFolder !== "all" ? activeFolder : (folders[0]?.id ?? createFolder("My work").id);
    saveItem({ folderId: target, title: noteTitle || "Untitled task", content: noteBody, kind: "task" });
    setNoteTitle("");
    setNoteBody("");
    setNoteOpen(false);
    toast.success("Saved to your organizer");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur sm:px-8">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-semibold">Organizer</h1>
          <p className="text-xs text-muted-foreground">
            Folders for saved tasks and generated work · stored on this device
          </p>
        </div>
        <Button size="sm" className="ml-auto gap-1.5" onClick={() => setNoteOpen(true)}>
          <Sparkles className="size-4" /> Save a task
        </Button>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-soft">
            <h2 className="pb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Folders
            </h2>
            <div className="flex gap-2">
              <Input
                value={newFolder}
                onChange={(event) => setNewFolder(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFolder();
                  }
                }}
                placeholder="New folder"
                aria-label="New folder name"
              />
              <Button type="button" variant="outline" size="icon" onClick={addFolder} aria-label="Create folder">
                <FolderPlus className="size-4" />
              </Button>
            </div>

            <ul className="mt-4 space-y-0.5">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveFolder("all")}
                  className={`w-full rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                    activeFolder === "all" ? "bg-blush font-medium text-primary" : "hover:bg-muted"
                  }`}
                >
                  All saved work · {items.length}
                </button>
              </li>
              {folders.map((folder) => (
                <li key={folder.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveFolder(folder.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors ${
                      activeFolder === folder.id
                        ? "bg-blush font-medium text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Folder className="size-4 shrink-0 text-primary-soft" />
                    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                    <span className="text-[0.7rem] text-muted-foreground">
                      {items.filter((item) => item.folderId === folder.id).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Rename ${folder.name}`}
                    onClick={() => setRenaming({ id: folder.id, name: folder.name })}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${folder.name}`}
                    onClick={() => {
                      deleteFolder(folder.id);
                      if (activeFolder === folder.id) setActiveFolder("all");
                      toast.success("Folder deleted");
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {hydrated && folders.length === 0 && (
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Create a folder to start grouping saved work.
              </p>
            )}
          </div>
        </aside>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold">
            {activeFolder === "all" ? "All saved work" : folderName(activeFolder)}
          </h2>

          {!hydrated ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : visible.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 text-sm leading-relaxed text-muted-foreground shadow-soft">
              Nothing saved here yet. Use “Save to organizer” under any answer on the dashboard, or
              save a task from this page.
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visible.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col rounded-3xl border border-border/70 bg-card/80 p-4 shadow-soft"
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary">
                    {folderName(item.folderId)} · {item.kind}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                    {item.content}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setReading(item)}>
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5"
                      onClick={() => void copy(item.content)}
                    >
                      <Copy className="size-3.5" /> Copy
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => {
                        deleteItem(item.id);
                        toast.success("Item deleted");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Dialog open={Boolean(renaming)} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
            <DialogDescription>Saved items stay where they are.</DialogDescription>
          </DialogHeader>
          <Input
            value={renaming?.name ?? ""}
            onChange={(event) =>
              setRenaming((current) => (current ? { ...current, name: event.target.value } : current))
            }
            aria-label="Folder name"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renaming) renameFolder(renaming.id, renaming.name);
                setRenaming(null);
                toast.success("Folder renamed");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save a task</DialogTitle>
            <DialogDescription>
              Goes into {activeFolder === "all" ? "your first folder" : folderName(activeFolder)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="Title"
              aria-label="Task title"
            />
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              rows={6}
              placeholder="What needs doing?"
              aria-label="Task content"
              className="w-full resize-none rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(reading)} onOpenChange={(open) => !open && setReading(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{reading?.title}</DialogTitle>
            <DialogDescription>
              {reading ? `${folderName(reading.folderId)} · saved ${new Date(reading.createdAt).toLocaleString()}` : ""}
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap break-words rounded-2xl bg-muted/60 p-4 font-sans text-sm leading-relaxed">
            {reading?.content}
          </pre>
          <DialogFooter>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => reading && void copy(reading.content)}
            >
              <Copy className="size-4" /> Copy
            </Button>
            <Button onClick={() => setReading(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
