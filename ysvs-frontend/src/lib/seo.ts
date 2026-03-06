export const SITE_NAME = 'Yemen Society of Vascular Surgery';

export const SITE_DESCRIPTION =
  'Official website of Yemen Society of Vascular Surgery for conferences, news, membership services, and certificate verification.';

type SeoConfig = {
  title?: string;
  description?: string;
  robots?: string;
  image?: string;
  type?: 'website' | 'article';
};

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute('content', content);
}

function ensureCanonical(url: string) {
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  canonical.setAttribute('href', url);
}

function toAbsoluteUrl(url: string) {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export function setSeo({
  title = SITE_NAME,
  description = SITE_DESCRIPTION,
  robots = 'index, follow',
  image = '/src/assets/logo.jpg',
  type = 'website',
}: SeoConfig = {}) {
  const canonicalUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
  const imageUrl = toAbsoluteUrl(image);

  document.title = title;

  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots);

  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:locale', 'ar_YE');
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:image', imageUrl);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', imageUrl);

  ensureCanonical(canonicalUrl);
}
