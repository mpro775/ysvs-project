import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../../modules/users/schemas/user.schema';
import { BoardMember, BoardMemberDocument } from '../../modules/board/schemas/board-member.schema';
import {
  AboutContent,
  AboutContentDocument,
} from '../../modules/about/schemas/about-content.schema';
import { Category, CategoryDocument } from '../../modules/content/schemas/category.schema';
import { Article, ArticleDocument } from '../../modules/content/schemas/article.schema';
import {
  CertificateTemplate,
  CertificateTemplateDocument,
} from '../../modules/certificates/schemas/certificate-template.schema';
import { Certificate, CertificateDocument } from '../../modules/certificates/schemas/certificate.schema';
import { Event, EventDocument } from '../../modules/events/schemas/event.schema';
import { TicketType, TicketTypeDocument } from '../../modules/events/schemas/ticket-type.schema';
import { Registration, RegistrationDocument } from '../../modules/events/schemas/registration.schema';
import {
  SiteContent,
  SiteContentDocument,
} from '../../modules/site-content/schemas/site-content.schema';
import { UserRole } from '../../common/decorators/roles.decorator';
import { ArticleStatus } from '../../modules/content/schemas/article.schema';
import { EventStatus } from '../../modules/events/schemas/event.schema';
import { RegistrationStatus, PaymentStatus } from '../../modules/events/schemas/registration.schema';

const DEFAULT_PASSWORD = 'Password123!';

