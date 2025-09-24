const express = require("express");
const router = express.Router();
const { query, param } = require("express-validator");
const db = require("../lib/db");

router.get(
  "/",
  query("client_id").optional().toInt(),
  query("statut").optional().trim().escape(),
  query("date_min").optional().isISO8601(),
  query("date_max").optional().isISO8601(),
  async (req, res, next) => {
    try {
      const { client_id, statut, date_min, date_max } = req.query;
      let sql = `SELECT c.id, c.client_id, cl.nom as client_nom, c.date, c.statut, SUM(l.qte * p.prix) as total_ht, SUM(l.qte * p.prix) * 1.2 as total_ttc
FROM commandes c
JOIN clients cl ON cl.id = c.client_id
JOIN commande_ligne l ON l.commande_id = c.id
JOIN produits p ON p.id = l.produit_id
WHERE 1=1`;
      const params = [];
      if (client_id) {
        sql += " AND c.client_id = ?";
        params.push(client_id);
      }
      if (statut) {
        sql += " AND c.statut = ?";
        params.push(statut);
      }
      if (date_min) {
        sql += " AND c.date >= ?";
        params.push(date_min);
      }
      if (date_max) {
        sql += " AND c.date <= ?";
        params.push(date_max);
      }
      sql += " GROUP BY c.id, c.client_id, cl.nom, c.date, c.statut";
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
    const id = req.params.id;
    const [cmdRows] = await db.execute(
      "SELECT c.id, c.client_id, cl.nom as client_nom, c.date, c.statut FROM commandes c JOIN clients cl ON cl.id = c.client_id WHERE c.id = ?",
      [id]
    );
    if (cmdRows.length === 0) {
      const err = new Error("Not found");
      err.statusCode = 404;
      err.isClientError = true;
      return next(err);
    }
    const command = cmdRows[0];
    const [lines] = await db.execute(
      `SELECT l.id, l.produit_id, p.titre, l.qte, p.prix, (l.qte * p.prix) as line_ht, (l.qte * p.prix) * 1.2 as line_ttc
FROM commande_ligne l JOIN produits p ON p.id = l.produit_id WHERE l.commande_id = ?`,
      [id]
    );
    res.json({ command, lines });
  } catch (e) {
    e.sql = e.sql || null;
    next(e);
  }
});

module.exports = router;
