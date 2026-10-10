const supabase = require('../config/supabase');

// GET /api/members - Get all members
const getAllMembers = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

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

// GET /api/members/:id - Get single member
const getMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan ID ${id} tidak ditemukan.`
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

// POST /api/members - Create new member
const createMember = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nama (name) dan Email wajib diisi.'
      });
    }

    const { data, error } = await supabase
      .from('members')
      .insert([{ name, email, phone }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar.'
        });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Berhasil mendaftarkan anggota baru.',
      data
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/members/:id - Update member
const updateMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const { data, error } = await supabase
      .from('members')
      .update({ name, email, phone })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan ID ${id} tidak ditemukan atau gagal diperbarui.`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Data anggota berhasil diperbarui.',
      data
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/members/:id - Delete member
const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: `Anggota dengan ID ${id} tidak ditemukan atau gagal dihapus.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Anggota ${data.name} berhasil dihapus.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
};
