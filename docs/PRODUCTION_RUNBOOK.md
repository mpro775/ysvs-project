# Runbook نشر الإنتاج (Production)

هذا الدليل يوضح خطوات تجهيز بيئة الإنتاج ونقاط التحقق السريعة بعد النشر، مع التركيز على نظام المؤتمرات والنماذج الديناميكية ورفع الملفات إلى Cloudflare R2.

---

## 1) إعداد متغيرات البيئة

## Backend (`ysvs-backend/.env`)

```env
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database
MONGODB_URI=<your-mongodb-uri>

# JWT
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-refresh-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FRONTEND_URL=https://<frontend-domain>
CORS_ORIGINS=https://<admin-domain>,https://<frontend-domain>

# Storage
STORAGE_PROVIDER=r2
MAX_FILE_SIZE=5242880

# Cloudflare R2
R2_REGION=auto
R2_ACCOUNT_ID=<account-id>
R2_ACCESS_KEY_ID=<access-key-id>
R2_SECRET_ACCESS_KEY=<secret-access-key>
R2_BUCKET=<bucket-name>
R2_PUBLIC_URL=https://<cdn-or-custom-domain>
```

## Frontend (`ysvs-frontend/.env.production`)

```env
VITE_API_URL=https://<api-domain>/api/v1
```

---

## 2) نشر الخدمات

## Backend

```bash
npm install
npm run build
npm run start:prod
```

## Frontend

```bash
npm install
npm run build
```

ثم انشر محتوى `ysvs-frontend/dist` عبر خادم الويب/المنصة المستخدمة.

---

## 3) Smoke Test بعد النشر (حرج)

## A. فحص API الأساسية

- افتح توثيق Swagger على: `https://<api-domain>/api/docs`
- تأكد أن هذه المسارات تعمل:
  - `GET /events`
  - `GET /events/upcoming`
  - `GET /events/slug-availability/:slug`

## B. فحص تجربة الإدارة

1. سجّل دخول كـ Admin.
2. اذهب إلى صفحة إنشاء مؤتمر: `/admin/events/create`.
3. أدخل عنوان إنجليزي وتأكد أن `slug` يتولد تلقائيًا ويظهر كمتاح/غير متاح.
4. أدخل `registrationDeadline` وتأكد من التحقق الزمني (لا يقبل موعد بعد بداية المؤتمر).
5. أنشئ المؤتمر بنجاح.

## C. فحص نموذج التسجيل ورفع الملفات

1. من صفحة المؤتمر العامة: `/events/:slug`.
2. افتح تبويب التسجيل.
3. ارفع ملف مقبول (PDF/JPG/PNG ضمن الحد).
4. أكمل إرسال التسجيل.
5. تحقق من:
   - نجاح التسجيل.
   - ظهور الملف في صفحة المسجلين: `/admin/events/:id/registrants` كرابط قابل للفتح.

## D. فحص حالات الرفض

- ملف بنوع غير مسموح -> يجب ظهور رسالة واضحة.
- ملف أكبر من الحد -> يجب ظهور رسالة واضحة.
- رابط مختصر مستخدم -> يجب منع الحفظ في إنشاء/تعديل المؤتمر.

---

## 4) مراقبة ما بعد الإطلاق (أول 24 ساعة)

- راقب سجلات الأخطاء في الباكند، خاصة:
  - فشل الرفع إلى R2.
  - أخطاء `400/413` في رفع الملفات.
  - أي `5xx` في `events/register` و `events/register/upload`.
- راقب عمليات التسجيل الحقيقية وعدد الرفع الناجح.

---

## 5) Rollback سريع

إذا ظهرت مشكلة حرجة في R2:

1. غيّر `STORAGE_PROVIDER=local` مؤقتًا.
2. أعد تشغيل خدمة الباكند.
3. استمر بمراقبة التسجيلات حتى إصلاح إعدادات R2.

> ملاحظة: هذا الحل مؤقت للطوارئ؛ يجب إعادة تفعيل R2 بعد تصحيح الإعدادات.
