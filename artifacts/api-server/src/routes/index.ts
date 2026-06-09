import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import medicationsRouter from "./medications";
import domRouter from "./dom";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(medicationsRouter);
router.use(domRouter);

export default router;
