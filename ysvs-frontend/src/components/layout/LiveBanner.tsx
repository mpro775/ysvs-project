import { Link } from 'react-router-dom';
import { Radio, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function LiveBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative bg-gradient-to-l from-red-600 to-red-700 text-white">
      <div className="container mx-auto flex items-center justify-center gap-3 px-4 py-2">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">البث المباشر متاح الآن</span>
        </div>
        <Link
          to="/#live"
          className="rounded-full bg-white/20 px-4 py-1 text-sm font-medium transition-colors hover:bg-white/30"
        >
          انضم الآن
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 h-6 w-6 text-white hover:bg-white/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
