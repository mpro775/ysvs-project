import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

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
    <section className="relative overflow-hidden bg-gradient-to-bl from-primary-900 via-primary-800 to-primary-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h1 className="mb-6 text-4xl font-extrabold leading-tight lg:text-5xl">
            الجمعية اليمنية لجراحة الأوعية الدموية
          </h1>
          <p className="mb-8 text-lg text-primary-200 lg:text-xl">
            نعمل على تطوير مجال جراحة الأوعية الدموية في اليمن من خلال التعليم
            المستمر والمؤتمرات العلمية وتبادل الخبرات
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-white text-primary-900 hover:bg-primary-50">
              <Link to="/events">تصفح المؤتمرات</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link to="/about" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                تعرف علينا
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
