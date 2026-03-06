import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { setSeo, SITE_DESCRIPTION, SITE_NAME } from '@/lib/seo';

export default function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;

    let title = SITE_NAME;
    let description = SITE_DESCRIPTION;
    let robots = 'index, follow';

    if (pathname === '/about') {
      title = `About Us | ${SITE_NAME}`;
      description =
        'Learn about the Yemen Society of Vascular Surgery, its mission, board members, and scientific activities.';
    } else if (pathname === '/events') {
      title = `Events | ${SITE_NAME}`;
      description =
        'Browse upcoming and past conferences, workshops, and scientific meetings organized by the Yemen Society of Vascular Surgery.';
    } else if (pathname.startsWith('/events/')) {
      title = `Event Details | ${SITE_NAME}`;
      description = 'Conference details, registration information, and schedule updates.';
      robots = 'noindex, follow';
    } else if (pathname === '/news') {
      title = `News | ${SITE_NAME}`;
      description =
        'Read the latest announcements, medical updates, and association news from the Yemen Society of Vascular Surgery.';
    } else if (pathname.startsWith('/news/')) {
      title = `News Article | ${SITE_NAME}`;
      description = 'News article from the Yemen Society of Vascular Surgery.';
    } else if (pathname === '/contact') {
      title = `Contact Us | ${SITE_NAME}`;
      description =
        'Get in touch with the Yemen Society of Vascular Surgery for inquiries, collaboration, and support.';
    } else if (pathname === '/privacy') {
      title = `Privacy Policy | ${SITE_NAME}`;
      robots = 'noindex, follow';
    } else if (pathname === '/terms') {
      title = `Terms and Conditions | ${SITE_NAME}`;
      robots = 'noindex, follow';
    } else if (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname.startsWith('/reset-password/') ||
      pathname === '/verify' ||
      pathname.startsWith('/verify/') ||
      pathname === '/certificate-download'
    ) {
      title = `${SITE_NAME}`;
      robots = 'noindex, nofollow';
    }

    setSeo({ title, description, robots });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
