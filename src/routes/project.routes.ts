import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/role.middleware";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "../controllers/project.controller";

const router = Router();

router.use(protect);

router.get("/", getProjects);
router.post("/", requireRoles("ADMIN", "LEADER"), createProject);
router.patch("/:id", requireRoles("ADMIN", "LEADER"), updateProject);
router.delete("/:id", requireRoles("ADMIN"), deleteProject);

export default router;