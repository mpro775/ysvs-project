# 🌐 خطة تنفيذ الموقع العام (Public Website Implementation Plan)

## مشروع منصة الجمعية اليمنية لجراحة الأوعية الدموية (YSVS)

**الإصدار:** 1.0.0  
**تاريخ البدء:** يناير 2026  
**الإطار التقني:** React 19 + Vite + TypeScript  
**التصميم:** Tailwind CSS + Shadcn/ui  
**إدارة الحالة:** TanStack Query + Zustand  

---

## 📋 جدول المحتويات

1. [نظرة عامة على الموقع](#1-نظرة-عامة-على-الموقع)
2. [هيكلة المشروع](#2-هيكلة-المشروع)
3. [الهوية البصرية والتصميم](#3-الهوية-البصرية-والتصميم)
4. [الصفحات والمكونات](#4-الصفحات-والمكونات)
5. [المرحلة الأولى: التأسيس](#5-المرحلة-الأولى-التأسيس)
6. [المرحلة الثانية: الصفحات الثابتة](#6-المرحلة-الثانية-الصفحات-الثابتة)
7. [المرحلة الثالثة: نظام المؤتمرات](#7-المرحلة-الثالثة-نظام-المؤتمرات)
8. [المرحلة الرابعة: بوابة الأعضاء](#8-المرحلة-الرابعة-بوابة-الأعضاء)
9. [المرحلة الخامسة: التحسينات](#9-المرحلة-الخامسة-التحسينات)
10. [خريطة الموقع](#10-خريطة-الموقع)

---

## 1. نظرة عامة على الموقع

### 1.1 الجمهور المستهدف

| الفئة | الاحتياجات |
|-------|-----------|
| **الأطباء الأعضاء** | التسجيل في المؤتمرات، تحميل الشهادات، متابعة الأخبار |
| **الزوار العامون** | معرفة الجمعية، الأخبار، التحقق من الشهادات |
| **الجهات الطبية** | التحقق من صحة الشهادات، معرفة الفعاليات |

### 1.2 الأهداف الرئيسية

- ✅ واجهة احترافية تعكس مكانة الجمعية الطبية
- ✅ تجربة مستخدم سلسة (RTL) بالعربية
- ✅ سرعة تحميل فائقة (SPA)
- ✅ تصميم متجاوب لجميع الأجهزة
- ✅ تحسين محركات البحث (SEO)

### 1.3 الميزات الفريدة

| الميزة | الوصف |
|--------|-------|
| **Hero Section الذكي** | يتحول تلقائياً لعرض البث المباشر عند تفعيله |
| **العداد التنازلي** | يعرض أقرب مؤتمر قادم تلقائياً |
| **نموذج التسجيل الديناميكي** | يتشكل بناءً على متطلبات كل مؤتمر |
| **التحقق الفوري** | صفحة تحقق من الشهادات عبر QR Code |

---

## 2. هيكلة المشروع

### 2.1 بنية المجلدات

```bash
ysvs-website/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── hero/
│       └── placeholders/
│
├── src/
│   ├── api/                        # طبقة الاتصال بالـ API
│   │   ├── axios.ts                # Axios Instance
│   │   ├── endpoints.ts            # روابط الـ API
│   │   └── hooks/                  # React Query Hooks
│   │       ├── useEvents.ts
│   │       ├── useArticles.ts
│   │       ├── useAuth.ts
│   │       ├── useCertificates.ts
│   │       └── useStreaming.ts
│   │
│   ├── components/                 # المكونات
│   │   ├── ui/                     # Shadcn/ui Components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 # مكونات الهيكل
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── LiveBanner.tsx      # شريط البث المباشر
│   │   │
│   │   ├── home/                   # مكونات الصفحة الرئيسية
│   │   │   ├── HeroSection.tsx
│   │   │   ├── LiveStreamHero.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── LatestNews.tsx
│   │   │   ├── UpcomingEvents.tsx
│   │   │   └── StatsSection.tsx
│   │   │
│   │   ├── events/                 # مكونات المؤتمرات
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventDetails.tsx
│   │   │   ├── DynamicForm.tsx     # ⭐ النموذج الديناميكي
│   │   │   ├── TicketSelector.tsx
│   │   │   └── RegistrationSuccess.tsx
│   │   │
│   │   ├── news/                   # مكونات الأخبار
│   │   │   ├── ArticleCard.tsx
│   │   │   ├── ArticleContent.tsx
│   │   │   └── CategoryFilter.tsx
│   │   │
│   │   ├── about/                  # مكونات عن الجمعية
│   │   │   ├── BoardMemberCard.tsx
│   │   │   ├── Timeline.tsx
│   │   │   └── VisionMission.tsx
│   │   │
│   │   ├── certificates/           # مكونات الشهادات
│   │   │   ├── VerificationResult.tsx
│   │   │   ├── CertificateCard.tsx
│   │   │   └── DownloadButton.tsx
│   │   │
│   │   ├── auth/                   # مكونات المصادقة
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   └── shared/                 # مكونات مشتركة
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       ├── Pagination.tsx
│   │       ├── SEOHead.tsx
│   │       └── OptimizedImage.tsx
│   │
│   ├── pages/                      # الصفحات
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── NewsPage.tsx
│   │   ├── NewsDetailPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── VerifyPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── member/                 # صفحات الأعضاء (Protected)
│   │       ├── DashboardPage.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── MyCertificatesPage.tsx
│   │       └── MyEventsPage.tsx
│   │
│   ├── hooks/                      # Custom Hooks
│   │   ├── useCountdown.ts
│   │   ├── useScrollDirection.ts
│   │   ├── useMediaQuery.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── stores/                     # Zustand Stores
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── lib/                        # أدوات مساعدة
│   │   ├── utils.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   │
│   ├── types/                      # TypeScript Types
│   │   ├── event.types.ts
│   │   ├── user.types.ts
│   │   ├── article.types.ts
│   │   └── api.types.ts
│   │
│   ├── styles/                     # الأنماط
│   │   ├── globals.css
│   │   └── fonts.css
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx                  # React Router Config
│
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

---

## 3. الهوية البصرية والتصميم

### 3.1 لوحة الألوان (Color Palette)

```css
/* tailwind.config.js */
colors: {
  primary: {
    50:  '#EFF6FF',   /* خلفيات فاتحة */
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',   /* اللون الأساسي - أزرق طبي */
    600: '#2563EB',   /* للأزرار */
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',   /* للعناوين */
  },
  accent: {
    500: '#10B981',   /* أخضر - للنجاح والتأكيد */
    600: '#059669',
  },
  medical: {
    red: '#EF4444',   /* للتنبيهات */
    gold: '#F59E0B',  /* للشهادات */
  },
  neutral: {
    50:  '#F9FAFB',   /* خلفية الصفحة */
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',   /* نص ثانوي */
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',   /* نص أساسي */
    900: '#111827',
  }
}
```

### 3.2 الخطوط (Typography)

```css
/* fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

:root {
  --font-primary: 'Tajawal', sans-serif;
}

/* الأحجام */
.text-hero    { font-size: 3rem; font-weight: 800; }    /* 48px */
.text-h1      { font-size: 2.25rem; font-weight: 700; } /* 36px */
.text-h2      { font-size: 1.875rem; font-weight: 700; }/* 30px */
.text-h3      { font-size: 1.5rem; font-weight: 600; }  /* 24px */
.text-body    { font-size: 1rem; font-weight: 400; }    /* 16px */
.text-small   { font-size: 0.875rem; }                  /* 14px */
```

### 3.3 مبادئ التصميم

| المبدأ | التطبيق |
|--------|---------|
| **RTL First** | كل التصميم يبدأ من اليمين لليسار |
| **Mobile First** | التصميم للجوال أولاً ثم التوسع |
| **Whitespace** | مساحات بيضاء كافية للراحة البصرية |
| **Consistency** | توحيد الأنماط والمسافات |
| **Accessibility** | تباين ألوان كافٍ (WCAG AA) |

### 3.4 مكونات التصميم الأساسية

```tsx
// مثال على Button Variants
<Button variant="primary">تسجيل الآن</Button>
<Button variant="secondary">المزيد</Button>
<Button variant="outline">إلغاء</Button>
<Button variant="ghost">رابط</Button>
<Button variant="danger">حذف</Button>

// مثال على Card
<Card>
  <CardHeader>
    <CardTitle>عنوان البطاقة</CardTitle>
  </CardHeader>
  <CardContent>المحتوى</CardContent>
  <CardFooter>
    <Button>إجراء</Button>
  </CardFooter>
</Card>
```

---

## 4. الصفحات والمكونات

### 4.1 خريطة الصفحات

```
🏠 الصفحة الرئيسية (/)
├── 📰 الأخبار (/news)
│   └── 📄 تفاصيل الخبر (/news/:slug)
├── 🎪 المؤتمرات (/events)
│   └── 📋 تفاصيل المؤتمر (/events/:slug)
├── ℹ️ عن الجمعية (/about)
├── 📞 تواصل معنا (/contact)
├── ✅ التحقق من الشهادات (/verify/:serial?)
├── 🔐 تسجيل الدخول (/login)
├── 📝 إنشاء حساب (/register)
└── 👤 بوابة الأعضاء (/member) [Protected]
    ├── 📊 لوحة التحكم (/member/dashboard)
    ├── 👤 الملف الشخصي (/member/profile)
    ├── 🎫 مؤتمراتي (/member/events)
    └── 📜 شهاداتي (/member/certificates)
```

### 4.2 تفصيل المكونات الرئيسية

#### 4.2.1 Header & Navigation

```tsx
// Header.tsx
┌─────────────────────────────────────────────────────────────┐
│ [🔴 LIVE] البث المباشر متاح الآن - انضم الآن              │ ← LiveBanner (يظهر عند البث)
├─────────────────────────────────────────────────────────────┤
│ [LOGO]  الرئيسية | المؤتمرات | الأخبار | عن الجمعية | اتصل  │
│                                          [🔍] [تسجيل دخول] │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Hero Section الذكي

```tsx
// HeroSection.tsx - يتحول حسب حالة البث
{isLive ? (
  <LiveStreamHero 
    embedUrl={streamUrl}
    title={streamTitle}
    viewerCount={viewers}
  />
) : (
  <DefaultHero>
    <Slider images={heroImages} />
    <CountdownTimer targetDate={nextEvent.startDate} />
    <CTAButton href={`/events/${nextEvent.slug}`}>
      سجل في {nextEvent.title}
    </CTAButton>
  </DefaultHero>
)}
```

#### 4.2.3 العداد التنازلي

```tsx
// CountdownTimer.tsx
┌─────────────────────────────────────────┐
│     المؤتمر السنوي الخامس يبدأ خلال:    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  15  │ │  08  │ │  32  │ │  45  │   │
│  │ يوم  │ │ ساعة │ │ دقيقة│ │ ثانية│   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│           [سجل الآن →]                  │
└─────────────────────────────────────────┘
```

#### 4.2.4 النموذج الديناميكي (⭐ الأهم)

```tsx
// DynamicForm.tsx
interface DynamicFormProps {
  schema: FormField[];      // من الباك إند
  onSubmit: (data: any) => void;
}

// يقوم برسم الحقول ديناميكياً
const DynamicForm = ({ schema, onSubmit }) => {
  const form = useForm();
  
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return <Input {...field} />;
      case 'select':
        return <Select options={field.options} {...field} />;
      case 'file':
        return <FileUpload accept={field.validation?.fileTypes} {...field} />;
      case 'textarea':
        return <Textarea {...field} />;
      // ... باقي الأنواع
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {schema
        .sort((a, b) => a.order - b.order)
        .map(field => (
          <FormField key={field.id}>
            <Label>{field.label}</Label>
            {renderField(field)}
            {field.required && <span className="text-red-500">*</span>}
          </FormField>
        ))}
      <Button type="submit">إرسال التسجيل</Button>
    </form>
  );
};
```

#### 4.2.5 صفحة التحقق من الشهادات

```tsx
// VerifyPage.tsx
┌─────────────────────────────────────────────────────────────┐
│                  🔍 التحقق من صحة الشهادة                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   أدخل الرقم التسلسلي للشهادة:                              │
│   ┌─────────────────────────────────┐                      │
│   │ YSVS-2026-12345                 │  [تحقق]             │
│   └─────────────────────────────────┘                      │
│                                                             │
│   ─────────────── أو ───────────────                       │
│                                                             │
│   امسح رمز QR الموجود على الشهادة                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   ✅ شهادة موثقة وصالحة                                     │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  📜 شهادة حضور                                       │  │
│   │  ─────────────────────────────────────────────────  │  │
│   │  الاسم: د. أحمد محمد علي                             │  │
│   │  المؤتمر: المؤتمر السنوي الخامس لجراحة الأوعية       │  │
│   │  الساعات المعتمدة: 12 ساعة CME                       │  │
│   │  تاريخ الإصدار: 15 يناير 2026                        │  │
│   │  الرقم التسلسلي: YSVS-2026-12345                     │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. المرحلة الأولى: التأسيس

### 📅 المدة المتوقعة: 4-5 أيام

### 5.1 المهام

- [ ] **5.1.1** إنشاء مشروع Vite + React 19
  ```bash
  npm create vite@latest ysvs-website -- --template react-ts
  cd ysvs-website
  npm install
  ```

- [ ] **5.1.2** تثبيت الحزم الأساسية
  ```bash
  # Styling
  npm install tailwindcss postcss autoprefixer
  npm install @tailwindcss/typography @tailwindcss/forms
  npx tailwindcss init -p
  
  # UI Components
  npx shadcn@latest init
  npx shadcn@latest add button input card dialog form toast tabs
  
  # State & Data Fetching
  npm install @tanstack/react-query axios
  npm install zustand
  
  # Forms & Validation
  npm install react-hook-form @hookform/resolvers zod
  
  # Routing
  npm install react-router-dom
  
  # Utilities
  npm install date-fns clsx tailwind-merge
  npm install lucide-react
  npm install react-helmet-async
  ```

- [ ] **5.1.3** إعداد Tailwind مع RTL
  ```js
  // tailwind.config.js
  module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
      extend: {
        fontFamily: {
          sans: ['Tajawal', 'sans-serif'],
        },
        colors: {
          // الألوان المذكورة أعلاه
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
      require('@tailwindcss/forms'),
    ],
  }
  ```

- [ ] **5.1.4** إعداد Axios Instance
  ```typescript
  // src/api/axios.ts
  import axios from 'axios';

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request Interceptor - إرفاق التوكن
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response Interceptor - معالجة الأخطاء
  api.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  export default api;
  ```

- [ ] **5.1.5** إعداد React Query
  ```typescript
  // src/main.tsx
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 دقائق
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  ```

- [ ] **5.1.6** إعداد React Router
  ```typescript
  // src/router.tsx
  import { createBrowserRouter } from 'react-router-dom';

  export const router = createBrowserRouter([
    {
      path: '/',
      element: <PublicLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'news', element: <NewsPage /> },
        { path: 'news/:slug', element: <NewsDetailPage /> },
        { path: 'events', element: <EventsPage /> },
        { path: 'events/:slug', element: <EventDetailPage /> },
        { path: 'about', element: <AboutPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'verify/:serial?', element: <VerifyPage /> },
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
      ],
    },
    {
      path: '/member',
      element: <ProtectedRoute><MemberLayout /></ProtectedRoute>,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'events', element: <MyEventsPage /> },
        { path: 'certificates', element: <MyCertificatesPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ]);
  ```

- [ ] **5.1.7** إنشاء Auth Store (Zustand)
  ```typescript
  // src/stores/authStore.ts
  import { create } from 'zustand';
  import { persist } from 'zustand/middleware';

  interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
  }

  export const useAuthStore = create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: (user, token) => set({ user, token, isAuthenticated: true }),
        logout: () => set({ user: null, token: null, isAuthenticated: false }),
      }),
      { name: 'auth-storage' }
    )
  );
  ```

- [ ] **5.1.8** إنشاء Layout الأساسي

### 5.2 معايير القبول

- ✅ المشروع يعمل بدون أخطاء
- ✅ Tailwind يعمل مع RTL
- ✅ React Query مُعد بشكل صحيح
- ✅ التوجيه يعمل لجميع الصفحات
- ✅ Auth Store يحفظ الحالة

---

## 6. المرحلة الثانية: الصفحات الثابتة

### 📅 المدة المتوقعة: 5-6 أيام

### 6.1 المهام

#### الصفحة الرئيسية

- [ ] **6.1.1** إنشاء Header + Navbar
  - شعار الجمعية
  - قائمة التنقل (Desktop & Mobile)
  - زر تسجيل الدخول
  - شريط البث المباشر (LiveBanner)

- [ ] **6.1.2** إنشاء Hero Section
  - Slider للصور
  - العداد التنازلي
  - زر CTA للتسجيل

- [ ] **6.1.3** إنشاء قسم أحدث الأخبار
  ```typescript
  // useArticles.ts
  export const useLatestArticles = () => {
    return useQuery({
      queryKey: ['articles', 'latest'],
      queryFn: () => api.get('/content/articles?limit=3&status=published'),
    });
  };
  ```

- [ ] **6.1.4** إنشاء قسم المؤتمرات القادمة

- [ ] **6.1.5** إنشاء Footer
  - معلومات الجمعية
  - روابط سريعة
  - وسائل التواصل
  - حقوق النشر

#### صفحة عن الجمعية

- [ ] **6.1.6** إنشاء قسم الرؤية والرسالة
- [ ] **6.1.7** إنشاء قسم مجلس الإدارة (BoardMemberCard)
- [ ] **6.1.8** إنشاء Timeline تاريخ الجمعية

#### صفحة الأخبار

- [ ] **6.1.9** إنشاء قائمة الأخبار مع Pagination
- [ ] **6.1.10** إنشاء فلتر التصنيفات
- [ ] **6.1.11** إنشاء صفحة تفاصيل الخبر

#### صفحة تواصل معنا

- [ ] **6.1.12** إنشاء نموذج التواصل
- [ ] **6.1.13** إنشاء خريطة الموقع (Google Maps Embed)
- [ ] **6.1.14** معلومات الاتصال

### 6.2 معايير القبول

- ✅ جميع الصفحات الثابتة تعمل
- ✅ التصميم متجاوب (Mobile, Tablet, Desktop)
- ✅ البيانات تُجلب من الـ API
- ✅ Loading States تظهر أثناء التحميل
- ✅ Error States تظهر عند الفشل

---

## 7. المرحلة الثالثة: نظام المؤتمرات

### 📅 المدة المتوقعة: 6-7 أيام

### 7.1 المهام

#### صفحة قائمة المؤتمرات

- [ ] **7.1.1** إنشاء EventCard Component
  ```tsx
  <EventCard>
    <EventImage src={event.coverImage} />
    <EventBadge status={event.status} /> {/* قادم | جارٍ | منتهي */}
    <EventTitle>{event.title}</EventTitle>
    <EventDate>{formatDate(event.startDate)}</EventDate>
    <EventLocation>{event.location.city}</EventLocation>
    <Button>التفاصيل</Button>
  </EventCard>
  ```

- [ ] **7.1.2** إنشاء فلتر الحالة (قادم/منتهي)
- [ ] **7.1.3** إنشاء Pagination

#### صفحة تفاصيل المؤتمر

- [ ] **7.1.4** إنشاء Hero المؤتمر
  - صورة الغلاف
  - العنوان والتاريخ
  - العداد التنازلي (إذا قادم)

- [ ] **7.1.5** إنشاء Tabs للمحتوى
  ```tsx
  <Tabs defaultValue="about">
    <TabsList>
      <TabsTrigger value="about">نبذة</TabsTrigger>
      <TabsTrigger value="speakers">المتحدثون</TabsTrigger>
      <TabsTrigger value="schedule">الجدول</TabsTrigger>
      <TabsTrigger value="register">التسجيل</TabsTrigger>
    </TabsList>
    <TabsContent value="about">...</TabsContent>
    <TabsContent value="speakers">...</TabsContent>
    <TabsContent value="schedule">...</TabsContent>
    <TabsContent value="register">
      <DynamicForm schema={event.formSchema} />
    </TabsContent>
  </Tabs>
  ```

#### النموذج الديناميكي (⭐ الأهم)

- [ ] **7.1.6** إنشاء DynamicForm Component
  ```typescript
  // src/components/events/DynamicForm.tsx
  const fieldComponents: Record<string, React.FC> = {
    text: TextInput,
    textarea: TextareaInput,
    select: SelectInput,
    multiselect: MultiSelectInput,
    checkbox: CheckboxInput,
    radio: RadioInput,
    file: FileInput,
    date: DateInput,
    email: EmailInput,
    phone: PhoneInput,
  };
  ```

- [ ] **7.1.7** إنشاء مكونات الحقول
  - TextInput
  - TextareaInput
  - SelectInput
  - FileInput (مع Drag & Drop)
  - DateInput
  - CheckboxInput
  - RadioInput

- [ ] **7.1.8** إنشاء Dynamic Validation
  ```typescript
  // بناء Schema الـ Zod ديناميكياً
  const buildValidationSchema = (fields: FormField[]) => {
    const shape: Record<string, z.ZodType> = {};
    
    fields.forEach(field => {
      let validator: z.ZodType = z.string();
      
      if (field.type === 'email') {
        validator = z.string().email('بريد إلكتروني غير صالح');
      }
      
      if (field.validation?.minLength) {
        validator = (validator as z.ZodString).min(
          field.validation.minLength,
          `الحد الأدنى ${field.validation.minLength} حرف`
        );
      }
      
      if (!field.required) {
        validator = validator.optional();
      }
      
      shape[field.id] = validator;
    });
    
    return z.object(shape);
  };
  ```

- [ ] **7.1.9** إنشاء TicketSelector
  ```tsx
  <TicketSelector>
    {event.ticketTypes.map(ticket => (
      <TicketOption
        key={ticket.id}
        name={ticket.name}
        price={ticket.price}
        available={ticket.available}
        selected={selectedTicket === ticket.id}
        onSelect={() => setSelectedTicket(ticket.id)}
      />
    ))}
  </TicketSelector>
  ```

- [ ] **7.1.10** إنشاء RegistrationSuccess Page

### 7.2 React Query Hooks

```typescript
// src/api/hooks/useEvents.ts

// جلب قائمة المؤتمرات
export const useEvents = (filters?: EventFilters) => {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => api.get('/events', { params: filters }),
  });
};

// جلب أقرب مؤتمر (للعداد)
export const useUpcomingEvent = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => api.get('/events/upcoming'),
    staleTime: 60 * 1000, // دقيقة واحدة
  });
};

