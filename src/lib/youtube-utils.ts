/**
 * Extrai o ID do vídeo de uma URL do YouTube
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Suporta formatos:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // ID direto
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Gera a URL da thumbnail do YouTube
 */
export function getYouTubeThumbnail(videoIdOrUrl: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'maxres'): string {
  const videoId = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl;
  
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Gera a URL de embed do YouTube
 */
export function getYouTubeEmbedUrl(videoIdOrUrl: string): string {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return '';
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

/**
 * Formata a duração em minutos para exibição
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Verifica se uma URL é válida do YouTube
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}
