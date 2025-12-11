import { createClient } from '@supabase/supabase-js';

export const config = {
  // Only run this middleware on gallery routes
  matcher: '/gallery/:path*',
  runtime: 'edge',
};

// Initialize Supabase Client
const supabaseUrl = 'https://kpbubonhlbmqucmijmfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYnVib25obGJtcXVjbWlqbWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjk0MDksImV4cCI6MjA4MDY0NTQwOX0.YBSmUGor5OUYBcWVNNj5gH3dHj6ZHAcWTLeS1Eb5Do0';

export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // Extract ID from /gallery/[id]
  // url.pathname example: "/gallery/123-abc-456"
  const segments = url.pathname.split('/');
  const id = segments[segments.length - 1];

  // If no ID found, forward the request as-is
  if (!id) {
    return fetch(request);
  }

  try {
    // 1. Fetch image data from Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: image } = await supabase
      .from('saved_images')
      .select('image_url, caption')
      .eq('id', id)
      .single();

    // If image not found in DB, forward to standard app (which handles 404s)
    if (!image) {
      return fetch(request);
    }

    // 2. Fetch the raw index.html from the origin
    // Since this is a SPA, we need the "shell" file to inject data into.
    // We explicitly fetch /index.html to avoid infinite recursion if we fetched request.url
    const indexResponse = await fetch(new URL('/index.html', request.url));
    const html = await indexResponse.text();

    // 3. Prepare Dynamic Metadata
    const title = `StoryBoard AI: ${image.caption.length > 40 ? image.caption.substring(0, 40) + '...' : image.caption}`;
    // Escape quotes to prevent breaking HTML attributes
    const safeTitle = title.replace(/"/g, '&quot;');
    const safeCaption = image.caption.replace(/"/g, '&quot;');
    
    const description = `Check out this comic panel generated with StoryBoard AI: "${safeCaption}"`;
    const imageUrl = image.image_url;

    // 4. Inject Metadata into HTML string
    // We replace the default tags present in index.html with specific data
    let modifiedHtml = html
      // Replace Title
      .replace(/<title>.*?<\/title>/, `<title>${safeTitle}</title>`)
      // Replace Open Graph Title
      .replace(/property="og:title" content=".*?"/, `property="og:title" content="${safeTitle}"`)
      // Replace Twitter Title
      .replace(/name="twitter:title" content=".*?"/, `name="twitter:title" content="${safeTitle}"`)
      // Replace Description (Open Graph)
      .replace(/property="og:description" content=".*?"/, `property="og:description" content="${description}"`)
      // Replace Description (Twitter)
      .replace(/name="twitter:description" content=".*?"/, `name="twitter:description" content="${description}"`)
      // Replace Image (Open Graph) - Target the specific default imgur link or generic content attribute
      .replace(/property="og:image" content=".*?"/, `property="og:image" content="${imageUrl}"`)
      // Replace Image (Twitter)
      .replace(/name="twitter:image" content=".*?"/, `name="twitter:image" content="${imageUrl}"`);

    // 5. Return the modified HTML response
    return new Response(modifiedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // prevent caching so dynamic meta tags update correctly if the image changes
        'Cache-Control': 'no-cache, no-store, must-revalidate' 
      },
    });

  } catch (error) {
    console.error('Middleware Error:', error);
    // Fallback: serve the original request if something breaks
    return fetch(request);
  }
}