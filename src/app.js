const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const memberRoutes = require('./routes/memberRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares Keamanan & Logging
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route & Documentation Info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'REST API Layanan Pencatatan Peminjaman Buku Perpustakaan',
    version: '1.0.0',
    description: 'Sistem RESTful API untuk mengelola data anggota, buku, dan transaksi peminjaman buku.',
    endpoints: {
      health: 'GET /api/health',
      loans: {
        list_all: 'GET /api/loans',
        filter_example: 'GET /api/loans?status=Terlambat',
        detail: 'GET /api/loans/:id',
        create: 'POST /api/loans',
        update: 'PUT /api/loans/:id',
        delete: 'DELETE /api/loans/:id'
      },
      members: 'GET /api/members',
      books: 'GET /api/books'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/members', memberRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
