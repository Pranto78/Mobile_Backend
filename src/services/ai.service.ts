import axios from "axios";

export type GeneratedTask = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  estimateHours: number;
};

type GenerateTasksParams = {
  prompt: string;
  groqApiKey: string;
  maxTasks?: number;
  model?: string;
};

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const GROQ_CHAT_COMPLETIONS_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const FALLBACK_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "openai/gpt-oss-20b",
];

function removeMarkdownCodeFence(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function safeParseTasks(content: string): GeneratedTask[] {
  const cleaned = removeMarkdownCodeFence(content);

  const parsed = JSON.parse(cleaned);

  if (!parsed || !Array.isArray(parsed.tasks)) {
    throw new Error("AI response does not contain a tasks array.");
  }

  return parsed.tasks
    .filter((task: any) => task && task.title)
    .map((task: any) => ({
      title: String(task.title || "").trim(),
      description: String(task.description || "").trim(),
      priority: ["LOW", "MEDIUM", "HIGH"].includes(task.priority)
        ? task.priority
        : "MEDIUM",
      estimateHours: Number(task.estimateHours || 1),
    }));
}

function buildPrompt(prompt: string, maxTasks: number) {
  return `
You are helping generate tasks for a team task management app.

User prompt:
${prompt}

Return ONLY valid JSON. Do not add markdown. Do not add explanations.

JSON shape:
{
  "tasks": [
    {
      "title": "short clear task title",
      "description": "clear task description",
      "priority": "LOW" | "MEDIUM" | "HIGH",
      "estimateHours": number
    }
  ]
}

Rules:
- Generate between 1 and ${maxTasks} tasks.
- Maximum ${maxTasks} tasks.
- Titles must be short and practical.
- Descriptions must be useful for developers or team members.
- Use priority MEDIUM if unsure.
`;
}

async function callGroq(params: {
  prompt: string;
  groqApiKey: string;
  model: string;
  maxTasks: number;
}) {
  const response = await axios.post<GroqChatResponse>(
    GROQ_CHAT_COMPLETIONS_URL,
    {
      model: params.model,
      messages: [
        {
          role: "system",
          content:
            "You generate structured JSON task lists for project management apps.",
        },
        {
          role: "user",
          content: buildPrompt(params.prompt, params.maxTasks),
        },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    },
    {
      headers: {
        Authorization: `Bearer ${params.groqApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return safeParseTasks(content);
}

export async function generateTasksWithGroq(params: GenerateTasksParams) {
  const maxTasks = Math.min(Math.max(params.maxTasks || 10, 1), 50);

  const modelsToTry = params.model
    ? [params.model, ...FALLBACK_MODELS.filter((item) => item !== params.model)]
    : FALLBACK_MODELS;

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const tasks = await callGroq({
        prompt: params.prompt,
        groqApiKey: params.groqApiKey,
        model,
        maxTasks,
      });

      return {
        model,
        tasks: tasks.slice(0, maxTasks),
      };
    } catch (error) {
      lastError = error;
      console.error(`Groq model failed: ${model}`, error);
    }
  }

  throw lastError || new Error("All Groq models failed.");
}

export type ImprovedWritingResult = {
  title: string;
  description: string;
};

type ImproveWritingParams = {
  title: string;
  description: string;
  groqApiKey: string;
  model?: string;
};

function safeParseImprovedWriting(content: string): ImprovedWritingResult {
  const cleaned = removeMarkdownCodeFence(content);

  const parsed = JSON.parse(cleaned);

  return {
    title: String(parsed.title || "").trim(),
    description: String(parsed.description || "").trim(),
  };
}

function buildImproveWritingPrompt(title: string, description: string) {
  return `
Improve this task title and description for a team task management app.

Return ONLY valid JSON. Do not add markdown. Do not add explanations.

Input title:
${title}

Input description:
${description}

JSON shape:
{
  "title": "improved clear task title",
  "description": "improved clear task description"
}

Rules:
- Keep the meaning same.
- Make the title short and action-focused.
- Make the description professional and easy to understand.
- Do not invent extra requirements.
`;
}

async function callGroqImproveWriting(params: {
  title: string;
  description: string;
  groqApiKey: string;
  model: string;
}) {
  const response = await axios.post<GroqChatResponse>(
    GROQ_CHAT_COMPLETIONS_URL,
    {
      model: params.model,
      messages: [
        {
          role: "system",
          content:
            "You improve task titles and descriptions and return valid JSON only.",
        },
        {
          role: "user",
          content: buildImproveWritingPrompt(
            params.title,
            params.description
          ),
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
    },
    {
      headers: {
        Authorization: `Bearer ${params.groqApiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return safeParseImprovedWriting(content);
}

export async function improveWritingWithGroq(params: ImproveWritingParams) {
  const modelsToTry = params.model
    ? [params.model, ...FALLBACK_MODELS.filter((item) => item !== params.model)]
    : FALLBACK_MODELS;

  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      const result = await callGroqImproveWriting({
        title: params.title,
        description: params.description,
        groqApiKey: params.groqApiKey,
        model,
      });

      return {
        model,
        ...result,
      };
    } catch (error) {
      lastError = error;
      console.error(`Groq writing model failed: ${model}`, error);
    }
  }

  throw lastError || new Error("All Groq models failed.");
}