// جلب تفاصيل مؤتمر
export const useEvent = (slug: string) => {
  return useQuery({
    queryKey: ['events', slug],
    queryFn: () => api.get(`/events/${slug}`),
    enabled: !!slug,
  });
};

// جلب نموذج التسجيل
export const useEventFormSchema = (eventId: string) => {
  return useQuery({
    queryKey: ['events', eventId, 'form-schema'],
    queryFn: () => api.get(`/events/${eventId}/form-schema`),
    enabled: !!eventId,
  });
};

// التسجيل في مؤتمر
export const useRegisterEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) =>
      api.post(`/events/${eventId}/register`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('تم التسجيل بنجاح!');
    },
  });
};
```

### 7.3 معايير القبول

- ✅ قائمة المؤتمرات تعرض بشكل صحيح
- ✅ الفلترة والـ Pagination تعمل
- ✅ النموذج الديناميكي يرسم جميع أنواع الحقول
- ✅ التحقق من البيانات يعمل (Client-side)
- ✅ التسجيل يُرسل للـ API بنجاح
- ✅ رسائل النجاح/الفشل تظهر

---

## 8. المرحلة الرابعة: بوابة الأعضاء

### 📅 المدة المتوقعة: 5-6 أيام

### 8.1 المهام

#### المصادقة (Authentication)

- [ ] **8.1.1** إنشاء LoginForm
  ```tsx
  <LoginForm>
    <Input type="email" placeholder="البريد الإلكتروني" />
    <Input type="password" placeholder="كلمة المرور" />
    <Link to="/forgot-password">نسيت كلمة المرور؟</Link>
    <Button type="submit">تسجيل الدخول</Button>
    <Divider>أو</Divider>
    <Link to="/register">إنشاء حساب جديد</Link>
  </LoginForm>
  ```

- [ ] **8.1.2** إنشاء RegisterForm
  ```tsx
  <RegisterForm>
    <Input name="fullNameAr" label="الاسم الكامل (عربي)" />
    <Input name="fullNameEn" label="الاسم الكامل (إنجليزي)" />
    <Input name="email" type="email" label="البريد الإلكتروني" />
    <Input name="phone" label="رقم الهاتف" />
    <Select name="specialty" label="التخصص" options={specialties} />
    <Input name="workplace" label="مكان العمل" />
    <Input name="password" type="password" label="كلمة المرور" />
    <Input name="confirmPassword" type="password" label="تأكيد كلمة المرور" />
    <Checkbox name="terms">أوافق على الشروط والأحكام</Checkbox>
    <Button type="submit">إنشاء الحساب</Button>
  </RegisterForm>
  ```

- [ ] **8.1.3** إنشاء ForgotPassword Flow
- [ ] **8.1.4** إنشاء ProtectedRoute Component

#### بوابة الأعضاء

- [ ] **8.1.5** إنشاء MemberLayout
  ```tsx
  <MemberLayout>
    <Sidebar>
      <NavLink to="/member">لوحة التحكم</NavLink>
      <NavLink to="/member/events">مؤتمراتي</NavLink>
      <NavLink to="/member/certificates">شهاداتي</NavLink>
      <NavLink to="/member/profile">الملف الشخصي</NavLink>
    </Sidebar>
    <MainContent>
      <Outlet />
    </MainContent>
  </MemberLayout>
  ```

- [ ] **8.1.6** إنشاء Dashboard Page
  - إحصائيات سريعة (عدد المؤتمرات، الشهادات)
  - آخر النشاطات
  - مؤتمرات قادمة مسجل فيها

- [ ] **8.1.7** إنشاء MyEvents Page
  ```tsx
  <MyEventsPage>
    <Tabs>
      <Tab value="upcoming">القادمة</Tab>
      <Tab value="past">السابقة</Tab>
    </Tabs>
    <EventsList>
      {events.map(event => (
        <MyEventCard
          event={event}
          registration={event.myRegistration}
          certificate={event.certificate}
        />
      ))}
    </EventsList>
  </MyEventsPage>
  ```

- [ ] **8.1.8** إنشاء MyCertificates Page
  ```tsx
  <MyCertificatesPage>
    <CertificatesGrid>
      {certificates.map(cert => (
        <CertificateCard
          key={cert.id}
          serialNumber={cert.serialNumber}
          eventTitle={cert.eventTitle}
          issueDate={cert.issueDate}
          cmeHours={cert.cmeHours}
          onDownload={() => downloadCertificate(cert.id)}
        />
      ))}
    </CertificatesGrid>
  </MyCertificatesPage>
  ```

- [ ] **8.1.9** إنشاء Profile Page
  - عرض البيانات الشخصية
  - تعديل البيانات
  - تغيير كلمة المرور
  - رفع الصورة الشخصية

#### صفحة التحقق من الشهادات

- [ ] **8.1.10** إنشاء VerifyPage
  ```typescript
  // src/pages/VerifyPage.tsx
  const VerifyPage = () => {
    const { serial } = useParams();
    const [searchSerial, setSearchSerial] = useState(serial || '');
    
    const { data, isLoading, error } = useVerifyCertificate(searchSerial);
    
    return (
      <div>
        <SearchForm onSubmit={setSearchSerial} />
        
        {isLoading && <LoadingSpinner />}
        
        {data?.valid ? (
          <ValidCertificateCard certificate={data.certificate} />
        ) : (
          <InvalidCertificateMessage />
        )}
      </div>
    );
  };
  ```

### 8.2 React Query Hooks

```typescript
// src/api/hooks/useAuth.ts

