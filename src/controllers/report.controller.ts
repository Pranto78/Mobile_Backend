import { Request, Response } from "express";

import Task from "../models/Task";
import User from "../models/User";

function getAuthUser(req: Request) {
  return (req as any).user;
}

function formatSeconds(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}

function calculateElapsedSeconds(startedAt: Date | null | undefined) {
  if (!startedAt) return 0;

  const now = new Date().getTime();
  const start = new Date(startedAt).getTime();

  return Math.max(0, Math.floor((now - start) / 1000));
}

function getDateRange(dateString?: string) {
  const date = dateString ? new Date(dateString) : new Date();

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end, label: start.toISOString().slice(0, 10) };
}

async function getScopedTaskQuery(authUser: any) {
  if (authUser.role === "ADMIN") {
    return {};
  }

  if (authUser.role === "MEMBER") {
    return {
      assignedTo: authUser.id,
    };
  }

  if (authUser.role === "LEADER") {
    const members = await User.find({
      role: "MEMBER",
      leader: authUser.id,
      isActive: true,
    }).select("_id");

    const memberIds = members.map((member) => member._id);

    return {
      assignedTo: {
        $in: [authUser.id, ...memberIds],
      },
    };
  }

  return {
    assignedTo: authUser.id,
  };
}

function buildGroupedReport(tasks: any[], groupBy: "project" | "user") {
  const map = new Map<
    string,
    {
      key: string;
      title: string;
      totalTasks: number;
      completedTasks: number;
      totalTimeSpentSeconds: number;
      tasks: any[];
    }
  >();

  for (const task of tasks) {
    const runningSeconds =
      task.status === "IN_PROGRESS"
        ? calculateElapsedSeconds(task.currentStartedAt)
        : 0;

    const totalTime = (task.timeSpentSeconds || 0) + runningSeconds;

    const project = task.project as any;
    const assignedTo = task.assignedTo as any;

    const keyObject = groupBy === "project" ? project : assignedTo;
    const key = keyObject?._id ? String(keyObject._id) : "unknown";
    const title = keyObject?.name || "Unknown";

    if (!map.has(key)) {
      map.set(key, {
        key,
        title,
        totalTasks: 0,
        completedTasks: 0,
        totalTimeSpentSeconds: 0,
        tasks: [],
      });
    }

    const group = map.get(key)!;

    group.totalTasks += 1;
    if (task.status === "DONE") group.completedTasks += 1;
    group.totalTimeSpentSeconds += totalTime;

    group.tasks.push({
      id: String(task._id),
      title: task.title,
      description: task.description,
      status: task.status,
      project: project
        ? {
            id: String(project._id),
            name: project.name,
          }
        : null,
      assignedTo: assignedTo
        ? {
            id: String(assignedTo._id),
            name: assignedTo.name,
            email: assignedTo.email,
            role: assignedTo.role,
          }
        : null,
      timeSpentSeconds: totalTime,
      timeSpentText: formatSeconds(totalTime),
      taskDate: task.taskDate,
    });
  }

  return Array.from(map.values()).map((group) => ({
    ...group,
    totalTimeSpentText: formatSeconds(group.totalTimeSpentSeconds),
  }));
}

function buildWhatsAppText(params: {
  date: string;
  groupBy: "project" | "user";
  groups: any[];
}) {
  const { date, groupBy, groups } = params;

  const lines: string[] = [];

  lines.push(`*Team Report Manager - Daily Report*`);
  lines.push(`Date: ${date}`);
  lines.push(`Grouped by: ${groupBy === "project" ? "Project" : "User"}`);
  lines.push("");

  if (groups.length === 0) {
    lines.push("No tasks found for this date.");
    return lines.join("\n");
  }

  for (const group of groups) {
    lines.push(`*${group.title}*`);
    lines.push(
      `Tasks: ${group.totalTasks} | Done: ${group.completedTasks} | Time: ${group.totalTimeSpentText}`
    );

    for (const task of group.tasks) {
      lines.push(
        `- ${task.title} [${task.status}] - ${task.timeSpentText}`
      );

      if (groupBy === "project" && task.assignedTo?.name) {
        lines.push(`  Assigned: ${task.assignedTo.name}`);
      }

      if (groupBy === "user" && task.project?.name) {
        lines.push(`  Project: ${task.project.name}`);
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export async function getDailyReport(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    const groupBy =
      req.query.groupBy === "user" ? "user" : "project";

    const { start, end, label } = getDateRange(
      req.query.date ? String(req.query.date) : undefined
    );

    const scopedQuery = await getScopedTaskQuery(authUser);

    const tasks = await Task.find({
      ...scopedQuery,
      taskDate: {
        $gte: start,
        $lt: end,
      },
    })
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    const groups = buildGroupedReport(tasks, groupBy);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "DONE").length;
    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const totalTimeSpentSeconds = groups.reduce(
      (sum, group) => sum + group.totalTimeSpentSeconds,
      0
    );

    const whatsappText = buildWhatsAppText({
      date: label,
      groupBy,
      groups,
    });

    return res.json({
      report: {
        date: label,
        groupBy,
        summary: {
          totalTasks,
          completedTasks,
          completionRate,
          totalTimeSpentSeconds,
          totalTimeSpentText: formatSeconds(totalTimeSpentSeconds),
        },
        groups,
        whatsappText,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to generate daily report.",
    });
  }
}