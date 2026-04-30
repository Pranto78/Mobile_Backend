import { Router } from "express";

import { protect } from "../middleware/auth.middleware";
import { getDailyReport } from "../controllers/report.controller";

const router = Router();

router.use(protect);

router.get("/daily", getDailyReport);

export default router;