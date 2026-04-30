import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/role.middleware";
import {
  generateBulkTasks,
  improveTaskWriting,
} from "../controllers/ai.controller";

const router = Router();

router.use(protect);

router.post(
  "/generate-tasks",
  requireRoles("ADMIN", "LEADER"),
  generateBulkTasks
);

router.post(
  "/improve-writing",
  requireRoles("ADMIN", "LEADER", "MEMBER"),
  improveTaskWriting
);

export default router;