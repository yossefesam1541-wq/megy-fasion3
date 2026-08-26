import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", 1);

// Allow-list of origins that are permitted to call the API with credentials.
// STORE_ORIGIN should be set to the storefront's public URL in every environment.
// Falls back to allowing any origin (without credentials leakage risk removed)
// only when explicitly unset, so local/dev setups keep working.
const allowedOrigins = (process.env.STORE_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
