
import { Router } from "express";
import healthRouter from "./health";
import catalogRouter from "./catalog";
import commerceRouter from "./commerce";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(commerceRouter);
router.use(adminRouter);

export default router;

