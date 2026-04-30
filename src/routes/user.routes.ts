import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/role.middleware";
import {
  createUser,
  deleteUser,
  getLeaders,
  getUsers,
} from "../controllers/user.controller";

const router = Router();

router.use(protect);

router.get("/", requireRoles("ADMIN", "LEADER"), getUsers);
router.get("/leaders", requireRoles("ADMIN"), getLeaders);
router.post("/", requireRoles("ADMIN"), createUser);
router.delete("/:id", requireRoles("ADMIN"), deleteUser);

export default router;