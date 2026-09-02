import express, { type Express } from "express";
import cors from "cors";
import { createRequire } from "node:module";
import cookieParser from "cookie-parser";

import router from "./routes";
import { logger } from "./lib/logger";

const require = createRequire(import.meta.url);
const helmet = require("helmet");
const pinoHttp = require("pino-http");



const app: Express = express();
app.set("trust proxy", 1);

// Allow-list of origins that are permitted to call the API with credentials.
// STORE_ORIGIN should be set to the storefront's public URL in every environment.
// Falls back to allowing any origin (without credentials leakage risk removed)
// only when explicitly unset, so local/dev setups keep working.
const allowedOrigins = [
  "https://megy-fasion3-megy-teac-admin.vercel.app",
  "https://megy-fasion3-medy-tech.vercel.app",
  ...(process.env.STORE_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: any) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: any) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(helmet());
app.use(
  cors(
    allowedOrigins.length
      ? {
          origin: allowedOrigins,
          credentials: true,
        }
      : undefined,
  ),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
