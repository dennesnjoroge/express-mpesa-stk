import express, { type Express } from "express";
import { corsMiddleware } from "./core/config/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { router } from "./routes.js";
import { errorMiddleware } from "./core/middlewares/errors.js";

export const app: Express = express();

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

app.use("/v1", router);

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});

app.use(errorMiddleware);
