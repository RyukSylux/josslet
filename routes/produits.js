const express = require("express");
const router = express.Router();
const { query, param, body, validationResult } = require("express-validator");
const db = require("../lib/db");
const { requireAuth } = require("../middlewares/auth");

const SORT_WHITELIST = ["prix", "titre"];

router.get(
  "/",
  query("categorie").optional().trim().escape(),
  query("minPrix").optional().isFloat({ min: 0 }),
  query("maxPrix").optional().isFloat({ min: 0 }),
  query("sort").optional().trim().escape(),
  async (req, res, next) => {
    try {
      const { categorie, minPrix, maxPrix, sort } = req.query;
      let sql =
        "SELECT id, titre, categorie, prix, stock FROM produits WHERE 1=1";
      const params = [];
      if (categorie) {
        sql += " AND categorie = ?";
        params.push(categorie);
      }
      if (minPrix) {
        sql += " AND prix >= ?";
        params.push(minPrix);
      }
      if (maxPrix) {
        sql += " AND prix <= ?";
        params.push(maxPrix);
      }
      if (sort && SORT_WHITELIST.includes(sort)) {
        sql += ` ORDER BY ${sort}`;
      }
      const [rows] = await db.execute(sql, params);
      res.json(rows);
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

router.get("/:id", param("id").isInt(), async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, titre, categorie, prix, stock FROM produits WHERE id = ?",
      [req.params.id]
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
  body("titre").isLength({ min: 1 }).trim().escape(),
  body("categorie").isLength({ min: 1 }).trim().escape(),
  body("prix").isFloat({ min: 0 }),
  body("stock").isInt({ min: 0 }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const { titre, categorie, prix, stock } = req.body;
    try {
      const [result] = await db.execute(
        "INSERT INTO produits (titre, categorie, prix, stock) VALUES (?, ?, ?, ?)",
        [titre, categorie, prix, stock]
      );
      res
        .status(201)
        .json({ id: result.insertId, titre, categorie, prix, stock });
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

router.put(
  "/:id/stock",
  requireAuth,
  param("id").isInt(),
  body("adjust").isInt(),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = new Error("Invalid input");
      err.statusCode = 400;
      err.isClientError = true;
      return next(err);
    }
    const id = req.params.id;
    const adjust = parseInt(req.body.adjust);
    try {
      const conn = await db.pool.getConnection();
      try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
          "SELECT stock FROM produits WHERE id = ? FOR UPDATE",
          [id]
        );
        if (rows.length === 0) {
          await conn.rollback();
          const err = new Error("Not found");
          err.statusCode = 404;
          err.isClientError = true;
          return next(err);
        }
        const current = rows[0].stock;
        const nextStock = current + adjust;
        if (nextStock < 0) {
          await conn.rollback();
          const err = new Error("Insufficient stock");
          err.statusCode = 400;
          err.isClientError = true;
          return next(err);
        }
        await conn.execute("UPDATE produits SET stock = ? WHERE id = ?", [
          nextStock,
          id,
        ]);
        await conn.commit();
        res.json({ id, stock: nextStock });
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    } catch (e) {
      e.sql = e.sql || null;
      next(e);
    }
  }
);

module.exports = router;