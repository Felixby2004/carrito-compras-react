const DEFAULT_PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80';

/**
 * Utilidad genérica para normalizar las URLs de las imágenes de productos.
 */
export function fixImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_PRODUCT_FALLBACK;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  
  return `${protocol}//${hostname}:3001${cleanPath}`;
}

