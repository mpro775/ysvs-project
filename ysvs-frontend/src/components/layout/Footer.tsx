import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react';

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
  { href: 'https://youtube.com', icon: Youtube, label: 'YouTube' },
  { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="border-t bg-neutral-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-bold">
                YSVS
              </div>
              <span className="font-bold">الجمعية اليمنية لجراحة الأوعية</span>
            </div>
            <p className="text-sm text-neutral-400">
              الجمعية اليمنية لجراحة الأوعية الدموية هي جمعية طبية متخصصة تهدف إلى
              تطوير مجال جراحة الأوعية في اليمن من خلال التعليم المستمر والمؤتمرات
              العلمية.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-bold">روابط سريعة</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-neutral-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 font-bold">معلومات التواصل</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>صنعاء، اليمن</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Phone className="h-4 w-4 shrink-0" />
                <span dir="ltr">+967 1 234 567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-neutral-400">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@ysvs.org</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="mb-4 font-bold">تابعنا</h3>
            <div className="flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 transition-colors hover:bg-primary-600 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          <p>
            © {new Date().getFullYear()} الجمعية اليمنية لجراحة الأوعية الدموية.
            جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
}
