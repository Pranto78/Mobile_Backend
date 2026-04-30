import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { requireRoles } from "../middleware/role.middleware";
import { sendDailyReportEmail } from "../controllers/email.controller";

const router = Router();

router.use(protect);

router.post(
  "/send-daily-report",
  requireRoles("ADMIN", "LEADER"),
  sendDailyReportEmail
);

export default router;