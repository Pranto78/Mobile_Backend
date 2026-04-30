import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";

import User from "../models/User";
import { env } from "../config/env";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (!user.password) {
      return res.status(500).json({
        message:
          "Password is missing for this user. Please run the seed command again.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const jwtOptions: SignOptions = {
      expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    };

    const token = jwt.sign(
      {
        id: String(user._id),
        role: user.role,
      },
      env.jwtSecret,
      jwtOptions
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed.",
    });
  }
});

export default router;