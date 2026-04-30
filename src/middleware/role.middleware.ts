import { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/User";

export function requireRoles(...allowedRoles: UserRole[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized. Login required.",
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden. You do not have permission.",
      });
    }

    next();
  };
}