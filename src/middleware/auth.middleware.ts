import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import User from "../models/User";

type TokenPayload = JwtPayload & {
  id?: string;
  userId?: string;
  _id?: string;
};

export async function protect(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized. Missing token.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;

    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({
        message: "Unauthorized. Invalid token.",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Unauthorized. User not found or inactive.",
      });
    }

    (req as any).user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized. Invalid or expired token.",
    });
  }
}