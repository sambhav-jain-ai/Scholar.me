import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { chatLimiter } from "../middleware/rateLimiter";
import { validateChat } from "../middleware/validateChat";

const router = Router();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "dummy";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a smart student companion assistant built into ScholarSync.
You help students manage their academic life (timetables, tasks, attendance, exams, notes, pomodoro).

CORE RULE:
- To perform an action in the app, you MUST append a tag on a NEW LINE at the very end of your response.
- Format: [ACTION:type:JSON_DATA]
- Supported Types:
  1. timetable: { subjectName, day, startTime, endTime, teacher?, room?, recurring: "weekly"|"daily"|"one-time" }
  2. todo: { title, dueDate?, priority: "low"|"medium"|"high" }
  3. attendance: { subjectId?, subjectName, date, status: "present"|"absent"|"late" }
  4. exam: { subjectName, date, time?, room? }
  5. note: { title, content, type: "lecture"|"research"|"other" }
  6. pomodoro: { durationInMinutes, taskId? }

EXAMPLES:
- User: "Add Math class on Monday at 10am"
  Response: "Sure! I've scheduled your Math class.\n[ACTION:timetable:{"subjectName":"Math","day":"Monday","startTime":"10:00","endTime":"11:00","recurring":"weekly"}]"

- User: "I was present for Physics today"
  Response: "Got it, I've marked you present for Physics.\n[ACTION:attendance:{"subjectName":"Physics","date":"2024-04-25","status":"present"}]"

RULES:
- Only one [ACTION] tag per response.
- Use the current date if relative terms like "today" are used.
- Do NOT repeat the full timetable or todo list — just give a summary.
- The [ACTION] tag must be the very last thing in your response.`;

type ActionType = "timetable" | "todo" | "attendance" | "exam" | "note" | "pomodoro" | "ask_which";

interface ParsedAction {
  type: ActionType;
  data: Record<string, unknown>;
}

function parseResponse(raw: string): { text: string; action: ParsedAction | null } {
  const actionMatch = raw.match(/\[ACTION:(\w+):([\s\S]*?)\]\s*$/m);
  if (!actionMatch) return { text: raw.trim(), action: null };
  const text = raw.replace(actionMatch[0], "").trim();
  try {
    const type = actionMatch[1] as ActionType;
    const data = JSON.parse(actionMatch[2]) as Record<string, unknown>;
    return { text, action: { type, data } };
  } catch {
    return { text, action: null };
  }
}

router.post("/", chatLimiter, validateChat, async (req, res) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "dummy") {
    res.status(503).json({
      error: "AI service is not configured. Please set GEMINI_API_KEY in the server's .env file.",
    });
    return;
  }

  try {
    const { messages } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    const raw = result.response.text();
    const { text, action } = parseResponse(raw);

    res.json({ content: text, action });
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;