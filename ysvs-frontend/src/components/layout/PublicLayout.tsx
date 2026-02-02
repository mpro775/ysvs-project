import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { LiveBanner } from './LiveBanner';
import { useStreamStatus } from '@/api/hooks/useStreaming';

export default function PublicLayout() {
  const { data: streamStatus } = useStreamStatus();

  return (
    <div className="flex min-h-screen flex-col">
      {streamStatus?.isLive && <LiveBanner />}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
