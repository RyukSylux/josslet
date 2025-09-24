function errorHandler(err, req, res, next) {
  const logger = req.app.locals.logger || console;

  logger.error({
    message: err.message,
    stack: err.stack,
    sql: err.sql || null,
  });

  if (err.isClientError) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }

  res.status(err.statusCode || 500).json({ error: "Internal server error" });
}

module.exports = { errorHandler };
