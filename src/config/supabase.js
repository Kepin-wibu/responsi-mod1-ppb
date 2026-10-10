const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) {
  console.warn(
    '[WARN] Kredensial SUPABASE_URL atau SUPABASE_KEY belum dikonfigurasi di file .env.'
  );
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

module.exports = supabase;
