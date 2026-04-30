import { Request, Response } from "express";

import Task from "../models/Task";
import User from "../models/User";

function getAuthUser(req: Request) {
  return (req as any).user;
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

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const taskQuery = await getScopedTaskQuery(authUser);

    const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      pausedTasks,
      completedTasks,
      carryOverTasks,
      tasks,
    ] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: "TODO" }),
      Task.countDocuments({ ...taskQuery, status: "IN_PROGRESS" }),
      Task.countDocuments({ ...taskQuery, status: "PAUSE" }),
      Task.countDocuments({ ...taskQuery, status: "DONE" }),
      Task.countDocuments({ ...taskQuery, carryOverFrom: { $ne: null } }),
      Task.find(taskQuery)
        .populate("assignedTo", "name email role")
        .populate("project", "name")
        .sort({ createdAt: -1 }),
    ]);

    const completionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const memberMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        total: number;
        completed: number;
        inProgress: number;
        paused: number;
        todo: number;
      }
    >();

    for (const task of tasks) {
      const assignedUser: any = task.assignedTo;

      if (!assignedUser?._id) continue;

      const key = String(assignedUser._id);

      if (!memberMap.has(key)) {
        memberMap.set(key, {
          userId: key,
          name: assignedUser.name,
          email: assignedUser.email,
          total: 0,
          completed: 0,
          inProgress: 0,
          paused: 0,
          todo: 0,
        });
      }

      const item = memberMap.get(key)!;

      item.total += 1;

      if (task.status === "DONE") item.completed += 1;
      if (task.status === "IN_PROGRESS") item.inProgress += 1;
      if (task.status === "PAUSE") item.paused += 1;
      if (task.status === "TODO") item.todo += 1;
    }

    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await Task.countDocuments({
        ...taskQuery,
        createdAt: {
          $gte: date,
          $lt: nextDate,
        },
      });

      last7Days.push({
        date: date.toISOString().slice(0, 10),
        count,
      });
    }

    return res.json({
      stats: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        pausedTasks,
        completedTasks,
        carryOverTasks,
        completionRate,
        last7Days,
        memberSummary: Array.from(memberMap.values()),
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch dashboard stats.",
    });
  }
}