import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./db";
import { env } from "./env";
import analyticsRouter from "./routes/analytics";

async function start() {
  await connectDb();

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.get("/", (_req, res) => {
    res.json({
      name: "CausalFunnel Analytics API",
      status: "running",
      health: "/health",
      pages: "/api/pages",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", analyticsRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error("API ERROR:", err);

      const message =
        err instanceof Error ? err.message : "Unknown internal server error";

      res.status(500).json({
        error: "internal_server_error",
        message,
      });
    }
  );

  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});