@Injectable()
export class SeedService {
  private userIds: Types.ObjectId[] = [];
  private categoryIds: Types.ObjectId[] = [];
  private eventIds: Types.ObjectId[] = [];
  private ticketTypeIds: Types.ObjectId[] = [];
  private registrationIds: Types.ObjectId[] = [];
  private templateIds: Types.ObjectId[] = [];

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BoardMember.name) private boardModel: Model<BoardMemberDocument>,
    @InjectModel(AboutContent.name)
    private aboutContentModel: Model<AboutContentDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
    @InjectModel(CertificateTemplate.name) private templateModel: Model<CertificateTemplateDocument>,
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name) private ticketTypeModel: Model<TicketTypeDocument>,
    @InjectModel(Registration.name) private registrationModel: Model<RegistrationDocument>,
    @InjectModel(SiteContent.name)
    private siteContentModel: Model<SiteContentDocument>,
  ) {}

  async run(fresh = false) {
    console.log('🌱 بدء عملية البذر...');
    if (fresh) {
      await this.clearAll();
    }
    await this.seedUsers();
    await this.seedAboutContent();
    await this.seedSiteContent();
    await this.seedCategories();
    await this.seedBoardMembers();
    await this.seedCertificateTemplates();
    await this.seedEvents();
    await this.seedTicketTypes();
    await this.seedRegistrations();
    await this.seedCertificates();
    await this.seedArticles();
    console.log('✅ اكتمل البذر بنجاح.');
  }

  private async clearAll() {
    console.log('🗑️ حذف البيانات القديمة...');
    await this.certificateModel.deleteMany({});
    await this.registrationModel.deleteMany({});
    await this.ticketTypeModel.deleteMany({});
    await this.eventModel.deleteMany({});
    await this.articleModel.deleteMany({});
    await this.templateModel.deleteMany({});
    await this.categoryModel.deleteMany({});
    await this.aboutContentModel.deleteMany({});
    await this.siteContentModel.deleteMany({});
    await this.boardModel.deleteMany({});
    await this.userModel.deleteMany({});
  }

  private async seedAboutContent() {
    const aboutContent = {
      singletonKey: 'about',
      heroTitleAr: 'عن الجمعية',
      heroTitleEn: 'About The Society',
      heroDescriptionAr:
        'الجمعية اليمنية لجراحة الأوعية الدموية هي جمعية طبية متخصصة تأسست بهدف تطوير وتعزيز مجال جراحة الأوعية الدموية في اليمن',
      heroDescriptionEn:
        'The Yemeni Society for Vascular Surgery is a specialized medical society founded to advance vascular surgery in Yemen.',
      visionTitleAr: 'رؤيتنا',
      visionTitleEn: 'Our Vision',
      visionTextAr:
        'أن نكون الجمعية الرائدة في مجال جراحة الأوعية الدموية على مستوى المنطقة، ونساهم في تقديم أفضل رعاية صحية للمرضى من خلال التعليم المستمر والبحث العلمي.',
      visionTextEn:
        'To be the leading society in vascular surgery in the region and contribute to better patient care through continuous education and scientific research.',
      missionTitleAr: 'رسالتنا',
      missionTitleEn: 'Our Mission',
      missionTextAr:
        'تطوير مهارات ومعارف الأطباء في مجال جراحة الأوعية الدموية من خلال تنظيم المؤتمرات والورش العلمية، وتبادل الخبرات مع الجمعيات الدولية.',
      missionTextEn:
        'Develop physicians skills and knowledge in vascular surgery through conferences, workshops, and knowledge exchange with international societies.',
      objectives: [
        {
          textAr: 'تنظيم المؤتمرات والندوات العلمية المتخصصة',
          textEn: 'Organize specialized scientific conferences and seminars',
          order: 0,
          isActive: true,
        },
        {
          textAr: 'توفير برامج التعليم الطبي المستمر (CME)',
          textEn: 'Provide continuing medical education (CME) programs',
          order: 1,
          isActive: true,
        },
        {
          textAr: 'تعزيز التعاون مع الجمعيات الطبية المحلية والدولية',
          textEn: 'Strengthen collaboration with local and international medical societies',
          order: 2,
          isActive: true,
        },
        {
          textAr: 'دعم البحث العلمي في مجال جراحة الأوعية',
          textEn: 'Support scientific research in vascular surgery',
          order: 3,
          isActive: true,
        },
        {
          textAr: 'رفع مستوى الوعي الصحي في المجتمع',
          textEn: 'Raise health awareness in the community',
          order: 4,
          isActive: true,
        },
        {
          textAr: 'تبادل الخبرات والمعرفة بين الأعضاء',
          textEn: 'Exchange expertise and knowledge among members',
          order: 5,
          isActive: true,
        },
      ],
    };

    await this.aboutContentModel.create(aboutContent);
    console.log('   ℹ️ تم إنشاء محتوى صفحة عن الجمعية');
  }

  private async seedSiteContent() {
    const siteContent = {
      singletonKey: 'site-content',
      footer: {
        descriptionAr:
          'الجمعية اليمنية لجراحة الأوعية الدموية - تسعى لتطوير الرعاية الصحية المتخصصة في اليمن من خلال التدريب والبحث العلمي.',
        descriptionEn:
          'The Yemeni Society for Vascular Surgery advances specialized healthcare in Yemen through training and scientific research.',
        addressAr: 'صنعاء، اليمن شارع الزبيري',
        addressEn: 'Al Zubairy Street, Sanaa, Yemen',
        phone: '+967 123 456 789',
        email: 'info@ysvs.org',
        quickLinks: [
          { labelAr: 'عن الجمعية', labelEn: 'About', href: '/about', order: 0, isActive: true },
          { labelAr: 'المؤتمرات', labelEn: 'Events', href: '/events', order: 1, isActive: true },
          { labelAr: 'الأخبار', labelEn: 'News', href: '/news', order: 2, isActive: true },
          {
            labelAr: 'التحقق من الشهادات',
            labelEn: 'Certificate Verification',
            href: '/verify',
            order: 3,
            isActive: true,
          },
          { labelAr: 'تواصل معنا', labelEn: 'Contact', href: '/contact', order: 4, isActive: true },
        ],
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com', order: 0, isActive: true },
          { platform: 'twitter', url: 'https://twitter.com', order: 1, isActive: true },
          { platform: 'instagram', url: 'https://instagram.com', order: 2, isActive: true },
          { platform: 'youtube', url: 'https://youtube.com', order: 3, isActive: true },
        ],
        copyrightAr: 'جميع الحقوق محفوظة.',
        copyrightEn: 'All rights reserved.',
      },
      legalPages: {
        privacy: {
          titleAr: 'سياسة الخصوصية',
          titleEn: 'Privacy Policy',
          contentAr:
            '<h2>سياسة الخصوصية</h2><p>نلتزم بحماية خصوصية البيانات الشخصية للمستخدمين، واستخدامها فقط للأغراض المشروعة المتعلقة بخدمات الجمعية.</p>',
          contentEn:
            '<h2>Privacy Policy</h2><p>We are committed to protecting users personal data and using it only for lawful purposes related to society services.</p>',
          version: 1,
          effectiveDate: new Date(),
          publishedAt: new Date(),
          isPublished: true,
        },
        terms: {
          titleAr: 'الشروط والأحكام',
          titleEn: 'Terms and Conditions',
          contentAr:
            '<h2>الشروط والأحكام</h2><p>باستخدامك للموقع، فإنك توافق على الالتزام بسياسات الجمعية ولوائح الاستخدام المعتمدة.</p>',
          contentEn:
            '<h2>Terms and Conditions</h2><p>By using this website, you agree to comply with society policies and approved usage regulations.</p>',
          version: 1,
          effectiveDate: new Date(),
          publishedAt: new Date(),
          isPublished: true,
        },
      },
      homepage: {
        countdownEventId: null,
        conferencesCount: 25,
        registeredMembersCount: 500,
        annualActivitiesCount: 25,
      },
    };

    await this.siteContentModel.create(siteContent);
    console.log('   ℹ️ تم إنشاء المحتوى العام (الفوتر + الصفحات القانونية)');
  }

  private async seedUsers() {
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    const users = [
      {
        email: 'superadmin@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'المشرف الأعلى',
        fullNameEn: 'Super Admin',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
        membershipDate: new Date('2020-01-01'),
      },
      {
        email: 'admin@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'أحمد المدير',
        fullNameEn: 'Ahmed Admin',
        phone: '+967777000001',
        role: UserRole.ADMIN,
        specialty: 'إدارة المنظمات الطبية',
        workplace: 'الجمعية اليمنية للجراحة الوعائية',
        isActive: true,
        isVerified: true,
        membershipDate: new Date('2021-03-15'),
      },
      {
        email: 'member1@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'د. فاطمة علي',
        fullNameEn: 'Dr. Fatima Ali',
        phone: '+967777000002',
        role: UserRole.MEMBER,
        specialty: 'جراحة الأوعية الدموية',
        workplace: 'مستشفى الثورة العام - صنعاء',
        isActive: true,
        isVerified: true,
        membershipDate: new Date('2022-01-10'),
      },
      {
        email: 'member2@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'د. محمد حسن',
        fullNameEn: 'Dr. Mohammed Hassan',
        phone: '+967777000003',
        role: UserRole.MEMBER,
        specialty: 'القلب والأوعية',
        workplace: 'مستشفى الكويت - تعز',
        isActive: true,
        isVerified: true,
        membershipDate: new Date('2022-06-20'),
      },
      {
        email: 'member3@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'د. سارة أحمد',
        fullNameEn: 'Dr. Sara Ahmed',
        phone: '+967777000004',
        role: UserRole.MEMBER,
        specialty: 'الأشعة التداخلية',
        workplace: 'مركز ابن سينا الطبي - عدن',
        isActive: true,
        isVerified: true,
        membershipDate: new Date('2023-02-01'),
      },
      {
        email: 'member4@ysvs.com',
        password: hashedPassword,
        fullNameAr: 'د. خالد عمر',
        fullNameEn: 'Dr. Khaled Omar',
        phone: '+967777000005',
        role: UserRole.MEMBER,
        specialty: 'جراحة عامة',
        workplace: 'مستشفى الجمهورية - صنعاء',
        isActive: true,
        isVerified: false,
        membershipDate: new Date('2023-08-15'),
      },
    ];
    const created = await this.userModel.insertMany(users);
    this.userIds = created.map((u) => u._id);
    console.log(`   👤 تم إنشاء ${created.length} مستخدمين`);
  }

  private async seedCategories() {
    const categories = [
      { nameAr: 'أخبار الجمعية', nameEn: 'Society News', slug: 'society-news', descriptionAr: 'أخبار ونشاطات الجمعية', descriptionEn: 'Society news and activities', order: 1 },
      { nameAr: 'التعليم الطبي', nameEn: 'Medical Education', slug: 'medical-education', descriptionAr: 'مقالات ومواد تعليمية', descriptionEn: 'Educational articles', order: 2 },
      { nameAr: 'الفعاليات', nameEn: 'Events', slug: 'events', descriptionAr: 'تغطية الفعاليات والندوات', descriptionEn: 'Events and seminars coverage', order: 3 },
      { nameAr: 'أبحاث ومقالات', nameEn: 'Research & Articles', slug: 'research', descriptionAr: 'أبحاث علمية ومقالات متخصصة', descriptionEn: 'Scientific research and articles', order: 4 },
    ];
    const created = await this.categoryModel.insertMany(categories);
    this.categoryIds = created.map((c) => c._id);
    console.log(`   📁 تم إنشاء ${created.length} تصنيفات`);
  }

  private async seedBoardMembers() {
    const members = [
      { nameAr: 'أ.د. عبدالله الشميري', nameEn: 'Prof. Abdullah Al-Shamiri', positionAr: 'رئيس الجمعية', positionEn: 'Society President', bioAr: 'استشاري جراحة الأوعية الدموية', bioEn: 'Vascular Surgery Consultant', email: 'president@ysvs.com', phone: '+967777100001', order: 0 },
      { nameAr: 'د. نادية محمد', nameEn: 'Dr. Nadia Mohammed', positionAr: 'نائب الرئيس', positionEn: 'Vice President', bioAr: 'استشارية قلب وأوعية', bioEn: 'Cardiology & Vascular Consultant', email: 'vice@ysvs.com', phone: '+967777100002', order: 1 },
      { nameAr: 'د. يوسف أحمد', nameEn: 'Dr. Yusuf Ahmed', positionAr: 'أمين السر', positionEn: 'Secretary', bioAr: 'جراح أوعية دموية', bioEn: 'Vascular Surgeon', email: 'secretary@ysvs.com', phone: '+967777100003', order: 2 },
      { nameAr: 'د. منى علي', nameEn: 'Dr. Mona Ali', positionAr: 'أمين الصندوق', positionEn: 'Treasurer', bioAr: 'استشارية أشعة تداخلية', bioEn: 'Interventional Radiology Consultant', email: 'treasurer@ysvs.com', phone: '+967777100004', order: 3 },
    ];
    await this.boardModel.insertMany(members);
    console.log(`   👥 تم إنشاء ${members.length} أعضاء مجلس الإدارة`);
  }

  private async seedCertificateTemplates() {
    const defaultLayout = {
      namePosition: { x: 100, y: 150, fontSize: 24, align: 'center' as const },
      eventPosition: { x: 100, y: 220, fontSize: 18, align: 'center' as const },
      datePosition: { x: 100, y: 280, fontSize: 14, align: 'center' as const },
      qrPosition: { x: 450, y: 350, fontSize: 10, align: 'right' as const },
      serialPosition: { x: 100, y: 350, fontSize: 10, align: 'left' as const },
      cmeHoursPosition: { x: 100, y: 320, fontSize: 12, align: 'center' as const },
    };
    const templates = [
      { name: 'القالب الافتراضي', description: 'قالب شهادة افتراضي للجمعية', backgroundImage: '/templates/default-cert.png', layout: defaultLayout, isDefault: true, orientation: 'landscape' as const },
      { name: 'قالب الندوات', description: 'لندوات وورش العمل', backgroundImage: '/templates/seminar-cert.png', layout: defaultLayout, isDefault: false, orientation: 'landscape' as const },
    ];
    const created = await this.templateModel.insertMany(templates);
    this.templateIds = created.map((t) => t._id);
    console.log(`   📜 تم إنشاء ${created.length} قوالب شهادات`);
  }

  private async seedEvents() {
    const adminId = this.userIds[1];
    const formSchema = [
      { id: 'fullName', type: 'text' as const, label: 'الاسم الكامل', labelEn: 'Full Name', required: true, order: 0 },
      { id: 'phone', type: 'phone' as const, label: 'رقم الهاتف', labelEn: 'Phone', required: true, order: 1 },
      { id: 'specialty', type: 'text' as const, label: 'التخصص', labelEn: 'Specialty', required: false, order: 2 },
    ];
    const events = [
      {
        titleAr: 'المؤتمر السنوي لجراحة الأوعية 2024',
        titleEn: 'Annual Vascular Surgery Conference 2024',
        slug: 'vascular-conference-2024',
        descriptionAr: 'مؤتمر سنوي يجمع نخبة من الجراحين والمتخصصين.',
        descriptionEn: 'Annual conference bringing together vascular surgeons and specialists.',
        startDate: new Date('2024-12-15T09:00:00'),
        endDate: new Date('2024-12-17T18:00:00'),
        location: { venue: 'فندق ماريوت صنعاء', venueEn: 'Marriott Hotel Sana\'a', address: 'شارع الزبيري', addressEn: 'Al-Zubairy Street', city: 'صنعاء', cityEn: 'Sana\'a' },
        status: EventStatus.COMPLETED,
        registrationOpen: false,
        registrationDeadline: new Date('2024-12-01'),
        maxAttendees: 200,
        currentAttendees: 85,
        formSchema,
        cmeHours: 15,
        createdBy: adminId,
      },
      {
        titleAr: 'ورشة الأشعة التداخلية',
        titleEn: 'Interventional Radiology Workshop',
        slug: 'ir-workshop-2024',
        descriptionAr: 'ورشة عملية في الأشعة التداخلية للأوعية.',
        descriptionEn: 'Hands-on workshop in interventional radiology for vascular procedures.',
        startDate: new Date('2024-11-20T08:00:00'),
        endDate: new Date('2024-11-21T17:00:00'),
        location: { venue: 'قاعة ابن سينا - مستشفى الكويت', venueEn: 'Ibn Sina Hall - Kuwait Hospital', address: 'تعز', addressEn: 'Taiz', city: 'تعز', cityEn: 'Taiz' },
        status: EventStatus.COMPLETED,
        registrationOpen: false,
        maxAttendees: 50,
        currentAttendees: 42,
        formSchema,
        cmeHours: 8,
        createdBy: adminId,
      },
      {
        titleAr: 'ندوة أمراض الشرايين الطرفية',
        titleEn: 'Peripheral Artery Disease Seminar',
        slug: 'pad-seminar-2025',
        descriptionAr: 'ندوة علمية حول تشخيص وعلاج أمراض الشرايين الطرفية.',
        descriptionEn: 'Scientific seminar on diagnosis and treatment of peripheral artery disease.',
        startDate: new Date('2025-03-10T10:00:00'),
        endDate: new Date('2025-03-10T16:00:00'),
        location: { venue: 'قاعة المؤتمرات - مستشفى الثورة', venueEn: 'Conference Hall - Al-Thawra Hospital', address: 'صنعاء', addressEn: 'Sana\'a', city: 'صنعاء', cityEn: 'Sana\'a' },
        status: EventStatus.UPCOMING,
        registrationOpen: true,
        registrationDeadline: new Date('2025-03-05'),
        maxAttendees: 100,
        currentAttendees: 23,
        formSchema,
        cmeHours: 5,
        createdBy: adminId,
      },
      {
        titleAr: 'اليوم العلمي للقلب والأوعية',
        titleEn: 'Cardiovascular Scientific Day',
        slug: 'cardio-day-2025',
        descriptionAr: 'يوم علمي مفتوح للتحديثات في مجال القلب والأوعية.',
        descriptionEn: 'Open scientific day for cardiovascular updates.',
        startDate: new Date('2025-05-15T09:00:00'),
        endDate: new Date('2025-05-15T18:00:00'),
        location: { venue: 'مركز التدريب - الجمعية', venueEn: 'Training Center - Society', address: 'صنعاء', addressEn: 'Sana\'a', city: 'صنعاء', cityEn: 'Sana\'a' },
        status: EventStatus.UPCOMING,
        registrationOpen: true,
        registrationDeadline: new Date('2025-05-10'),
        maxAttendees: 80,
        currentAttendees: 0,
        formSchema,
        cmeHours: 6,
        createdBy: adminId,
      },
    ];
    const created = await this.eventModel.insertMany(events);
    this.eventIds = created.map((e) => e._id);
    console.log(`   📅 تم إنشاء ${created.length} فعاليات`);
  }

  private async seedTicketTypes() {
    const types: Array<{ nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; price: number; maxQuantity: number; soldQuantity: number; event: Types.ObjectId }> = [];
    this.eventIds.forEach((eventId, i) => {
      types.push(
        { nameAr: 'تذكرة عامة', nameEn: 'General Ticket', descriptionAr: 'دخول كامل', descriptionEn: 'Full access', price: 0, maxQuantity: 100, soldQuantity: i === 0 ? 45 : i === 1 ? 30 : 10, event: eventId },
        { nameAr: 'تذكرة VIP', nameEn: 'VIP Ticket', descriptionAr: 'مقعد مميز ومواد علمية', descriptionEn: 'Premium seat and materials', price: 50000, maxQuantity: 20, soldQuantity: i === 0 ? 12 : 5, event: eventId },
      );
    });
    const created = await this.ticketTypeModel.insertMany(types);
    this.ticketTypeIds = created.map((t) => t._id);
    console.log(`   🎫 تم إنشاء ${created.length} أنواع تذاكر`);
  }

  private async seedRegistrations() {
    const regs: Array<{ event: Types.ObjectId; user: Types.ObjectId; ticketType?: Types.ObjectId; formData: Map<string, unknown>; status: RegistrationStatus; paymentStatus: PaymentStatus; registrationNumber: string; qrCode?: string; certificateIssued: boolean }> = [];
    const event0Tickets = this.ticketTypeIds.filter((_, i) => i < 2);
    const event1Tickets = this.ticketTypeIds.filter((_, i) => i >= 2 && i < 4);
    const members = this.userIds.slice(2, 6);
    let regNum = 1000;
    members.forEach((userId, idx) => {
      regs.push({
        event: this.eventIds[0],
        user: userId,
        ticketType: event0Tickets[idx % 2],
        formData: new Map([['fullName', idx === 0 ? 'د. فاطمة علي' : ''], ['phone', '+96777700000' + (idx + 2)], ['specialty', 'جراحة أوعية']]),
        status: idx < 3 ? RegistrationStatus.ATTENDED : RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.FREE,
        registrationNumber: 'REG-' + regNum++,
        qrCode: 'QR-' + regNum,
        certificateIssued: idx < 2,
      });
    });
    members.slice(0, 3).forEach((userId, idx) => {
      regs.push({
        event: this.eventIds[1],
        user: userId,
        ticketType: event1Tickets[idx % 2],
        formData: new Map([['fullName', 'د. فاطمة علي'], ['phone', '+967777000002'], ['specialty', 'أشعة تداخلية']]),
        status: RegistrationStatus.ATTENDED,
        paymentStatus: PaymentStatus.FREE,
        registrationNumber: 'REG-' + regNum++,
        certificateIssued: idx < 2,
      });
    });
    const created = await this.registrationModel.insertMany(regs);
    this.registrationIds = created.map((r) => r._id);
    console.log(`   📋 تم إنشاء ${created.length} تسجيلات`);
  }

  private async seedCertificates() {
    const regs = await this.registrationModel.find({ certificateIssued: true }).lean();
    const eventIdsMap = await this.eventModel.find({ _id: { $in: this.eventIds } }).select('titleAr titleEn cmeHours startDate').lean();
    const userIdsMap = await this.userModel.find({ _id: { $in: this.userIds } }).select('fullNameAr fullNameEn').lean();
    const eventMap = new Map(eventIdsMap.map((e: any) => [e._id.toString(), e]));
    const userMap = new Map(userIdsMap.map((u: any) => [u._id.toString(), u]));
    const certs = regs.map((r: any, idx: number) => {
      const ev = eventMap.get(r.event.toString());
      const us = userMap.get(r.user.toString());
      return {
        registration: r._id,
        event: r.event,
        user: r.user,
        serialNumber: 'YSVS-2024-' + String(1000 + idx).padStart(4, '0'),
        qrCode: 'https://ysvs.ye/verify/' + r.registrationNumber,
        recipientNameAr: us?.fullNameAr || 'المشارك',
        recipientNameEn: us?.fullNameEn || 'Participant',
        eventTitleAr: ev?.titleAr || 'الفعالية',
        eventTitleEn: ev?.titleEn || 'Event',
        cmeHours: ev?.cmeHours || 0,
        issueDate: new Date(),
        eventDate: ev?.startDate,
        templateUsed: this.templateIds[0]?.toString(),
        isValid: true,
      };
    });
    if (certs.length) {
      await this.certificateModel.insertMany(certs);
      console.log(`   🏆 تم إنشاء ${certs.length} شهادات`);
    } else {
      console.log('   🏆 لا توجد تسجيلات مؤهلة للشهادات');
    }
  }

  private async seedArticles() {
    const adminId = this.userIds[1];
    const articles = [
      { titleAr: 'انطلاق المؤتمر السنوي 2024', titleEn: 'Annual Conference 2024 Kicks Off', slug: 'annual-conference-2024-kicks-off', excerptAr: 'انطلق المؤتمر السنوي لجراحة الأوعية الدموية بحضور واسع.', excerptEn: 'The annual vascular surgery conference kicked off with wide attendance.', contentAr: '<p>محتوى الخبر بالعربية...</p>', contentEn: '<p>News content in English...</p>', category: this.categoryIds[0], author: adminId, tags: ['مؤتمر', '2024'], status: ArticleStatus.PUBLISHED, publishedAt: new Date('2024-12-10'), viewCount: 120, isFeatured: true },
      { titleAr: 'ورشة الأشعة التداخلية تختتم أعمالها', titleEn: 'Interventional Radiology Workshop Concludes', slug: 'ir-workshop-concludes', excerptAr: 'اختتمت ورشة الأشعة التداخلية بتوزيع الشهادات.', excerptEn: 'The interventional radiology workshop concluded with certificate distribution.', contentAr: '<p>محتوى الخبر...</p>', contentEn: '<p>Content...</p>', category: this.categoryIds[2], author: adminId, tags: ['ورشة', 'أشعة'], status: ArticleStatus.PUBLISHED, publishedAt: new Date('2024-11-22'), viewCount: 85, isFeatured: false },
      { titleAr: 'أهمية التعليم الطبي المستمر', titleEn: 'Importance of CME', slug: 'importance-of-cme', excerptAr: 'مقال عن دور التعليم الطبي المستمر في تطوير الممارسة.', excerptEn: 'Article on the role of CME in practice development.', contentAr: '<p>محتوى المقال الطويل...</p>', contentEn: '<p>Long article content...</p>', category: this.categoryIds[1], author: adminId, tags: ['تعليم', 'CME'], status: ArticleStatus.PUBLISHED, publishedAt: new Date('2024-10-01'), viewCount: 200, isFeatured: true },
      { titleAr: 'ندوة أمراض الشرايين - التسجيل مفتوح', titleEn: 'PAD Seminar - Registration Open', slug: 'pad-seminar-registration-open', excerptAr: 'فتح باب التسجيل لندوة أمراض الشرايين الطرفية.', excerptEn: 'Registration is now open for the PAD seminar.', contentAr: '<p>محتوى...</p>', contentEn: '<p>Content...</p>', category: this.categoryIds[0], author: adminId, tags: ['ندوة', 'تسجيل'], status: ArticleStatus.PUBLISHED, publishedAt: new Date('2025-01-15'), viewCount: 45, isFeatured: false },
      { titleAr: 'مسودة: دليل الممارسة السريرية', titleEn: 'Draft: Clinical Practice Guideline', slug: 'draft-clinical-practice-guideline', excerptAr: 'مسودة قيد المراجعة.', excerptEn: 'Draft under review.', contentAr: '<p>مسودة...</p>', contentEn: '<p>Draft...</p>', category: this.categoryIds[3], author: adminId, tags: ['دليل'], status: ArticleStatus.DRAFT, viewCount: 0, isFeatured: false },
    ];
    await this.articleModel.insertMany(articles);
    console.log(`   📰 تم إنشاء ${articles.length} مقالات`);
  }
}
