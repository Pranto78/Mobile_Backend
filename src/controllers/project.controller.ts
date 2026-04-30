import { Request, Response } from "express";
import mongoose from "mongoose";

import Project from "../models/Project";
import User from "../models/User";
import Task from "../models/Task";

function getAuthUser(req: Request) {
  return (req as any).user;
}

export async function getProjects(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    let query: any = {
      status: "ACTIVE",
      isVisible: true,
    };

    if (authUser.role === "ADMIN") {
      query = {
        status: "ACTIVE",
      };
    }

    if (authUser.role === "LEADER") {
      query = {
        status: "ACTIVE",
        isVisible: true,
        $or: [
          { createdBy: authUser.id },
          { assignedLeaders: authUser.id },
        ],
      };
    }

    if (authUser.role === "MEMBER") {
      query = {
        status: "ACTIVE",
        isVisible: true,
        assignedMembers: authUser.id,
      };
    }

    const projects = await Project.find(query)
      .populate("createdBy", "name email role")
      .populate("assignedLeaders", "name email role")
      .populate("assignedMembers", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      projects,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch projects.",
    });
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);

    const {
      name,
      description,
      isVisible,
      assignedLeaderIds = [],
      assignedMemberIds = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required.",
      });
    }

    let finalAssignedLeaders: string[] = [];
    let finalAssignedMembers: string[] = [];

    if (authUser.role === "ADMIN") {
      finalAssignedLeaders = assignedLeaderIds;
      finalAssignedMembers = assignedMemberIds;
    }

    if (authUser.role === "LEADER") {
      finalAssignedLeaders = [authUser.id];

      const members = await User.find({
        _id: { $in: assignedMemberIds },
        role: "MEMBER",
        leader: authUser.id,
        isActive: true,
      });

      finalAssignedMembers = members.map((member) => String(member._id));
    }

    const project = await Project.create({
      name,
      description: description || "",
      isVisible: typeof isVisible === "boolean" ? isVisible : true,
      createdBy: authUser.id,
      assignedLeaders: finalAssignedLeaders,
      assignedMembers: finalAssignedMembers,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("assignedLeaders", "name email role")
      .populate("assignedMembers", "name email role");

    return res.status(201).json({
      message: "Project created successfully.",
      project: populatedProject,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create project.",
    });
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    const isAdmin = authUser.role === "ADMIN";
    const isProjectLeader =
      authUser.role === "LEADER" &&
      project.assignedLeaders.map(String).includes(authUser.id);

    if (!isAdmin && !isProjectLeader) {
      return res.status(403).json({
        message: "You do not have permission to update this project.",
      });
    }

    const {
      name,
      description,
      isVisible,
      assignedLeaderIds,
      assignedMemberIds,
    } = req.body;

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (typeof isVisible === "boolean") project.isVisible = isVisible;

    if (isAdmin) {
      if (Array.isArray(assignedLeaderIds)) {
        project.assignedLeaders = assignedLeaderIds;
      }

      if (Array.isArray(assignedMemberIds)) {
        project.assignedMembers = assignedMemberIds;
      }
    }

    if (authUser.role === "LEADER" && Array.isArray(assignedMemberIds)) {
      const members = await User.find({
        _id: { $in: assignedMemberIds },
        role: "MEMBER",
        leader: authUser.id,
        isActive: true,
      });

      project.assignedMembers = members.map((member) => member._id);
    }

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("assignedLeaders", "name email role")
      .populate("assignedMembers", "name email role");

    return res.json({
      message: "Project updated successfully.",
      project: populatedProject,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update project.",
    });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const authUser = getAuthUser(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        message: "Project not found.",
      });
    }

    if (authUser.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can delete projects.",
      });
    }

    await Task.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    return res.json({
      message: "Project deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to delete project.",
    });
  }
}