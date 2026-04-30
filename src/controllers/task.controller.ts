import { Request, Response } from "express";
import mongoose from "mongoose";

import Task from "../models/Task";
import Project from "../models/Project";
import User from "../models/User";

type Status = "TODO" | "IN_PROGRESS" | "PAUSE" | "DONE";

function getAuthUser(req: Request) {
  return (req as any).user;
}

function calculateElapsedSeconds(startedAt: Date | null | undefined) {
  if (!startedAt) return 0;

  const now = new Date().getTime();
  const start = new Date(startedAt).getTime();

  return Math.max(0, Math.floor((now - start) / 1000));
}

function canMoveStatus(current: Status, next: Status) {
  const allowed: Record<Status, Status[]> = {
    TODO: ["IN_PROGRESS"],
    IN_PROGRESS: ["PAUSE", "DONE"],
    PAUSE: ["IN_PROGRESS", "DONE"],
    DONE: [],
  };

  return allowed[current].includes(next);
}

async function canAccessTask(authUser: any, task: any) {
  if (authUser.role === "ADMIN") return true;

  if (authUser.role === "MEMBER") {
    return String(task.assignedTo) === authUser.id;
  }

  if (authUser.role === "LEADER") {
    if (String(task.assignedTo) === authUser.id) return true;

    const member = await User.findOne({
      _id: task.assignedTo,
      role: "MEMBER",
      leader: authUser.id,
      isActive: true,
    });

    return Boolean(member);
  }

  return false;
}

export async function getTasks(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    let query: any = {};

    if (authUser.role === "MEMBER") {
      query.assignedTo = authUser.id;
    }

    if (authUser.role === "LEADER") {
      const members = await User.find({
        role: "MEMBER",
        leader: authUser.id,
        isActive: true,
      }).select("_id");

      const memberIds = members.map((member) => member._id);

      query.assignedTo = {
        $in: [authUser.id, ...memberIds],
      };
    }

    const tasks = await Task.find(query)
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      tasks,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch tasks.",
    });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    const { title, description, projectId, assignedToId, taskDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        message: "Title and project are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    let finalAssignedTo = assignedToId || authUser.id;

    if (!mongoose.Types.ObjectId.isValid(finalAssignedTo)) {
      return res.status(400).json({
        message: "Invalid assigned user ID.",
      });
    }

    if (authUser.role === "MEMBER") {
      finalAssignedTo = authUser.id;
    }

    if (authUser.role === "LEADER") {
      if (finalAssignedTo !== authUser.id) {
        const member = await User.findOne({
          _id: finalAssignedTo,
          role: "MEMBER",
          leader: authUser.id,
          isActive: true,
        });

        if (!member) {
          return res.status(403).json({
            message: "Leader can assign tasks only to own members.",
          });
        }
      }
    }

    const task = await Task.create({
      title,
      description: description || "",
      project: projectId,
      assignedTo: finalAssignedTo,
      createdBy: authUser.id,
      taskDate: taskDate ? new Date(taskDate) : new Date(),
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.status(201).json({
      message: "Task created successfully.",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create task.",
    });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params;
    const { title, description, projectId, assignedToId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    if (task.isLocked) {
      return res.status(400).json({
        message: "This task is locked and cannot be edited.",
      });
    }

    const hasAccess = await canAccessTask(authUser, task);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to update this task.",
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    if (projectId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID.",
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project not found.",
        });
      }

      task.project = project._id;
    }

    if (assignedToId !== undefined && authUser.role !== "MEMBER") {
      if (!mongoose.Types.ObjectId.isValid(assignedToId)) {
        return res.status(400).json({
          message: "Invalid assigned user ID.",
        });
      }

      task.assignedTo = assignedToId;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.json({
      message: "Task updated successfully.",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update task.",
    });
  }
}

export async function updateTaskStatus(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params;
    const { status } = req.body as { status: Status };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    if (!["TODO", "IN_PROGRESS", "PAUSE", "DONE"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status.",
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    if (task.isLocked) {
      return res.status(400).json({
        message: "This task is locked and status cannot be changed.",
      });
    }

    const hasAccess = await canAccessTask(authUser, task);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to update this task.",
      });
    }

    const currentStatus = task.status as Status;

    if (currentStatus === status) {
      return res.json({
        message: "Task status already set.",
        task,
      });
    }

    if (!canMoveStatus(currentStatus, status)) {
      return res.status(400).json({
        message: `Invalid status flow. Cannot move from ${currentStatus} to ${status}.`,
      });
    }

    if (currentStatus === "IN_PROGRESS") {
      const elapsed = calculateElapsedSeconds(task.currentStartedAt);
      task.timeSpentSeconds += elapsed;
      task.currentStartedAt = null;
    }

    if (status === "IN_PROGRESS") {
      task.currentStartedAt = new Date();
    }

    if (status === "DONE") {
      task.currentStartedAt = null;
    }

    task.status = status;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name description")
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role");

    return res.json({
      message: "Task status updated successfully.",
      task: populatedTask,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update task status.",
    });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    if (task.isLocked) {
      return res.status(400).json({
        message: "This task is locked and cannot be deleted.",
      });
    }

    const hasAccess = await canAccessTask(authUser, task);

    if (!hasAccess) {
      return res.status(403).json({
        message: "You do not have permission to delete this task.",
      });
    }

    await Task.findByIdAndDelete(id);

    return res.json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete task.",
    });
  }
}