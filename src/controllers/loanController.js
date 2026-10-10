const supabase = require('../config/supabase');

/**
 * GET /api/loans
 * Menampilkan daftar transaksi peminjaman buku.
 * Mendukung filter query:
 *   - ?status=Terlambat | Dipinjam | Dikembalikan
 *   - ?member_id=<uuid>
 *   - ?book_id=<uuid>
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { status, member_id, book_id } = req.query;

    let query = supabase
      .from('loans')
      .select(`
        id,
        borrow_date,
        due_date,
        return_date,
        status,
        notes,
        created_at,
        updated_at,
        member:members (
          id,
          name,
          email,
          phone
        ),
        book:books (
          id,
          title,
          author,
          isbn
        )
      `)
      .order('created_at', { ascending: false });

    // Apply Filter Query jika ada
    if (status) {
      // Normalisasi status case (misal: 'terlambat' -> 'Terlambat')
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query = query.eq('status', formattedStatus);
    }

    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    if (book_id) {
      query = query.eq('book_id', book_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data.length,
      filtersApplied: {
        status: status || null,
        member_id: member_id || null,
        book_id: book_id || null
      },
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loans/:id
 * Menampilkan detail 1 peminjaman buku berdasarkan ID
 */
const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('loans')
      .select(`
        id,
        borrow_date,
        due_date,
        return_date,
        status,
        notes,
        created_at,
        updated_at,
        member:members (
          id,
          name,
          email,
          phone
        ),
        book:books (
          id,
          title,
          author,
          isbn
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Data peminjaman dengan ID ${id} tidak ditemukan.`
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

/**
 * POST /api/loans
 * Mencatat peminjaman buku baru oleh anggota
 * Body: { member_id, book_id, due_date, borrow_date (optional), notes (optional) }
 */
const createLoan = async (req, res, next) => {
  try {
    const { member_id, book_id, due_date, borrow_date, notes } = req.body;

    if (!member_id || !book_id || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'member_id, book_id, dan due_date wajib diisi.'
      });
    }

    // Validasi keberadaan Anggota
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, name')
      .eq('id', member_id)
      .single();

    if (memberErr || !member) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan ID ${member_id} tidak ditemukan.`
      });
    }

    // Validasi keberadaan Buku & Stok
    const { data: book, error: bookErr } = await supabase
      .from('books')
      .select('id, title, stock')
      .eq('id', book_id)
      .single();

    if (bookErr || !book) {
      return res.status(404).json({
        success: false,
        message: `Buku dengan ID ${book_id} tidak ditemukan.`
      });
    }

    if (book.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: `Stok buku "${book.title}" habis.`
      });
    }

    // Default borrow_date ke hari ini jika tidak ditentukan
    const actualBorrowDate = borrow_date || new Date().toISOString().split('T')[0];

    // Status Awal: 'Dipinjam' (Atau 'Terlambat' jika due_date sudah lewat)
    const today = new Date().toISOString().split('T')[0];
    const initialStatus = due_date < today ? 'Terlambat' : 'Dipinjam';

    // Insert Data Peminjaman
    const { data: newLoan, error: insertErr } = await supabase
      .from('loans')
      .insert([
        {
          member_id,
          book_id,
          borrow_date: actualBorrowDate,
          due_date,
          status: initialStatus,
          notes: notes || null
        }
      ])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Kurangi stok buku sebanyak 1
    await supabase
      .from('books')
      .update({ stock: book.stock - 1 })
      .eq('id', book_id);

    res.status(201).json({
      success: true,
      message: 'Transaksi peminjaman buku berhasil dicatat.',
      data: newLoan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/loans/:id
 * Memperbarui data peminjaman (misal: pengembalian buku / update status)
 * Body: { status, return_date, due_date, notes }
 */
const updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, return_date, due_date, notes } = req.body;

    // Ambil data peminjaman lama
    const { data: existingLoan, error: fetchErr } = await supabase
      .from('loans')
      .select('*, book:books(id, stock)')
      .eq('id', id)
      .single();

    if (fetchErr || !existingLoan) {
      return res.status(404).json({
        success: false,
        message: `Peminjaman dengan ID ${id} tidak ditemukan.`
      });
    }

    const payload = {};
    if (due_date) payload.due_date = due_date;
    if (notes !== undefined) payload.notes = notes;

    // Jika terjadi pengembalian buku (status dikembalikan)
    if (status) {
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      payload.status = formattedStatus;

      if (formattedStatus === 'Dikembalikan') {
        payload.return_date = return_date || new Date().toISOString().split('T')[0];

        // Kembalikan stok buku jika sebelumnya statusnya belum Dikembalikan
        if (existingLoan.status !== 'Dikembalikan' && existingLoan.book) {
          await supabase
            .from('books')
            .update({ stock: existingLoan.book.stock + 1 })
            .eq('id', existingLoan.book_id);
        }
      }
    }

    if (return_date && !payload.return_date) {
      payload.return_date = return_date;
    }

    payload.updated_at = new Date().toISOString();

    const { data: updatedLoan, error: updateErr } = await supabase
      .from('loans')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.status(200).json({
      success: true,
      message: 'Data peminjaman berhasil diperbarui.',
      data: updatedLoan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/loans/:id
 * Menghapus data transaksi peminjaman buku
 */
const deleteLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('loans')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Data peminjaman dengan ID ${id} tidak ditemukan.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data peminjaman berhasil dihapus.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan
};
