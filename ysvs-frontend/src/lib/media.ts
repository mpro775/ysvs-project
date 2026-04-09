const DEFAULT_API_BASE_URL = 'https://api.ysvs.smartagency-ye.com/api/v1';
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || DEFAULT_API_BASE_URL;

function getApiOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) {
    return '';
  }

  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    const origin = getApiOrigin();
    return origin ? `${origin}${url}` : url;
  }

  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}
