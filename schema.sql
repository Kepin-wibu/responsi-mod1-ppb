-- ========================================================
-- SKEMA DATABASE LAYANAN PEMINJAMAN BUKU PERPUSTAKAAN
-- Supabase (PostgreSQL) DDL Script
-- ========================================================

-- 1. TABEL ANGGOTA (MEMBERS)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL BUKU (BOOKS)
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) UNIQUE,
    stock INT NOT NULL DEFAULT 1 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PEMINJAMAN (LOANS)
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Dipinjam' CHECK (status IN ('Dipinjam', 'Dikembalikan', 'Terlambat')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk mempercepat filter query berdasarkan status dan id
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON public.loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_book_id ON public.loans(book_id);

-- Trigger Otomatis Mengubah Status Peminjaman ke 'Terlambat' jika Melewati Due Date (Opsional/Bantu)
CREATE OR REPLACE FUNCTION update_loan_status_before_return()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.return_date IS NULL AND NEW.due_date < CURRENT_DATE AND NEW.status = 'Dipinjam' THEN
        NEW.status := 'Terlambat';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_loan_status ON public.loans;
CREATE TRIGGER trigger_auto_loan_status
    BEFORE INSERT OR UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_status_before_return();

-- ========================================================
-- SAMPLE DATA DUMMY UNTUK PENGUJIAN
-- ========================================================

-- Insert Sample Members
INSERT INTO public.members (id, name, email, phone) VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Budi Santoso', 'budi@example.com', '081234567890'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Siti Rahma', 'siti@example.com', '089876543210'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Ahmad Dani', 'ahmad@example.com', '085512344321')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Books
INSERT INTO public.books (id, title, author, isbn, stock) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Laskar Pelangi', 'Andrea Hirata', '978-979-3062-79-2', 5),
    ('22222222-2222-2222-2222-222222222222', 'Bumi Manusia', 'Pramoedya Ananta Toer', '978-979-97312-3-4', 3),
    ('33333333-3333-3333-3333-333333333333', 'Clean Code', 'Robert C. Martin', '978-0132350884', 2)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Loans (Status: Dipinjam, Dikembalikan, Terlambat)
INSERT INTO public.loans (id, member_id, book_id, borrow_date, due_date, return_date, status, notes) VALUES
    (
        'f1111111-1111-1111-1111-111111111111',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '11111111-1111-1111-1111-111111111111',
        CURRENT_DATE - INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '4 days',
        NULL,
        'Dipinjam',
        'Peminjaman reguler'
    ),
    (
        'f2222222-2222-2222-2222-222222222222',
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        '22222222-2222-2222-2222-222222222222',
        CURRENT_DATE - INTERVAL '10 days',
        CURRENT_DATE - INTERVAL '3 days',
        NULL,
        'Terlambat',
        'Peminjaman terlambat belum dikembalikan'
    ),
    (
        'f3333333-3333-3333-3333-333333333333',
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
        '33333333-3333-3333-3333-333333333333',
        CURRENT_DATE - INTERVAL '14 days',
        CURRENT_DATE - INTERVAL '7 days',
        CURRENT_DATE - INTERVAL '6 days',
        'Dikembalikan',
        'Sudah dikembalikan tepat waktu'
    )
ON CONFLICT (id) DO NOTHING;
