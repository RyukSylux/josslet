require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const winston = require("winston");

const db = require("./lib/db");
const authRoutes = require("./routes/auth");
const clientsRoutes = require("./routes/clients");
const produitsRoutes = require("./routes/produits");
const commandesRoutes = require("./routes/commandes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
app.locals.logger = logger;

app.use(helmet());
app.use(express.json());
app.use(cors());

// Rate limiter
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MIN || "15") * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || "100"),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Routes
app.get("/health", async (req, res) => {
  try {
    await db.ping();
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "down" });
  }
});

app.use("/auth", authRoutes);
app.use("/clients", clientsRoutes);
app.use("/produits", produitsRoutes);
app.use("/commandes", commandesRoutes);

// Centralized error handler
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
