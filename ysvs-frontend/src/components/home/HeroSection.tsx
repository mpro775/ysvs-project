import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mouse } from 'lucide-react';
import headerBg from '@/assets/header-bg.png';

export function HeroSection() {
  return (
    <section
      className="relative min-h-[calc(100vh-48px)] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${headerBg})` }}
    >
      <div className="absolute inset-0 bg-white/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/25 to-white/40" />

      <div className="container relative mx-auto px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-[#1f2f86] lg:text-6xl">
            الجمعية اليمنية لجراحة الأوعية الدموية
          </h1>
          <p className="mb-10 text-base font-bold leading-8 text-[#1f2538] sm:text-lg">
            نعمل على تطوير مجال جراحة الأوعية الدموية في اليمن من خلال التعليم
            المستمر والمؤتمرات العلمية وتبادل الخبرات
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg bg-[#8B0000] px-6 text-white hover:bg-[#6F0000]"
            >
              <Link to="/events">تصفح المؤتمرات</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg bg-[#3a36d3] px-6 text-white hover:bg-[#2f2bbd]"
            >
              <Link to="/about" className="flex items-center gap-2">
                تعرف علينا
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-14 hidden flex-col items-center text-[#5c6385] sm:flex">
            <span className="mb-2 text-xs">اكتشف المزيد</span>
            <Mouse className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
