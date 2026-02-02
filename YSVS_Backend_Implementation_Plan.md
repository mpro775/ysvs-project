# 🏗️ خطة تنفيذ الباك إند (Backend Implementation Plan)

## مشروع منصة الجمعية اليمنية لجراحة الأوعية الدموية (YSVS)

**الإصدار:** 1.0.0  
**تاريخ البدء:** يناير 2026  
**الإطار البرمجي:** NestJS + TypeScript  
**قاعدة البيانات:** MongoDB (Mongoose)  
**التخزين المؤقت:** Redis  

---

## 📋 جدول المحتويات

1. [هيكلة المشروع](#1-هيكلة-المشروع)
2. [المرحلة الأولى: التأسيس والبنية التحتية](#2-المرحلة-الأولى-التأسيس-والبنية-التحتية)
3. [المرحلة الثانية: نظام المصادقة والصلاحيات](#3-المرحلة-الثانية-نظام-المصادقة-والصلاحيات)
4. [المرحلة الثالثة: إدارة المحتوى والأعضاء](#4-المرحلة-الثالثة-إدارة-المحتوى-والأعضاء)
5. [المرحلة الرابعة: نظام المؤتمرات الديناميكي](#5-المرحلة-الرابعة-نظام-المؤتمرات-الديناميكي)
6. [المرحلة الخامسة: نظام الشهادات](#6-المرحلة-الخامسة-نظام-الشهادات)
7. [المرحلة السادسة: نظام البث المباشر](#7-المرحلة-السادسة-نظام-البث-المباشر)
8. [المرحلة السابعة: الاختبار والنشر](#8-المرحلة-السابعة-الاختبار-والنشر)
9. [مخططات قاعدة البيانات](#9-مخططات-قاعدة-البيانات)
10. [نقاط النهاية API](#10-نقاط-النهاية-api)

---

## 1. هيكلة المشروع

### 1.1 بنية المجلدات (Project Structure)

```bash
ysvs-backend/
├── src/
│   ├── common/                    # الأدوات المشتركة
│   │   ├── decorators/            # Custom Decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/               # Exception Filters
│   │   │   └── global-exception.filter.ts
│   │   ├── guards/                # Auth Guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/          # Response Interceptors
│   │   │   ├── transform.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/                 # Validation Pipes
│   │   │   └── validation.pipe.ts
│   │   ├── dto/                   # Shared DTOs
│   │   │   └── pagination.dto.ts
│   │   └── interfaces/            # Shared Interfaces
│   │       └── response.interface.ts
│   │
│   ├── config/                    # إعدادات البيئة
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── mail.config.ts
│   │
│   ├── modules/                   # الوحدات الرئيسية
│   │   ├── auth/                  # المصادقة
│   │   │   ├── dto/
│   │   │   ├── guards/
│   │   │   ├── strategies/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                 # إدارة المستخدمين
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── events/                # المؤتمرات والفعاليات
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── events.controller.ts
│   │   │   ├── events.service.ts
│   │   │   ├── registration.service.ts
│   │   │   ├── form-builder.service.ts
│   │   │   └── events.module.ts
│   │   │
│   │   ├── certificates/          # الشهادات
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── templates/
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   ├── pdf-generator.service.ts
│   │   │   └── certificates.module.ts
│   │   │
│   │   ├── streaming/             # البث المباشر
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── streaming.controller.ts
│   │   │   ├── streaming.service.ts
│   │   │   ├── streaming.gateway.ts
│   │   │   └── streaming.module.ts
│   │   │
│   │   ├── content/               # إدارة المحتوى
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── content.controller.ts
│   │   │   ├── content.service.ts
│   │   │   └── content.module.ts
│   │   │
│   │   ├── board/                 # مجلس الإدارة
│   │   │   ├── dto/
│   │   │   ├── schemas/
│   │   │   ├── board.controller.ts
│   │   │   ├── board.service.ts
│   │   │   └── board.module.ts
│   │   │
│   │   └── media/                 # الوسائط والملفات
│   │       ├── dto/
│   │       ├── media.controller.ts
│   │       ├── media.service.ts
│   │       └── media.module.ts
│   │
│   ├── providers/                 # خدمات خارجية
│   │   ├── mail/
│   │   │   ├── mail.service.ts
│   │   │   ├── templates/
│   │   │   └── mail.module.ts
│   │   ├── storage/
│   │   │   ├── storage.service.ts
│   │   │   └── storage.module.ts
│   │   └── cache/
│   │       ├── cache.service.ts
│   │       └── cache.module.ts
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/                          # الاختبارات
│   ├── e2e/
│   └── unit/
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

### 1.2 المبادئ المعمارية

| المبدأ | الوصف |
|--------|-------|
| **Modular Monolith** | فصل منطقي للوحدات مع سهولة النشر |
| **Clean Architecture** | فصل طبقات العمل عن البنية التحتية |
| **SOLID Principles** | مبادئ البرمجة الكائنية النظيفة |
| **Repository Pattern** | فصل منطق الوصول للبيانات |
| **DTO Pattern** | التحقق من البيانات عند الحدود |

---

## 2. المرحلة الأولى: التأسيس والبنية التحتية

### 📅 المدة المتوقعة: 3-4 أيام

### 2.1 المهام

- [ ] **2.1.1** إنشاء مشروع NestJS جديد
  ```bash
  nest new ysvs-backend
  ```

- [ ] **2.1.2** تثبيت الحزم الأساسية
  ```bash
  npm install @nestjs/mongoose mongoose
  npm install @nestjs/config
  npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis
  npm install @nestjs/swagger swagger-ui-express
  npm install class-validator class-transformer
  npm install bcryptjs
  npm install helmet
  npm install compression
  npm install winston nest-winston
  ```

- [ ] **2.1.3** إعداد ملفات البيئة (.env)
  ```env
  # Application
  NODE_ENV=development
  PORT=3000
  API_PREFIX=api/v1
  
  # Database
  MONGODB_URI=mongodb://localhost:27017/ysvs
  
  # JWT
  JWT_SECRET=your-super-secret-key
  JWT_EXPIRES_IN=7d
  
  # Redis
  REDIS_HOST=localhost
  REDIS_PORT=6379
  
  # Mail
  MAIL_HOST=smtp.example.com
  MAIL_PORT=587
  MAIL_USER=
  MAIL_PASS=
  
  # Storage
  UPLOAD_PATH=./uploads
  MAX_FILE_SIZE=5242880
  ```

- [ ] **2.1.4** إنشاء Global Exception Filter
  ```typescript
  // src/common/filters/global-exception.filter.ts
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      // معالجة الأخطاء وتحويلها لرسائل صديقة للمستخدم
    }
  }
  ```

- [ ] **2.1.5** إنشاء Transform Interceptor
  ```typescript
  // src/common/interceptors/transform.interceptor.ts
  // توحيد شكل الردود
  {
    "statusCode": 200,
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... },
    "timestamp": "2026-01-12T10:00:00.000Z",
    "path": "/api/v1/..."
  }
  ```

- [ ] **2.1.6** إعداد Swagger Documentation
- [ ] **2.1.7** إعداد Winston Logger
- [ ] **2.1.8** إعداد الاتصال بـ MongoDB
- [ ] **2.1.9** إعداد Redis Cache Manager

### 2.2 الملفات المطلوب إنشاؤها

| الملف | الغرض |
|-------|-------|
| `src/common/filters/global-exception.filter.ts` | معالجة الأخطاء |
| `src/common/interceptors/transform.interceptor.ts` | توحيد الردود |
| `src/common/interceptors/logging.interceptor.ts` | تسجيل الطلبات |
| `src/config/app.config.ts` | إعدادات التطبيق |
| `src/config/database.config.ts` | إعدادات قاعدة البيانات |

### 2.3 معايير القبول (Acceptance Criteria)

- ✅ المشروع يعمل بدون أخطاء
- ✅ الاتصال بـ MongoDB ناجح
- ✅ Swagger متاح على `/api/docs`
- ✅ جميع الردود بالصيغة الموحدة
- ✅ الأخطاء تُسجل في ملفات Log

---

## 3. المرحلة الثانية: نظام المصادقة والصلاحيات

### 📅 المدة المتوقعة: 4-5 أيام

### 3.1 نظام الأدوار (RBAC)

| الدور | الكود | الصلاحيات |
|-------|-------|-----------|
| **Super Admin** | `super_admin` | كامل الصلاحيات + إدارة المشرفين |
| **Admin** | `admin` | إدارة المحتوى والمؤتمرات والأعضاء |
| **Member** | `member` | التسجيل في المؤتمرات + تحميل الشهادات |
| **Public** | `public` | القراءة فقط + التحقق من الشهادات |

### 3.2 المهام

- [ ] **3.2.1** إنشاء User Schema
  ```typescript
  // src/modules/users/schemas/user.schema.ts
  {
    email: string;          // فريد
    password: string;       // مشفر bcrypt
    fullNameAr: string;     // الاسم بالعربي
    fullNameEn: string;     // الاسم بالإنجليزي
    phone: string;
    role: UserRole;
    specialty: string;      // التخصص الطبي
    workplace: string;      // مكان العمل
    membershipDate: Date;
    isActive: boolean;
    isVerified: boolean;
    avatar: string;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

- [ ] **3.2.2** تثبيت حزم المصادقة
  ```bash
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
  npm install @types/passport-jwt @types/passport-local -D
  ```

- [ ] **3.2.3** إنشاء Auth Module
- [ ] **3.2.4** إنشاء JWT Strategy
- [ ] **3.2.5** إنشاء Local Strategy (للتسجيل)
- [ ] **3.2.6** إنشاء Guards (JwtAuthGuard, RolesGuard)
- [ ] **3.2.7** إنشاء Decorators (@Roles, @CurrentUser, @Public)
- [ ] **3.2.8** إنشاء نقاط نهاية المصادقة

### 3.3 نقاط نهاية المصادقة (Auth Endpoints)

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| POST | `/auth/register` | تسجيل عضو جديد | Public |
| POST | `/auth/login` | تسجيل الدخول | Public |
| POST | `/auth/logout` | تسجيل الخروج | Authenticated |
| POST | `/auth/refresh` | تجديد التوكن | Authenticated |
| POST | `/auth/forgot-password` | نسيت كلمة المرور | Public |
| POST | `/auth/reset-password` | إعادة تعيين كلمة المرور | Public |
| GET | `/auth/me` | بيانات المستخدم الحالي | Authenticated |
| PATCH | `/auth/change-password` | تغيير كلمة المرور | Authenticated |

### 3.4 معايير القبول

- ✅ التسجيل يعمل مع التحقق من البيانات
- ✅ تسجيل الدخول يُرجع JWT Token
- ✅ كلمات المرور مشفرة بـ Bcrypt
- ✅ Guards تحمي النقاط المقيدة
- ✅ نظام الأدوار يعمل بشكل صحيح

---

## 4. المرحلة الثالثة: إدارة المحتوى والأعضاء

### 📅 المدة المتوقعة: 4-5 أيام

### 4.1 المهام

#### وحدة الأخبار (Content Module)

- [ ] **4.1.1** إنشاء Article Schema
  ```typescript
  {
    title: string;
    slug: string;           // للـ SEO
    excerpt: string;        // ملخص
    content: string;        // المحتوى الكامل (HTML)
    coverImage: string;
    category: ObjectId;
    tags: string[];
    author: ObjectId;
    status: 'draft' | 'published';
    publishedAt: Date;
    viewCount: number;
    isFeatures: boolean;    // مقال مميز
  }
  ```

- [ ] **4.1.2** إنشاء Category Schema
- [ ] **4.1.3** إنشاء CRUD للأخبار
- [ ] **4.1.4** إنشاء نظام التصنيفات

#### وحدة مجلس الإدارة (Board Module)

- [ ] **4.1.5** إنشاء BoardMember Schema
  ```typescript
  {
    nameAr: string;
    nameEn: string;
    position: string;       // المسمى الوظيفي
    bio: string;
    image: string;
    email: string;
    order: number;          // الترتيب
    isActive: boolean;
  }
  ```

- [ ] **4.1.6** إنشاء CRUD لأعضاء المجلس
- [ ] **4.1.7** نظام الترتيب اليدوي (Drag & Drop Order)

#### وحدة الوسائط (Media Module)

- [ ] **4.1.8** إنشاء نظام رفع الملفات
- [ ] **4.1.9** ضغط وتحسين الصور (WebP)
- [ ] **4.1.10** إنشاء Media Schema للأرشفة

### 4.2 نقاط النهاية

#### الأخبار
| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/content/articles` | قائمة الأخبار | Public |
| GET | `/content/articles/:slug` | خبر واحد | Public |
| POST | `/content/articles` | إنشاء خبر | Admin |
| PATCH | `/content/articles/:id` | تعديل خبر | Admin |
| DELETE | `/content/articles/:id` | حذف خبر | Admin |
| GET | `/content/categories` | التصنيفات | Public |

#### مجلس الإدارة
| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/board/members` | قائمة الأعضاء | Public |
| POST | `/board/members` | إضافة عضو | Admin |
| PATCH | `/board/members/:id` | تعديل عضو | Admin |
| PATCH | `/board/members/reorder` | إعادة الترتيب | Admin |
| DELETE | `/board/members/:id` | حذف عضو | Admin |

### 4.3 معايير القبول

- ✅ CRUD كامل للأخبار والتصنيفات
- ✅ Rich Text يُحفظ ويُعرض بشكل صحيح
- ✅ الصور تُضغط تلقائياً
- ✅ ترتيب أعضاء المجلس يعمل
- ✅ Cache يعمل على القوائم العامة

---

## 5. المرحلة الرابعة: نظام المؤتمرات الديناميكي

### 📅 المدة المتوقعة: 6-7 أيام

### 5.1 المهام

#### Event Schema

- [ ] **5.1.1** إنشاء Event Schema
  ```typescript
  {
    title: string;
    slug: string;
    description: string;
    coverImage: string;
    startDate: Date;
    endDate: Date;
    location: {
      venue: string;
      address: string;
      city: string;
      coordinates: { lat: number, lng: number }
    };
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    registrationOpen: boolean;
    registrationDeadline: Date;
    maxAttendees: number;
    currentAttendees: number;
    formSchema: FormField[];      // ⭐ نموذج التسجيل الديناميكي
    ticketTypes: TicketType[];    // فئات التذاكر
    cmeHours: number;             // ساعات CME
    isLive: boolean;              // هل يوجد بث مباشر
  }
  ```

#### Form Builder (الميزة الحصرية)

- [ ] **5.1.2** تصميم FormField Schema
  ```typescript
  interface FormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 
          'checkbox' | 'radio' | 'file' | 'date' | 'email' | 'phone';
    label: string;
    labelEn: string;
    placeholder: string;
    required: boolean;
    options?: { value: string; label: string }[];  // للقوائم
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      fileTypes?: string[];
      maxFileSize?: number;
    };
    order: number;
  }
  ```

- [ ] **5.1.3** إنشاء Form Builder Service
- [ ] **5.1.4** إنشاء Dynamic Validator
  ```typescript
  // التحقق من البيانات بناءً على الـ Schema المخزنة
  validateRegistrationData(formSchema: FormField[], data: any): ValidationResult
  ```

#### نظام التسجيل

- [ ] **5.1.5** إنشاء Registration Schema
  ```typescript
  {
    event: ObjectId;
    user: ObjectId;
    ticketType: ObjectId;
    formData: Map<string, any>;   // البيانات الديناميكية
    status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    registrationNumber: string;   // رقم التسجيل الفريد
    qrCode: string;
    attendedAt: Date;
    certificateIssued: boolean;
  }
  ```

- [ ] **5.1.6** إنشاء Registration Service
- [ ] **5.1.7** إنشاء نظام التذاكر

#### العداد التنازلي

- [ ] **5.1.8** إنشاء endpoint لأقرب فعالية قادمة

### 5.2 نقاط النهاية

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/events` | قائمة المؤتمرات | Public |
| GET | `/events/upcoming` | أقرب مؤتمر (للعداد) | Public |
| GET | `/events/:slug` | تفاصيل مؤتمر | Public |
| POST | `/events` | إنشاء مؤتمر | Admin |
| PATCH | `/events/:id` | تعديل مؤتمر | Admin |
| DELETE | `/events/:id` | حذف مؤتمر | Admin |
| **PATCH** | **`/events/:id/form-schema`** | **بناء نموذج التسجيل** | **Admin** |
| GET | `/events/:id/form-schema` | جلب نموذج التسجيل | Public |
| **POST** | **`/events/:id/register`** | **التسجيل في مؤتمر** | **Member** |
| GET | `/events/:id/registrations` | قائمة المسجلين | Admin |
| GET | `/events/:id/my-registration` | تسجيلي في المؤتمر | Member |
| PATCH | `/registrations/:id/status` | تغيير حالة التسجيل | Admin |
| PATCH | `/registrations/:id/attendance` | تأكيد الحضور | Admin |

### 5.3 مثال على Form Schema

```json
{
  "formSchema": [
    {
      "id": "specialty",
      "type": "select",
      "label": "التخصص",
      "labelEn": "Specialty",
      "required": true,
      "options": [
        { "value": "vascular", "label": "جراحة الأوعية الدموية" },
        { "value": "cardiac", "label": "جراحة القلب" },
        { "value": "general", "label": "جراحة عامة" }
      ],
      "order": 1
    },
    {
      "id": "experience",
      "type": "text",
      "label": "سنوات الخبرة",
      "required": true,
      "validation": { "pattern": "^[0-9]+$" },
      "order": 2
    },
    {
      "id": "cv",
      "type": "file",
      "label": "السيرة الذاتية",
      "required": false,
      "validation": { 
        "fileTypes": ["pdf", "doc", "docx"],
        "maxFileSize": 5242880
      },
      "order": 3
    }
  ]
}
```

### 5.4 معايير القبول

- ✅ إنشاء مؤتمرات مع كامل البيانات
- ✅ Form Builder يعمل بجميع أنواع الحقول
- ✅ التسجيل يتحقق من البيانات ديناميكياً
- ✅ نظام التذاكر يعمل مع الأسعار
- ✅ العداد التنازلي يُرجع أقرب فعالية

---

## 6. المرحلة الخامسة: نظام الشهادات

### 📅 المدة المتوقعة: 5-6 أيام

### 6.1 المهام

- [ ] **6.1.1** تثبيت حزم PDF و QR
  ```bash
  npm install pdfkit
  npm install qrcode
  npm install uuid
  ```

- [ ] **6.1.2** إنشاء Certificate Schema
  ```typescript
  {
    registration: ObjectId;
    event: ObjectId;
    user: ObjectId;
    serialNumber: string;       // رقم تسلسلي فريد (YSVS-2026-XXXX)
    qrCode: string;             // رابط التحقق
    recipientName: string;      // اسم المستلم
    eventTitle: string;         // اسم المؤتمر
    cmeHours: number;
    issueDate: Date;
    templateUsed: string;
    pdfPath: string;            // مسار الملف المولد
    isValid: boolean;
    revokedAt: Date;
    revokedReason: string;
  }
  ```

- [ ] **6.1.3** إنشاء Certificate Template Schema
  ```typescript
  {
    name: string;
    backgroundImage: string;
    layout: {
      namePosition: { x, y };
      eventPosition: { x, y };
      datePosition: { x, y };
      qrPosition: { x, y };
      serialPosition: { x, y };
    };
    fonts: { ... };
    isDefault: boolean;
  }
  ```

- [ ] **6.1.4** إنشاء PDF Generator Service
  ```typescript
  // توليد PDF عالي الدقة
  generateCertificatePDF(certificate: Certificate, template: Template): Buffer
  ```

- [ ] **6.1.5** إنشاء QR Code Generator
- [ ] **6.1.6** إنشاء Serial Number Generator
  ```typescript
  // Format: YSVS-2026-XXXXX
  generateSerialNumber(): string
  ```

- [ ] **6.1.7** إنشاء Bulk Generation Service
- [ ] **6.1.8** إنشاء Verification Service

### 6.2 نقاط النهاية

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| POST | `/certificates/generate/:registrationId` | توليد شهادة واحدة | Admin |
| **POST** | **`/certificates/generate-bulk/:eventId`** | **توليد شهادات جماعية** | **Admin** |
| **GET** | **`/certificates/verify/:serial`** | **التحقق من الشهادة** | **Public** |
| GET | `/certificates/download/:id` | تحميل PDF | Owner/Admin |
| GET | `/certificates/my-certificates` | شهاداتي | Member |
| GET | `/certificates/event/:eventId` | شهادات مؤتمر | Admin |
| PATCH | `/certificates/:id/revoke` | إلغاء شهادة | Admin |

### 6.3 صفحة التحقق العامة

عند مسح QR Code، يتم توجيه المستخدم إلى:
```
https://ysvs.org/verify/YSVS-2026-12345
```

الرد:
```json
{
  "valid": true,
  "certificate": {
    "serialNumber": "YSVS-2026-12345",
    "recipientName": "د. أحمد محمد",
    "eventTitle": "المؤتمر السنوي الخامس",
    "cmeHours": 12,
    "issueDate": "2026-01-15"
  }
}
```

### 6.4 معايير القبول

- ✅ PDF يُولد بجودة عالية
- ✅ QR Code يعمل ويوجه للتحقق
- ✅ الأرقام التسلسلية فريدة
- ✅ التوليد الجماعي يعمل بكفاءة
- ✅ صفحة التحقق تعرض البيانات

---

## 7. المرحلة السادسة: نظام البث المباشر

### 📅 المدة المتوقعة: 3-4 أيام

### 7.1 المهام

- [ ] **7.1.1** تثبيت Socket.io
  ```bash
  npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
  ```

- [ ] **7.1.2** إنشاء StreamConfig Schema
  ```typescript
  {
    isLive: boolean;
    provider: 'youtube' | 'vimeo' | 'zoom' | 'custom';
    embedUrl: string;
    title: string;
    description: string;
    event: ObjectId;          // المؤتمر المرتبط
    startedAt: Date;
    endedAt: Date;
    viewerCount: number;
    notificationSent: boolean;
  }
  ```

- [ ] **7.1.3** إنشاء Streaming Gateway (WebSocket)
  ```typescript
  @WebSocketGateway()
  export class StreamingGateway {
    // إرسال تحديثات فورية للمتصلين
    @SubscribeMessage('stream:status')
    handleStreamStatus() { ... }
  }
  ```

- [ ] **7.1.4** إنشاء Streaming Service
- [ ] **7.1.5** نظام التنبيهات (Notification Bar)

### 7.2 نقاط النهاية

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| **GET** | **`/streaming/status`** | **حالة البث الحالي** | **Public** |
| POST | `/streaming/start` | بدء البث | Admin |
| POST | `/streaming/stop` | إيقاف البث | Admin |
| PATCH | `/streaming/config` | تعديل إعدادات البث | Admin |
| GET | `/streaming/history` | سجل البث السابق | Admin |

### 7.3 WebSocket Events

| Event | الاتجاه | الوصف |
|-------|---------|-------|
| `stream:started` | Server → Client | بدأ البث |
| `stream:ended` | Server → Client | انتهى البث |
| `stream:status` | Server → Client | تحديث الحالة |
| `viewer:join` | Client → Server | انضمام مشاهد |
| `viewer:leave` | Client → Server | مغادرة مشاهد |

### 7.4 استراتيجية الكاش

```typescript
// حالة البث مخزنة لـ 30 ثانية فقط
@CacheTTL(30)
@Get('status')
getStreamStatus() { ... }
```

### 7.5 معايير القبول

- ✅ تفعيل/إيقاف البث من لوحة التحكم
- ✅ WebSocket يُرسل التحديثات فوراً
- ✅ دعم مصادر بث متعددة
- ✅ الكاش يعمل بشكل صحيح
- ✅ حماية من DDoS على endpoint الحالة

---

## 8. المرحلة السابعة: الاختبار والنشر

### 📅 المدة المتوقعة: 4-5 أيام

### 8.1 المهام

#### الاختبارات

- [ ] **8.1.1** كتابة Unit Tests للـ Services
- [ ] **8.1.2** كتابة E2E Tests للـ API
- [ ] **8.1.3** اختبار الأداء (Load Testing)
  ```bash
  npm install -D artillery
  # اختبار 1000 طلب متزامن
  ```

#### Docker

- [ ] **8.1.4** إنشاء Dockerfile
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY . .
  RUN npm run build
  CMD ["node", "dist/main.js"]
  ```

- [ ] **8.1.5** إنشاء docker-compose.yml
  ```yaml
  version: '3.8'
  services:
    api:
      build: .
      ports:
        - "3000:3000"
      depends_on:
        - mongodb
        - redis
    mongodb:
      image: mongo:7
      volumes:
        - mongo_data:/data/db
    redis:
      image: redis:alpine
  ```

#### النشر

- [ ] **8.1.6** إعداد VPS Server
- [ ] **8.1.7** إعداد Nginx كـ Reverse Proxy
  ```nginx
  server {
    listen 80;
    server_name api.ysvs.org;
    
    location / {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
    }
  }
  ```

- [ ] **8.1.8** إعداد SSL (Let's Encrypt)
- [ ] **8.1.9** إعداد CI/CD Pipeline
- [ ] **8.1.10** إعداد MongoDB Backup الدوري

### 8.2 معايير القبول

- ✅ جميع الاختبارات ناجحة
- ✅ السيرفر يتحمل 500+ طلب/ثانية
- ✅ Docker يعمل بشكل صحيح
- ✅ SSL مفعل
- ✅ النسخ الاحتياطي يعمل تلقائياً

---

## 9. مخططات قاعدة البيانات

### 9.1 Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│Registration │>────│    Event    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   │
┌─────────────┐     ┌─────────────┐            │
│ Certificate │     │  TicketType │────────────┘
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│   Article   │────>│  Category   │
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐
│ BoardMember │     │StreamConfig │
└─────────────┘     └─────────────┘
```

### 9.2 الفهارس (Indexes)

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

// Events
db.events.createIndex({ slug: 1 }, { unique: true });
db.events.createIndex({ status: 1, startDate: 1 });

// Registrations
db.registrations.createIndex({ event: 1, user: 1 }, { unique: true });
db.registrations.createIndex({ registrationNumber: 1 }, { unique: true });

// Certificates
db.certificates.createIndex({ serialNumber: 1 }, { unique: true });
db.certificates.createIndex({ user: 1 });

// Articles
db.articles.createIndex({ slug: 1 }, { unique: true });
db.articles.createIndex({ status: 1, publishedAt: -1 });
```

---

## 10. نقاط النهاية API

### 10.1 ملخص جميع الـ Endpoints

| الوحدة | عدد النقاط | الأولوية |
|--------|-----------|----------|
| Auth | 8 | 🔴 عالية |
| Users | 6 | 🔴 عالية |
| Events | 12 | 🔴 عالية |
| Certificates | 7 | 🟡 متوسطة |
| Content | 8 | 🟡 متوسطة |
| Board | 5 | 🟢 منخفضة |
| Streaming | 5 | 🟡 متوسطة |
| Media | 4 | 🟢 منخفضة |
| **المجموع** | **55** | - |

### 10.2 Base URL

```
Production: https://api.ysvs.org/api/v1
Development: http://localhost:3000/api/v1
```

### 10.3 Response Format

#### Success Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "تم جلب البيانات بنجاح",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "timestamp": "2026-01-12T10:00:00.000Z",
  "path": "/api/v1/events"
}
```

#### Error Response
```json
{
  "statusCode": 400,
  "success": false,
  "message": "البريد الإلكتروني مسجل مسبقاً",
  "error": "Bad Request",
  "timestamp": "2026-01-12T10:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## 📊 ملخص الجدول الزمني

| المرحلة | المدة | التاريخ المتوقع |
|---------|-------|-----------------|
| 1. التأسيس | 3-4 أيام | الأسبوع 1 |
| 2. المصادقة | 4-5 أيام | الأسبوع 1-2 |
| 3. المحتوى | 4-5 أيام | الأسبوع 2 |
| 4. المؤتمرات | 6-7 أيام | الأسبوع 3 |
| 5. الشهادات | 5-6 أيام | الأسبوع 4 |
| 6. البث | 3-4 أيام | الأسبوع 4-5 |
| 7. النشر | 4-5 أيام | الأسبوع 5 |
| **المجموع** | **~30 يوم** | **5 أسابيع** |

---

## 📝 ملاحظات للمطورين

1. **التوثيق:** استخدام `@nestjs/swagger` لتوثيق كل Endpoint
2. **التحقق:** استخدام `class-validator` بصرامة - لا `any`
3. **Git:** اعتماد Git Flow (main, develop, feature/x)
4. **Code Review:** مراجعة الكود قبل الدمج
5. **Testing:** تغطية اختبارات لا تقل عن 80%

---

**تم إعداد هذه الخطة لضمان بناء نظام قابل للتوسع (Scalable) ومحمي (Secure) يليق بمكانة الجمعية.**

*آخر تحديث: يناير 2026*
