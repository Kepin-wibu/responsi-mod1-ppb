/**
 * Middleware untuk menangani route yang tidak ditemukan (404)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan - ${req.originalUrl}`
  });
};

/**
 * Middleware penanganan error terpusat (500)
 */
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message || err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server.',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
