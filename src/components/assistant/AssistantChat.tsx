import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, FolderPlus, Sparkles, Square } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { ToolCard } from "@/components/assistant/ToolCard";
import { SaveToFolderDialog } from "@/components/organizer/SaveToFolderDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export type QuickPrompt = { label: string; prompt: string };

type Props = {
  sessionId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (messages: UIMessage[]) => void;
  quickPrompts: QuickPrompt[];
  pendingPrompt?: string | null;
  onPendingPromptHandled?: () => void;
};

export function AssistantChat({
  sessionId,
  initialMessages,
  onMessagesChange,
  quickPrompts,
  pendingPrompt,
  onPendingPromptHandled,
}: Props) {
  const [input, setInput] = useState("");
  const [saveTarget, setSaveTarget] = useState<{ title: string; content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
    onError: (error) => {
      toast.error(error.message || "The assistant could not respond. Please try again.");
    },
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onMessagesChange(messages);
  }, [messages, onMessagesChange]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!pendingPrompt || isBusy) return;
    void sendMessage({ text: pendingPrompt });
    onPendingPromptHandled?.();
  }, [pendingPrompt, isBusy, sendMessage, onPendingPromptHandled]);

  const submit = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-soft sm:p-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-blush px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="size-3.5" /> Aria
              </span>
              <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                What should we get off your plate?
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Paste a thread, a messy list of tasks or a rough idea. Aria summarises, drafts,
                prioritises and plans — and shows the result as a card you can act on.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {quickPrompts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => void sendMessage({ text: item.prompt })}
                    className="rounded-2xl border border-border/70 bg-background/60 p-3 text-left transition-colors hover:border-primary/40 hover:bg-blush/60"
                  >
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-soft">
                    {message.parts
                      .map((part) => (part.type === "text" ? part.text : ""))
                      .join("")}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      if (!part.text.trim()) return null;
                      return (
                        <div
                          key={index}
                          className="prose-aria max-w-none text-sm text-foreground/90"
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
                        </div>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      const toolPart = part as unknown as {
                        type: string;
                        state: string;
                        output?: unknown;
                      };
                      return (
                        <ToolCard
                          key={index}
                          name={toolPart.type.replace(/^tool-/, "")}
                          state={toolPart.state}
                          output={toolPart.output}
                        />
                      );
                    }
                    return null;
                  })}
                  {!isBusy && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setSaveTarget(messageToSave(message))}
                    >
                      <FolderPlus className="size-3.5" /> Save to organizer
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 animate-bounce rounded-full bg-primary-soft" />
              <span className="size-2 animate-bounce rounded-full bg-primary-soft [animation-delay:120ms]" />
              <span className="size-2 animate-bounce rounded-full bg-primary-soft [animation-delay:240ms]" />
              Thinking
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/70 bg-card/70 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex items-end gap-2 rounded-3xl border border-border/70 bg-background p-2 shadow-soft focus-within:border-primary/40"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              rows={1}
              placeholder="Summarise this thread, draft a reply, plan my day…"
              aria-label="Message Aria"
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            {isBusy ? (
              <Button type="button" size="icon" variant="secondary" onClick={() => stop()} aria-label="Stop">
                <Square className="size-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
                <ArrowUp className="size-4" />
              </Button>
            )}
          </form>
          <p className="mt-2 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
            Aria can make mistakes. Review drafts, dates and names before acting on them.
          </p>
        </div>
      </div>

      <SaveToFolderDialog
        open={Boolean(saveTarget)}
        onOpenChange={(open) => !open && setSaveTarget(null)}
        content={saveTarget?.content ?? ""}
        defaultTitle={saveTarget?.title ?? ""}
        kind="generated work"
      />
    </div>
  );
}

function messageToSave(message: UIMessage) {
  const chunks: string[] = [];
  for (const part of message.parts) {
    if (part.type === "text" && part.text.trim()) {
      chunks.push(part.text.trim());
    } else if (part.type.startsWith("tool-")) {
      const toolPart = part as unknown as { type: string; output?: unknown };
      if (toolPart.output !== undefined) {
        chunks.push(
          `${toolPart.type.replace(/^tool-/, "").replace(/_/g, " ")}:\n${JSON.stringify(
            toolPart.output,
            null,
            2,
          )}`,
        );
      }
    }
  }
  const content = chunks.join("\n\n");
  const firstLine = content.split("\n").find((line) => line.trim().length > 0) ?? "Saved answer";
  const title = firstLine.replace(/[#*`]/g, "").trim().slice(0, 60) || "Saved answer";
  return { title, content };
}
