import { Router, type IRouter } from "express";
import healthRouter from "./health";
import streamRouter from "./stream";
import notificationsRouter from "./notifications";
import teraboxRouter from "./terabox";
import googleAuthRouter from "./googleAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(streamRouter);
router.use(notificationsRouter);
router.use(teraboxRouter);
router.use(googleAuthRouter);

export default router;
