import "express-async-errors";

import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import cookieParser from "cookie-parser";

import express from "express";
const app = express();

app.use(express.static("./public"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import rateLimiter from "express-rate-limit";
import helmet, { contentSecurityPolicy } from "helmet";
import xss from "xss-clean";
import cors from "cors";

app.set("trust proxy", 1);
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
  })
);
app.use(helmet());
app.use(
  contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https: data:"],
      "script-src": [
        "'self'",
        "https://unpkg.com/axios@1.1.2/dist/axios.min.js",
      ],
    },
  })
);

app.use(xss());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// import middlewares
import notFoundMiddleware from "./middlewares/not-found.js";
import errorMiddleware from "./middlewares/error-handler.js";
import { authenticateUser } from "./middlewares/authentication.js";

// import routers
import authRouter from "./routes/auth.js";
import productRouter from "./routes/products.js";
import scrapRouter from "./routes/scrapper.js";
import trackRouter from "./routes/track.js";

// use routers
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/search", scrapRouter);
app.use("/api/v1/products", authenticateUser, productRouter);
app.use("/api/v1/track", trackRouter);

// use error middlewares
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// import scheduler
import { scheduleJob } from "./utils/scheduler.js";

app.get("/", (req, res) => res.json({ msg: "Home page" }));

const port = process.env.PORT || 3000;
import connectDB from "./db/connect.js";

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () => console.log(`app listening to port ${port}`));
  } catch (error) {
    console.log(error);
  }
};

start();
scheduleJob();
