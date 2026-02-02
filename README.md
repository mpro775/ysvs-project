# YSVS — المنصة الرقمية للجمعية اليمنية لجراحة الأوعية الدموية

**YSVS Digital Platform** — Yemen Society for Vascular Surgery

منصة ويب متكاملة (Backend API + Frontend) لإدارة المؤتمرات، الفعاليات، الشهادات، والبث المباشر.

---

## التقنيات | Tech Stack

| الجزء    | التقنية                 |
| -------- | ----------------------- |
| Backend  | NestJS, MongoDB, Redis  |
| Frontend | React, Vite, TypeScript |
| التشغيل  | Docker, Docker Compose  |

---

## هيكل المشروع | Project Structure

```
ysvs-project/
├── ysvs-backend/     # NestJS API
├── ysvs-frontend/    # React (Vite) SPA
├── docker-compose.yml
└── README.md
```

---

## التشغيل المحلي | Local Development

### المتطلبات

- Node.js 18+
- MongoDB
- Redis (اختياري للتطوير)
- أو استخدام Docker فقط

### Backend

```bash
cd ysvs-backend
cp .env.example .env
# عدّل .env (قاعدة البيانات، JWT، إلخ)
npm install
npm run start:dev
```

### Frontend

```bash
cd ysvs-frontend
npm install
npm run dev
```

### التشغيل بـ Docker

```bash
# إنشاء الشبكة إن لم تكن موجودة
docker network create web-network

docker-compose up -d
```

---

## الإعداد لأول مرة | First-Time Setup

1. استنساخ المستودع:

   ```bash
   git clone https://github.com/YOUR_USERNAME/ysvs-project.git
   cd ysvs-project
   ```

2. Backend: انسخ `ysvs-backend/.env.example` إلى `ysvs-backend/.env` وعدّل القيم (قاعدة البيانات، JWT، البريد، إلخ).

3. Frontend: لا يحتاج متغيرات بيئة للتطوير المحلي عادةً؛ تأكد أن `VITE_API_URL` أو إعدادات الـ API تشير إلى عنوان الـ Backend.

---

## التوثيق | Documentation

- [متطلبات النظام (SRS)](./YSVS_Requirements_Specification.md)
- خطط التنفيذ: `YSVS_*_Plan.md` في جذر المشروع.

---

## الترخيص | License

استخدام داخلي للجمعية اليمنية لجراحة الأوعية الدموية.

---

## رفع المشروع إلى GitHub | Push to GitHub

بعد إنشاء مستودع جديد على [GitHub](https://github.com/new) (بدون README أو .gitignore):

```bash
git remote add origin https://github.com/YOUR_USERNAME/ysvs-project.git
git branch -M main
git push -u origin main
```

استبدل `YOUR_USERNAME` باسم مستخدمك أو اسم المنظمة.

---

## المساهمة | Contributing

1. Fork المستودع
2. أنشئ فرعاً للميزة: `git checkout -b feature/اسم-الميزة`
3. Commit التغييرات: `git commit -m 'إضافة ميزة X'`
4. Push للفرع: `git push origin feature/اسم-الميزة`
5. افتح Pull Request
