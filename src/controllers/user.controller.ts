import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User";

export async function getUsers(req: Request, res: Response) {
  try {
    const authUser = (req as any).user;

    let users;

    if (authUser.role === "ADMIN") {
      users = await User.find({ isActive: true })
        .select("-password")
        .populate("leader", "name email role")
        .sort({ createdAt: -1 });
    } else if (authUser.role === "LEADER") {
      users = await User.find({
        role: "MEMBER",
        leader: authUser.id,
        isActive: true,
      })
        .select("-password")
        .populate("leader", "name email role")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "Members cannot view user list.",
      });
    }

    return res.json({
      users,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch users.",
    });
  }
}

export async function getLeaders(req: Request, res: Response) {
  try {
    const leaders = await User.find({
      role: "LEADER",
      isActive: true,
    })
      .select("-password")
      .sort({ name: 1 });

    return res.json({
      leaders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch leaders.",
    });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { name, email, password, role, leaderId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required.",
      });
    }

    if (!["LEADER", "MEMBER"].includes(role)) {
      return res.status(400).json({
        message: "Admin can create only LEADER or MEMBER users.",
      });
    }

    const existingUser = await User.findOne({
      email: String(email).toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }

    let leader = null;

    if (role === "MEMBER" && leaderId) {
      if (!mongoose.Types.ObjectId.isValid(leaderId)) {
        return res.status(400).json({
          message: "Invalid leader ID.",
        });
      }

      const leaderUser = await User.findOne({
        _id: leaderId,
        role: "LEADER",
        isActive: true,
      });

      if (!leaderUser) {
        return res.status(400).json({
          message: "Leader not found.",
        });
      }

      leader = leaderUser._id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: String(email).toLowerCase(),
      password: hashedPassword,
      role,
      leader,
    });

    const safeUser = await User.findById(user._id)
      .select("-password")
      .populate("leader", "name email role");

    return res.status(201).json({
      message: "User created successfully.",
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create user.",
    });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const authUser = (req as any).user;

    if (authUser.id === id) {
      return res.status(400).json({
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.isActive = false;
    await user.save();

    return res.json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete user.",
    });
  }
}