import express, { type Express } from "express";
import { router } from "./routes.js";

export const app: Express = express();

app.use(express.json());

app.use("/v1", router);

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});
