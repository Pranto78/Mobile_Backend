import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import {
  carryOverTask,
  createTask,
  deleteTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from "../controllers/task.controller";

const router = Router();

router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.post("/:id/carry-over", carryOverTask);
router.patch("/:id/status", updateTaskStatus);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;