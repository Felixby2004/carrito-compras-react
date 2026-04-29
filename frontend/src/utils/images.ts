/**
 * Utilidad para normalizar las URLs de las imágenes.
 * Si la URL es relativa (empieza con /uploads), le añade el backendUrl.
 * Si ya es una URL absoluta, la deja como está.
 */
export function fixImageUrl(url: string | null | undefined): string {
  if (!url) return 'https://placehold.co/300x300?text=Sin+imagen';
  
  // Si ya es una URL absoluta (http:// o https://), no hacemos nada
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Obtener la URL base del backend desde las variables de entorno
  // VITE_API_URL suele ser algo como http://localhost:3000/api/v1
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  
  // Extraer el origen (protocolo + host)
  try {
    const urlObj = new URL(apiUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    // Si la url empieza con /uploads o uploads, la normalizamos
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanPath}`;
  } catch (error) {
    console.error('Error parsing VITE_API_URL:', error);
    return url;
  }
}
