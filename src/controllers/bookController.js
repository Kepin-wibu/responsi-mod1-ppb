const supabase = require('../config/supabase');

// GET /api/books - Get all books
const getAllBooks = async (req, res, next) => {
  try {
    const { title, author } = req.query;
    let query = supabase.from('books').select('*').order('created_at', { ascending: false });

    if (title) {
      query = query.ilike('title', `%${title}%`);
    }
    if (author) {
      query = query.ilike('author', `%${author}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/books/:id - Get single book
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Buku dengan ID ${id} tidak ditemukan.`
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/books - Create new book
const createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, stock } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        success: false,
        message: 'Judul (title) dan Penulis (author) wajib diisi.'
      });
    }

    const { data, error } = await supabase
      .from('books')
      .insert([{ title, author, isbn: isbn || null, stock: stock !== undefined ? Number(stock) : 1 }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'ISBN sudah terdaftar.'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Berhasil menambahkan buku baru.',
      data
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/books/:id - Update book
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, stock } = req.body;

    const payload = {};
    if (title !== undefined) payload.title = title;
    if (author !== undefined) payload.author = author;
    if (isbn !== undefined) payload.isbn = isbn;
    if (stock !== undefined) payload.stock = Number(stock);

    const { data, error } = await supabase
      .from('books')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Buku dengan ID ${id} tidak ditemukan atau gagal diperbarui.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data buku berhasil diperbarui.',
      data
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/books/:id - Delete book
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Buku dengan ID ${id} tidak ditemukan atau gagal dihapus.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Buku "${data.title}" berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
