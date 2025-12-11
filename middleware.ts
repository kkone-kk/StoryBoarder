import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client for Edge Runtime
// Using the anon key is safe here as we only need read access
const supabaseUrl = 'https://kpbubonhlbmqucmijmfr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYnVib25obGJtcXVjbWlqbWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjk0MDksImV4cCI6MjA4MDY0NTQwOX0.YBSmUGor5OUYBcWVNNj5gH3dHj6ZHAcWTLeS1Eb5Do0';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  
  // Only run logic for gallery paths
  if (!url.pathname.startsWith('/gallery/')) {
    return NextResponse.next();
  }

  // Extract ID from /gallery/[id]
  const id = url.pathname.split('/').pop();
  
  if (!id) {
    return NextResponse.next();
  }

  try {
    // 1. Fetch image data from Supabase
    // We create a new client instance here to ensure it works in the Edge environment
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: image } = await supabase
      .from('saved_images')
      .select('image_url, caption')
      .eq('id', id)
      .single();

    // If image not found, just serve the default index.html (client-side app will handle 404)
    if (!image) {
       return NextResponse.next();
    }

    // 2. Fetch the raw index.html
    // We fetch the root URL of the deployment to get the static HTML file
    const indexUrl = new URL('/', request.url);
    const indexResponse = await fetch(indexUrl);
    const html = await indexResponse.text();

    // 3. Prepare Dynamic Metadata
    const title = `StoryBoard AI: ${image.caption.length > 40 ? image.caption.substring(0, 40) + '...' : image.caption}`;
    const description = `Check out this comic panel generated with StoryBoard AI: "${image.caption}"`;
    const imageUrl = image.image_url;

    // 4. Inject Metadata into HTML
    // We replace the default tags found in index.html with our dynamic values
    let modifiedHtml = html
      // Replace Titles
      .replace(/content="StoryBoarder AI"/g, `content="${title}"`)
      .replace(/<title>StoryBoarder AI<\/title>/, `<title>${title}</title>`)
      // Replace Descriptions
      .replace(
        /content="A high-fidelity comic and storyboard generator for product managers and researchers."/g, 
        `content="${description}"`
      )
      // Replace Images (matches the default imgur link in your index.html)
      .replace(
        /content="https:\/\/i\.imgur\.com\/3BXBqCR\.png"/g, 
        `content="${imageUrl}"`
      );

    // 5. Return the modified HTML
    return new NextResponse(modifiedHtml, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Middleware Error:', error);
    // On error, fallback to default behavior
    return NextResponse.next();
  }
}

// Configure matcher to only run on gallery routes
export const config = {
  matcher: '/gallery/:path*',
};