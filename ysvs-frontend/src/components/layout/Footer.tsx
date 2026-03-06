import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Youtube,
  Instagram,
} from 'lucide-react';
import logo from '@/assets/logo.png';
import { useSitePublicContent } from '@/api/hooks/useContent';
import type { FooterQuickLink, FooterSocialLink } from '@/types';

const fallbackQuickLinks: FooterQuickLink[] = [
  { href: '/about', labelAr: 'عن الجمعية', labelEn: 'About', order: 0, isActive: true },
  { href: '/events', labelAr: 'المؤتمرات', labelEn: 'Events', order: 1, isActive: true },
  { href: '/news', labelAr: 'الأخبار', labelEn: 'News', order: 2, isActive: true },
  {
    href: '/verify',
    labelAr: 'التحقق من الشهادات',
    labelEn: 'Certificate Verification',
    order: 3,
    isActive: true,
  },
  { href: '/contact', labelAr: 'تواصل معنا', labelEn: 'Contact', order: 4, isActive: true },
];

const fallbackSocialLinks: FooterSocialLink[] = [
  { platform: 'facebook', url: 'https://facebook.com', order: 0, isActive: true },
  { platform: 'twitter', url: 'https://twitter.com', order: 1, isActive: true },
  { platform: 'instagram', url: 'https://instagram.com', order: 2, isActive: true },
  { platform: 'youtube', url: 'https://youtube.com', order: 3, isActive: true },
];

const socialIconMap = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
};

const isInternalHref = (href: string) => href.startsWith('/');

export function Footer() {
  const { data } = useSitePublicContent();

  const footer = data?.footer;
  const quickLinks =
    footer?.quickLinks?.filter((link) => link.isActive).sort((a, b) => a.order - b.order) ||
    fallbackQuickLinks;
  const socialLinks =
    footer?.socialLinks
      ?.filter((social) => social.isActive)
      .sort((a, b) => a.order - b.order) || fallbackSocialLinks;

  const address = footer?.addressAr || 'صنعاء، اليمن شارع الزبيري';
  const phone = footer?.phone || '+967 123 456 789';
  const email = footer?.email || 'info@ysvs.org';
  const description =
    footer?.descriptionAr ||
    'الجمعية اليمنية لجراحة الأوعية الدموية - تسعى لتطوير الرعاية الصحية المتخصصة في اليمن من خلال التدريب والبحث العلمي.';
  const copyright = footer?.copyrightAr || 'جميع الحقوق محفوظة.';

  return (
    <footer className="border-t border-primary-900/40 bg-gradient-to-b from-primary-950 to-primary-900 text-white dark:border-white/10 dark:from-neutral-950 dark:to-neutral-900">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="grid gap-10 text-right md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:order-3">
            <h3 className="mb-5 text-xl font-bold">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-white/85">
              <li className="flex items-center justify-between gap-4">
                <span>{address}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-200">
                  <MapPin className="h-5 w-5" />
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span dir="ltr">{phone}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-200">
                  <Phone className="h-5 w-5" />
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>{email}</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-primary-200">
                  <Mail className="h-5 w-5" />
                </span>
              </li>
            </ul>
          </div>

          <div className="lg:order-2">
            <h3 className="mb-5 text-xl font-bold">روابط سريعة</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  {isInternalHref(link.href) ? (
                    <Link
                      to={link.href}
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.labelAr}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/80 transition-colors hover:text-white"
                    >
                      {link.labelAr}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:order-1">
            <Link to="/" className="mb-4 inline-flex">
              <img
                src={logo}
                alt="شعار الجمعية اليمنية لجراحة الأوعية"
                className="h-16 w-auto object-contain sm:h-20"
              />
            </Link>
            <p className="mb-6 max-w-md text-sm leading-7 text-white/85">
              {description}
            </p>
            <div className="flex flex-row-reverse gap-2">
              {socialLinks.map((social) => (
                <a
                  key={`${social.platform}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/90 transition-colors hover:bg-white/20"
                  aria-label={social.platform}
                >
                  {(() => {
                    const Icon =
                      socialIconMap[social.platform.toLowerCase() as keyof typeof socialIconMap] ||
                      Instagram;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-4 border-t border-white/10 pt-6 text-sm text-white/65 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="transition-colors hover:text-white">
              سياسة الخصوصية
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              الشروط والأحكام
            </Link>
          </div>
          <p>
            © {new Date().getFullYear()} الجمعية اليمنية لجراحة الأوعية الدموية. {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
