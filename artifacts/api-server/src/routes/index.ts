import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import medicationsRouter from "./medications";
import domRouter from "./dom";
import contingenciaRouter from "./contingencia";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import plantaoRouter from "./plantao";
import recadosRouter from "./recados";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(eventsRouter);
router.use(medicationsRouter);
router.use(domRouter);
router.use(contingenciaRouter);
router.use(tasksRouter);
router.use(plantaoRouter);
router.use(recadosRouter);

export default router;
