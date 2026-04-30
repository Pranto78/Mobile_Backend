import { Request, Response } from "express";

import { env } from "../config/env";
import {
  generateTasksWithGroq,
  improveWritingWithGroq,
} from "../services/ai.service";

export async function generateBulkTasks(req: Request, res: Response) {
  try {
    const { prompt, groqApiKey, maxTasks, model } = req.body;

    if (!prompt || String(prompt).trim().length < 10) {
      return res.status(400).json({
        message: "Prompt is required and must be at least 10 characters.",
      });
    }

    const finalGroqApiKey = String(groqApiKey || env.groqApiKey || "").trim();

    if (!finalGroqApiKey) {
      return res.status(400).json({
        message:
          "Groq API key is required. Send groqApiKey in request body or set GROQ_API_KEY in backend .env.",
      });
    }

    const result = await generateTasksWithGroq({
      prompt: String(prompt),
      groqApiKey: finalGroqApiKey,
      maxTasks: Number(maxTasks || 10),
      model: model ? String(model) : undefined,
    });

    return res.json({
      message: "Tasks generated successfully.",
      model: result.model,
      tasks: result.tasks,
    });
  } catch (error: any) {
    console.error("AI generate tasks error:", error?.response?.data || error);

    return res.status(500).json({
      message:
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to generate tasks.",
    });
  }
}

export async function improveTaskWriting(req: Request, res: Response) {
  try {
    const { title, description, groqApiKey, model } = req.body;

    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({
        message: "Task title is required and must be at least 3 characters.",
      });
    }

    const finalGroqApiKey = String(groqApiKey || env.groqApiKey || "").trim();

    if (!finalGroqApiKey) {
      return res.status(400).json({
        message:
          "Groq API key is required. Send groqApiKey in request body or set GROQ_API_KEY in backend .env.",
      });
    }

    const result = await improveWritingWithGroq({
      title: String(title),
      description: String(description || ""),
      groqApiKey: finalGroqApiKey,
      model: model ? String(model) : undefined,
    });

    return res.json({
      message: "Writing improved successfully.",
      model: result.model,
      title: result.title,
      description: result.description,
    });
  } catch (error: any) {
    console.error("AI improve writing error:", error?.response?.data || error);

    return res.status(500).json({
      message:
        error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to improve writing.",
    });
  }
}