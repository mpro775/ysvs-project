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

const quickLinks = [
  { href: '/about', label: 'عن الجمعية' },
  { href: '/events', label: 'المؤتمرات' },
  { href: '/news', label: 'الأخبار' },
  { href: '/verify', label: 'التحقق من الشهادات' },
  { href: '/contact', label: 'تواصل معنا' },
];

const socialLinks = [
  { href: 'https://facebook.com', icon: Facebook, label: 'Facebook' },
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
  { href: 'https://instagram.com', icon: Instagram, label: 'Instagram' },
  { href: 'https://youtube.com', icon: Youtube, label: 'YouTube' },
];

export function Footer() {
  return (
    <footer className="border-t border-[#0f63b6] bg-[#0f1f3a] text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="grid gap-10 text-right md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:order-3">
            <h3 className="mb-5 text-xl font-bold">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-white/85">
              <li className="flex items-center justify-between gap-4">
                <span>صنعاء، اليمن شارع الزبيري</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f3661] text-[#6cb7ff]">
                  <MapPin className="h-5 w-5" />
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span dir="ltr">+967 123 456 789</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f3661] text-[#6cb7ff]">
                  <Phone className="h-5 w-5" />
                </span>
              </li>
              <li className="flex items-center justify-between gap-4">
                <span>info@ysvs.org</span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1f3661] text-[#6cb7ff]">
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
                  <Link
                    to={link.href}
                    className="text-sm text-white/80 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
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
              الجمعية اليمنية لجراحة الأوعية الدموية - تسعى لتطوير الرعاية الصحية
              المتخصصة في اليمن من خلال التدريب والبحث العلمي.
            </p>
            <div className="flex flex-row-reverse gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2b3d5f] text-white/90 transition-colors hover:bg-[#3b5f93]"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
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
            © {new Date().getFullYear()} الجمعية اليمنية لجراحة الأوعية الدموية.
            جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
