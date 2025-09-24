const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const db = require("../lib/db");

router.post(
  "/register",
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const { email, password } = req.body;
    try {
      const [rows] = await db.execute("SELECT id FROM admins WHERE email = ?", [
        email,
      ]);
      if (rows.length > 0) {
        const err = new Error("Email already used");
        err.statusCode = 400;
        err.isClientError = true;
        return next(err);
      }
      const password_hash = await bcrypt.hash(password, 10);
      await db.execute(
        "INSERT INTO admins (email, password_hash) VALUES (?, ?)",
        [email, password_hash]
      );
      res.status(201).json({ message: "admin created" });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").exists(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const { email, password } = req.body;
    try {
      const [rows] = await db.execute(
        "SELECT id, password_hash FROM admins WHERE email = ?",
        [email]
      );
      if (rows.length === 0) {
        const err = new Error("Invalid credentials");
        err.statusCode = 401;
        err.isClientError = true;
        return next(err);
      }
      const admin = rows[0];
      const ok = await bcrypt.compare(password, admin.password_hash);
      if (!ok) {
        const err = new Error("Invalid credentials");
        err.statusCode = 401;
        err.isClientError = true;
        return next(err);
      }
      const token = jwt.sign({ id: admin.id, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      });
      res.json({ token });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

module.exports = router;