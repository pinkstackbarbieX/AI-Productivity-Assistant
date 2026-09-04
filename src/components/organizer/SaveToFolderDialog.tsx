import { FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useOrganizer } from "@/hooks/useOrganizer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  defaultTitle: string;
  kind?: string;
};

export function SaveToFolderDialog({ open, onOpenChange, content, defaultTitle, kind }: Props) {
  const { folders, createFolder, saveItem } = useOrganizer();
  const [title, setTitle] = useState(defaultTitle);
  const [folderId, setFolderId] = useState("");
  const [newFolder, setNewFolder] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(defaultTitle);
    setNewFolder("");
    setFolderId(folders[0]?.id ?? "");
  }, [open, defaultTitle, folders]);

  const addFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    const folder = createFolder(name);
    setFolderId(folder.id);
    setNewFolder("");
    toast.success(`Folder “${folder.name}” created`);
  };

  const save = () => {
    let target = folderId;
    if (!target) {
      const name = newFolder.trim();
      if (!name) {
        toast.error("Create or pick a folder first.");
        return;
      }
      target = createFolder(name).id;
    }
    saveItem({ folderId: target, title, content, kind });
    toast.success("Saved to your organizer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to organizer</DialogTitle>
          <DialogDescription>
            Keep this work in a folder so you can find, copy or reuse it later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="organizer-title">Title</Label>
            <Input
              id="organizer-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give this a name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Folder</Label>
            {folders.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setFolderId(folder.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      folder.id === folderId
                        ? "border-primary/50 bg-blush text-primary"
                        : "border-border/70 bg-background hover:bg-muted"
                    }`}
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No folders yet — create your first one.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organizer-new-folder">New folder</Label>
            <div className="flex gap-2">
              <Input
                id="organizer-new-folder"
                value={newFolder}
                onChange={(event) => setNewFolder(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFolder();
                  }
                }}
                placeholder="e.g. Client onboarding"
              />
              <Button type="button" variant="outline" onClick={addFolder} className="gap-1.5">
                <FolderPlus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