export const useLogin = () => {
  const { login } = useAuthStore();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      api.post('/auth/login', credentials),
    onSuccess: (data) => {
      login(data.user, data.token);
      toast.success('تم تسجيل الدخول بنجاح');
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => api.post('/auth/register', data),
    onSuccess: () => {
      toast.success('تم إنشاء الحساب بنجاح');
    },
  });
};

export const useCurrentUser = () => {
  const { token } = useAuthStore();
  
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    enabled: !!token,
  });
};

// src/api/hooks/useCertificates.ts

export const useMyCertificates = () => {
  return useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: () => api.get('/certificates/my-certificates'),
  });
};

export const useVerifyCertificate = (serial: string) => {
  return useQuery({
    queryKey: ['certificates', 'verify', serial],
    queryFn: () => api.get(`/certificates/verify/${serial}`),
    enabled: !!serial && serial.length > 5,
  });
};

export const useDownloadCertificate = () => {
  return useMutation({
    mutationFn: (id: string) =>
      api.get(`/certificates/download/${id}`, { responseType: 'blob' }),
    onSuccess: (blob, id) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${id}.pdf`;
      a.click();
    },
  });
};
```

### 8.3 معايير القبول

- ✅ تسجيل الدخول/الخروج يعمل
- ✅ إنشاء حساب جديد يعمل
- ✅ الصفحات المحمية لا يمكن الوصول إليها بدون تسجيل
- ✅ بوابة الأعضاء تعرض البيانات بشكل صحيح
- ✅ تحميل الشهادات يعمل
- ✅ صفحة التحقق تعمل

---

## 9. المرحلة الخامسة: التحسينات

### 📅 المدة المتوقعة: 3-4 أيام

### 9.1 المهام

#### الأداء (Performance)

- [ ] **9.1.1** Code Splitting
  ```typescript
  // Lazy Loading للصفحات
  const HomePage = lazy(() => import('./pages/HomePage'));
  const EventsPage = lazy(() => import('./pages/EventsPage'));
  const MemberDashboard = lazy(() => import('./pages/member/DashboardPage'));
  
  // في Router
  <Suspense fallback={<PageLoader />}>
    <Routes>...</Routes>
  </Suspense>
  ```

- [ ] **9.1.2** Image Optimization
  ```tsx
  // OptimizedImage Component
  const OptimizedImage = ({ src, alt, ...props }) => {
    const [loaded, setLoaded] = useState(false);
    
    return (
      <div className="relative">
        {!loaded && <Skeleton className="absolute inset-0" />}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn('transition-opacity', loaded ? 'opacity-100' : 'opacity-0')}
          {...props}
        />
      </div>
    );
  };
  ```

- [ ] **9.1.3** Prefetching
  ```typescript
  // Prefetch عند Hover
  const EventCard = ({ event }) => {
    const queryClient = useQueryClient();
    
    const handleMouseEnter = () => {
      queryClient.prefetchQuery({
        queryKey: ['events', event.slug],
        queryFn: () => api.get(`/events/${event.slug}`),
      });
    };
    
    return <Card onMouseEnter={handleMouseEnter}>...</Card>;
  };
  ```

#### SEO

- [ ] **9.1.4** إنشاء SEOHead Component
  ```tsx
  // src/components/shared/SEOHead.tsx
  import { Helmet } from 'react-helmet-async';

  const SEOHead = ({ title, description, image, url }) => (
    <Helmet>
      <title>{title} | الجمعية اليمنية لجراحة الأوعية الدموية</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
  ```

- [ ] **9.1.5** إضافة SEO لكل صفحة

#### البث المباشر (Real-time)

- [ ] **9.1.6** إنشاء WebSocket Connection
  ```typescript
  // src/hooks/useStreamStatus.ts
  import { useEffect, useState } from 'react';
  import { io } from 'socket.io-client';

  export const useStreamStatus = () => {
    const [status, setStatus] = useState({ isLive: false });
    
    useEffect(() => {
      const socket = io(import.meta.env.VITE_WS_URL);
      
      socket.on('stream:status', setStatus);
      socket.on('stream:started', () => setStatus(s => ({ ...s, isLive: true })));
      socket.on('stream:ended', () => setStatus(s => ({ ...s, isLive: false })));
      
      return () => socket.disconnect();
    }, []);
    
    return status;
  };
  ```

- [ ] **9.1.7** إنشاء LiveBanner Component

#### تجربة المستخدم (UX)

- [ ] **9.1.8** إنشاء صفحات الخطأ
  - 404 Not Found
  - 500 Server Error
  - Offline Page

- [ ] **9.1.9** إضافة Skeleton Loaders
- [ ] **9.1.10** إضافة Toast Notifications
- [ ] **9.1.11** إضافة Confirmation Dialogs

### 9.2 معايير القبول

- ✅ Lighthouse Score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ SEO Meta Tags موجودة
- ✅ البث المباشر يُحدث فوراً
- ✅ تجربة مستخدم سلسة

---

## 10. خريطة الموقع

### 10.1 Sitemap

```
ysvs.org/
├── /                           # الصفحة الرئيسية
├── /about                      # عن الجمعية
├── /news                       # الأخبار
│   └── /news/:slug            # تفاصيل الخبر
├── /events                     # المؤتمرات
│   └── /events/:slug          # تفاصيل المؤتمر + التسجيل
├── /verify                     # التحقق من الشهادات
│   └── /verify/:serial        # نتيجة التحقق
├── /contact                    # تواصل معنا
├── /login                      # تسجيل الدخول
├── /register                   # إنشاء حساب
├── /forgot-password           # نسيت كلمة المرور
├── /reset-password/:token     # إعادة تعيين كلمة المرور
└── /member/                    # بوابة الأعضاء [Protected]
    ├── /member                # لوحة التحكم
    ├── /member/profile        # الملف الشخصي
    ├── /member/events         # مؤتمراتي
    └── /member/certificates   # شهاداتي
```

### 10.2 ملخص الجدول الزمني

| المرحلة | المدة | المخرجات |
|---------|-------|----------|
| 1. التأسيس | 4-5 أيام | هيكل المشروع، API Layer، Auth Store |
| 2. الصفحات الثابتة | 5-6 أيام | الرئيسية، عن الجمعية، الأخبار، تواصل |
| 3. نظام المؤتمرات | 6-7 أيام | قائمة المؤتمرات، النموذج الديناميكي |
| 4. بوابة الأعضاء | 5-6 أيام | تسجيل الدخول، البوابة، الشهادات |
| 5. التحسينات | 3-4 أيام | SEO، Performance، Real-time |
| **المجموع** | **~25 يوم** | **موقع عام كامل** |

---

## 📝 ملاحظات للمطورين

1. **RTL:** تأكد من اختبار كل مكون بالعربية
2. **Accessibility:** استخدم `aria-labels` و `role` attributes
3. **Testing:** اكتب اختبارات للمكونات الحرجة (DynamicForm)
4. **Error Handling:** تعامل مع جميع حالات الخطأ
5. **Mobile First:** ابدأ التصميم من الجوال

---

**تم إعداد هذه الخطة لضمان بناء موقع احترافي يعكس مكانة الجمعية الطبية.**

*آخر تحديث: يناير 2026*
