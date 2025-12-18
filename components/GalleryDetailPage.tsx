
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Button } from './Button';
import { ShareBtn } from './ShareBtn';
import { Home, Loader2, Download, Calendar, ArrowLeft } from 'lucide-react';
import { StickyCTA } from './StickyCTA';

interface Props {
  id: string;
  onNavigateHome: () => void;
}

interface SavedImage {
  id: string;
  created_at: string;
  image_url: string;
  caption: string;
  user_id: string;
}

export const GalleryDetailPage: React.FC<Props> = ({ id, onNavigateHome }) => {
  const [image, setImage] = useState<SavedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper to update meta tags dynamically for social previews
  const updateMetaTags = (title: string, description: string, imageUrl: string) => {
    document.title = title;

    const setMeta = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        // Create element if it doesn't exist
        element = document.createElement('meta');
        if (selector.includes('property=')) {
          element.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        } else if (selector.includes('name=')) {
          element.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Open Graph (Facebook, LinkedIn, etc.)
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:image"]', imageUrl);
    setMeta('meta[property="og:url"]', window.location.href);
    setMeta('meta[property="og:type"]', 'website');

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
    setMeta('meta[name="twitter:image"]', imageUrl);
  };

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('saved_images')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setImage(data);
        
        if (data) {
           // Set dynamic metadata once data is loaded
           const pageTitle = `StoryBoard AI: ${data.caption.length > 50 ? data.caption.substring(0, 50) + '...' : data.caption}`;
           const pageDesc = `Check out this comic panel generated with StoryBoard AI: "${data.caption}"`;
           updateMetaTags(pageTitle, pageDesc, data.image_url);
        }
      } catch (err: any) {
        console.error('Error fetching image:', err);
        setError('Image not found or has been deleted.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
        fetchImage();
    }
    
    // Cleanup: Reset title and meta tags when leaving the page
    return () => {
        document.title = 'StoryBoarder AI';
        updateMetaTags('StoryBoarder AI', 'A high-fidelity comic and storyboard generator.', ''); // Reset to default or empty
    };
  }, [id]);

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image.image_url;
    link.download = `storyboard-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in">
        <Loader2 className="animate-spin text-gray-900 mb-4" size={32} />
        <p className="text-gray-500">Loading scene...</p>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center animate-fade-in text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold">!</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-500 mb-8 max-w-md">{error || "We couldn't find the page you're looking for."}</p>
        <Button onClick={onNavigateHome}>
             <Home size={18} className="mr-2" /> Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-32">
      {/* Navbar for this view */}
      <div className="flex justify-between items-center mb-8 px-2">
         <Button variant="ghost" onClick={onNavigateHome} className="pl-0 hover:bg-transparent text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} className="mr-2" /> Back to Home
         </Button>
         <div className="flex gap-2">
            <ShareBtn id={image.id} variant="primary" />
            <Button variant="secondary" onClick={handleDownload} title="Download Image">
                <Download size={18} />
            </Button>
         </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden">
        {/* Image Container */}
        <div className="bg-gray-50 flex items-center justify-center min-h-[400px] p-4 md:p-12">
             <img 
                src={image.image_url} 
                alt={image.caption} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm" 
             />
        </div>

        {/* Content */}
        <div className="p-8 md:p-10">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-semibold mb-4 uppercase tracking-widest">
                <Calendar size={14} /> {formatDate(image.created_at)}
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {image.caption}
            </h1>

            <div className="flex items-center gap-4 pt-8 border-t border-gray-100">
                 <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold">
                    S
                 </div>
                 <div>
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">StoryBoard AI Original</p>
                    <p className="text-xs text-gray-500">Visual narratives for researchers and product managers.</p>
                 </div>
            </div>
        </div>
      </div>

      {/* High-Contrast Floating Pill CTA */}
      <StickyCTA onClick={onNavigateHome} />
    </div>
  );
};
