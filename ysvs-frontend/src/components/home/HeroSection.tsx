import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Mouse } from 'lucide-react';
import headerBg from '@/assets/header-bg.png';

interface HeroSectionProps {
  isLive?: boolean;
  streamUrl?: string;
}

export function HeroSection({ isLive, streamUrl }: HeroSectionProps) {
  if (isLive && streamUrl) {
    return (
      <section className="relative bg-neutral-900" id="live">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="font-bold text-white">البث المباشر</span>
          </div>
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={streamUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="البث المباشر"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative min-h-[calc(100vh-48px)] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${headerBg})` }}
    >
      <div className="absolute inset-0 bg-white/80" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/75" />

      <div className="container relative mx-auto px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight text-[#1f2f86] lg:text-6xl">
            الجمعية اليمنية لجراحة الأوعية الدموية
          </h1>
          <p className="mb-10 text-base leading-8 text-[#2e3346] sm:text-lg">
            نعمل على تطوير مجال جراحة الأوعية الدموية في اليمن من خلال التعليم
            المستمر والمؤتمرات العلمية وتبادل الخبرات
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg bg-[#3a36d3] px-6 text-white hover:bg-[#2f2bbd]"
            >
              <Link to="/events">تصفح المؤتمرات</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg border border-[#d7dbeb] bg-white px-6 text-[#26337f] hover:bg-[#f4f6fc]"
            >
              <Link to="/about" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                تعرف علينا
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
