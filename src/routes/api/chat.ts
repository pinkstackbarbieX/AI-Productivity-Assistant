import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";

type ChatRequestBody = { messages?: unknown };

const SYSTEM_PROMPT = `You are Aria, an AI workplace productivity assistant.

You help knowledge workers summarise long threads, pull out action items, draft and refine
professional email, build meeting agendas, prioritise work, write status updates and protect
focus time.

Rules:
- Prefer calling a tool when the user's request matches one, so the answer renders as a
  structured card. Then add one or two short sentences of narration - never repeat the whole
  card in prose.
- Email tools that touch a real mailbox (connect_mailbox, retrieve_emails, send_email) require
  the person to be signed in. If a tool reports it needs sign-in, tell them plainly they need to
  sign in to connect a mailbox, and offer to draft the message instead.
- Never send an email without an explicit recipient and explicit confirmation from the user in
  the conversation.
- Be concise, warm and practical. Say when you are unsure or when a decision needs a human.`;

function json<T>(value: T) {
  return value;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("AI is not configured", { status: 500 });
        }

        const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"];

        async function getUserClient() {
          if (!accessToken || !supabaseUrl || !supabaseKey) return null;
          const client = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                headers.set("apikey", supabaseKey!);
                headers.set("Authorization", `Bearer ${accessToken}`);
                return fetch(input, { ...init, headers });
              },
            },
          });
          const { data, error } = await client.auth.getUser(accessToken);
          if (error || !data.user) return null;
          return { client, userId: data.user.id, email: data.user.email ?? "" };
        }

        const needsSignIn = json({
          ok: false as const,
          requiresAuth: true as const,
          message: "This action needs a signed-in account with a connected mailbox.",
        });

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(apiKey, initialRunId);

        const result = streamText({
          model: gateway("google/gemini-3.7-flash"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
          stopWhen: stepCountIs(50),
          tools: {
            summarize_thread: tool({
              description:
                "Summarise a long email thread, meeting transcript or document into a headline, key points and decisions.",
              inputSchema: z.object({
                title: z.string().describe("Short title for what was summarised"),
                headline: z.string().describe("One-sentence summary"),
                key_points: z.array(z.string()),
                decisions: z.array(z.string()),
                open_questions: z.array(z.string()),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            extract_action_items: tool({
              description:
                "Extract concrete action items with owners, due dates and priority from any text the user shares.",
              inputSchema: z.object({
                items: z.array(
                  z.object({
                    task: z.string(),
                    owner: z.string(),
                    due: z.string().describe("Plain-language due date, or 'unspecified'"),
                    priority: z.enum(["high", "medium", "low"]),
                  }),
                ),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            draft_email: tool({
              description:
                "Draft a professional email. Does not send anything - use send_email for that.",
              inputSchema: z.object({
                to: z.string().describe("Recipient, or 'unspecified'"),
                subject: z.string(),
                body: z.string(),
                tone: z.enum(["friendly", "neutral", "formal", "direct", "apologetic"]),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            rewrite_tone: tool({
              description: "Rewrite a piece of text in a different tone, keeping the meaning.",
              inputSchema: z.object({
                tone: z.enum(["friendly", "neutral", "formal", "direct", "concise", "warm"]),
                original: z.string(),
                rewritten: z.string(),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            build_meeting_agenda: tool({
              description: "Build a timeboxed meeting agenda with goals and prep notes.",
              inputSchema: z.object({
                title: z.string(),
                duration_minutes: z.number(),
                goal: z.string(),
                items: z.array(z.object({ topic: z.string(), minutes: z.number(), owner: z.string() })),
                prep: z.array(z.string()),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            prioritize_tasks: tool({
              description:
                "Rank a list of tasks by urgency and impact and explain the ordering briefly.",
              inputSchema: z.object({
                tasks: z.array(
                  z.object({
                    task: z.string(),
                    rank: z.number(),
                    impact: z.enum(["high", "medium", "low"]),
                    urgency: z.enum(["high", "medium", "low"]),
                    why: z.string(),
                  }),
                ),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            generate_status_update: tool({
              description: "Write a short stakeholder status update: progress, risks, next steps.",
              inputSchema: z.object({
                period: z.string(),
                highlights: z.array(z.string()),
                risks: z.array(z.string()),
                next_steps: z.array(z.string()),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            plan_focus_blocks: tool({
              description: "Plan focus blocks across a working day around fixed commitments.",
              inputSchema: z.object({
                date_label: z.string(),
                blocks: z.array(
                  z.object({
                    start: z.string(),
                    end: z.string(),
                    label: z.string(),
                    kind: z.enum(["focus", "meeting", "admin", "break"]),
                  }),
                ),
                notes: z.array(z.string()),
              }),
              execute: async (input) => json({ ok: true, ...input }),
            }),
            connect_mailbox: tool({
              description:
                "Connect the signed-in person's work mailbox so email can be retrieved and sent. Requires sign-in.",
              inputSchema: z.object({
                email_address: z.string(),
                display_name: z.string().nullable(),
              }),
              execute: async (input) => {
                const session = await getUserClient();
                if (!session) return needsSignIn;
                const { data, error } = await session.client
                  .from("mail_accounts")
                  .upsert(
                    {
                      user_id: session.userId,
                      email_address: input.email_address,
                      display_name: input.display_name,
                    },
                    { onConflict: "user_id,email_address" },
                  )
                  .select("id, email_address, display_name, connected_at")
                  .single();
                if (error) return json({ ok: false, message: error.message });
                return json({ ok: true, account: data });
              },
            }),
            retrieve_emails: tool({
              description:
                "Retrieve recent messages from the connected mailbox. Requires sign-in and a connected mailbox.",
              inputSchema: z.object({
                folder: z.enum(["inbox", "sent"]),
                limit: z.number(),
              }),
              execute: async (input) => {
                const session = await getUserClient();
                if (!session) return needsSignIn;
                const { data: account } = await session.client
                  .from("mail_accounts")
                  .select("id, email_address")
                  .eq("user_id", session.userId)
                  .order("connected_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (!account) {
                  return json({
                    ok: false,
                    message: "No mailbox is connected yet. Connect one first.",
                  });
                }
                const { data, error } = await session.client
                  .from("mail_messages")
                  .select("id, from_address, to_address, subject, body, is_read, sent_at")
                  .eq("user_id", session.userId)
                  .eq("folder", input.folder)
                  .order("sent_at", { ascending: false })
                  .limit(Math.min(Math.max(input.limit, 1), 25));
                if (error) return json({ ok: false, message: error.message });
                return json({
                  ok: true,
                  folder: input.folder,
                  mailbox: account.email_address,
                  messages: data ?? [],
                });
              },
            }),
            send_email: tool({
              description:
                "Send a message from the connected mailbox. Requires sign-in, a connected mailbox and explicit user confirmation.",
              inputSchema: z.object({
                to: z.string(),
                subject: z.string(),
                body: z.string(),
              }),
              execute: async (input) => {
                const session = await getUserClient();
                if (!session) return needsSignIn;
                const { data: account } = await session.client
                  .from("mail_accounts")
                  .select("id, email_address")
                  .eq("user_id", session.userId)
                  .order("connected_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (!account) {
                  return json({
                    ok: false,
                    message: "No mailbox is connected yet. Connect one first.",
                  });
                }
                const { data, error } = await session.client
                  .from("mail_messages")
                  .insert({
                    user_id: session.userId,
                    account_id: account.id,
                    folder: "sent",
                    from_address: account.email_address,
                    to_address: input.to,
                    subject: input.subject,
                    body: input.body,
                    is_read: true,
                  })
                  .select("id, to_address, subject, sent_at")
                  .single();
                if (error) return json({ ok: false, message: error.message });
                return json({ ok: true, sent: data, mailbox: account.email_address });
              },
            }),
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
