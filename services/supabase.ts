import { createClient } from '@supabase/supabase-js';

// ✅ 上线标准版：使用 import.meta.env 读取 Vercel 里的环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // 如果本地开发报错，请确保根目录有 .env 文件
  // 如果线上报错，请检查 Vercel 的 Environment Variables
  throw new Error('Missing Supabase Environment Variables'); 
}

export const supabase = createClient(supabaseUrl, supabaseKey);