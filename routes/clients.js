const express = require("express");
const router = express.Router();
const { query, param, body, validationResult } = require("express-validator");
const db = require("../lib/db");
const { requireAuth } = require("../middlewares/auth");

// GET /clients?search=&page=&limit=
router.get(
  "/",
  query("search").optional().trim().escape(),
  query("page").optional().toInt(),
  query("limit").optional().toInt(),
  async (req, res, next) => {
    try {
      const search = req.query.search || "";
      const page = Math.max(1, req.query.page || 1);
      const limit = Math.min(100, Math.max(1, req.query.limit || 10));
      const offset = (page - 1) * limit;

      const like = `%${search}%`;
      const sql = `
        SELECT id, nom, email, vip
        FROM clients
        WHERE nom LIKE ? OR email LIKE ?
        LIMIT ${limit} OFFSET ${offset}
      `;

      const [rows] = await db.execute(sql, [like, like]);
      res.json({ page, limit, results: rows });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);


router.get("/:id", param("id").isInt(), async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await db.execute(
      "SELECT id, nom, email, vip FROM clients WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      const err = new Error("Not found");
      err.statusCode = 404;
      err.isClientError = true;
      return next(err);
    }
    res.json(rows[0]);
  } catch (e) {
    e.sql = e.sql || null;
    next(e);
  }
});

router.post(
  "/",
  requireAuth,
  body("nom").isLength({ min: 1 }).trim().escape(),
  body("email").isEmail().normalizeEmail(),
  body("vip").optional().isInt({ min: 0, max: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const { nom, email, vip = 0 } = req.body;
    try {
      // ensure unique email
      const [exist] = await db.execute(
        "SELECT id FROM clients WHERE email = ?",
        [email]
      );
      if (exist.length > 0) {
        const err = new Error("Email already used");
        err.statusCode = 400;
        err.isClientError = true;
        return next(err);
      }
      const [result] = await db.execute(
        "INSERT INTO clients (nom, email, vip) VALUES (?, ?, ?)",
        [nom, email, vip]
      );
      res.status(201).json({ id: result.insertId, nom, email, vip });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  param("id").isInt(),
  body("nom").optional().isLength({ min: 1 }).trim().escape(),
  body("email").optional().isEmail().normalizeEmail(),
  body("vip").optional().isInt({ min: 0, max: 1 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const id = req.params.id;
    const fields = [];
    const params = [];
    const { nom, email, vip } = req.body;
    if (nom) {
      fields.push("nom = ?");
      params.push(nom);
    }
    if (email) {
      fields.push("email = ?");
      params.push(email);
    }
    if (typeof vip !== "undefined") {
      fields.push("vip = ?");
      params.push(vip);
    }
    if (fields.length === 0) {
      const err = new Error("No fields");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    params.push(id);
    try {
      const sql = `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`;
      const [result] = await db.execute(sql, params);
      res.json({ changedRows: result.affectedRows });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  param("id").isInt(),
  async (req, res, next) => {
    try {
      const id = req.params.id;
      // Check orders
      const [orders] = await db.execute(
        "SELECT id FROM commandes WHERE client_id = ? LIMIT 1",
        [id]
      );
      if (orders.length > 0) {
        const err = new Error("Cannot delete client with orders");
        err.statusCode = 400;
        err.isClientError = true;
        return next(err);
      }
      const [result] = await db.execute("DELETE FROM clients WHERE id = ?", [
        id,
      ]);
      res.json({ deletedRows: result.affectedRows });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

module.exports = router;