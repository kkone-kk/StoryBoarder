export const config = {
  matcher: '/gallery/:path*',
  runtime: 'edge',
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1];

  // 1. 基础检查
  if (!id || id.includes('.')) {
    return fetch(request);
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 2. 【关键修改】直接使用 fetch 调用 Supabase REST API
    // 这样就完全不需要依赖 @supabase/supabase-js 库，避免 Edge 环境兼容问题
    // 接口格式: https://xyz.supabase.co/rest/v1/table_name?id=eq.123&select=...
    const apiUrl = `${supabaseUrl}/rest/v1/saved_images?id=eq.${id}&select=image_url,caption`;
    
    const dbResponse = await fetch(apiUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse.ok) {
        // 如果数据库报错，直接返回原始页面
        return fetch(request); 
    }

    const data = await dbResponse.json();
    // data 是一个数组，我们取第一个
    const image = data && data.length > 0 ? data[0] : null;

    if (!image) return fetch(request);

    // 3. 获取原始 HTML
    const indexResponse = await fetch(new URL('/index.html', request.url));
    const html = await indexResponse.text();

    // 4. 准备 Meta 标签
    const safeTitle = (image.caption || 'StoryBoard AI').replace(/"/g, '&quot;').substring(0, 50);
    const description = `Check out this comic panel: "${safeTitle}..."`;
    const imageUrl = image.image_url;

    const newMetaTags = `
      <title>${safeTitle}</title>
      <meta property="og:title" content="${safeTitle}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:image:width" content="1024" />
      <meta property="og:image:height" content="1024" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${safeTitle}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${imageUrl}" />
    `;

    // 5. 暴力插入
    const modifiedHtml = html.replace('</head>', `${newMetaTags}</head>`);

    return new Response(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    console.error('Middleware Error:', error);
    return fetch(request);
  }
}