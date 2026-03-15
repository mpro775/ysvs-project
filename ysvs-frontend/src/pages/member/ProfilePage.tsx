import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InlineLoader } from '@/components/shared/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';
import { useChangePassword, useUpdateProfile } from '@/api/hooks/useAuth';
import {
  useMyProfessionalVerification,
  useUploadProfessionalVerification,
} from '@/api/hooks/useUsers';
import { ProfessionalVerificationStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OTHER_OPTION_VALUE = '__other__';

const jobTitleOptions = [
  { value: 'consultant', label: 'استشاري' },
  { value: 'specialist', label: 'أخصائي' },
  { value: 'resident', label: 'مقيم' },
  { value: 'general_practitioner', label: 'طبيب عام' },
  { value: 'student', label: 'طالب' },
  { value: 'nursing', label: 'تمريض' },
];

const specialtyOptions = [
  { value: 'vascular_surgery', label: 'جراحة الأوعية الدموية' },
  { value: 'cardiac_surgery', label: 'جراحة القلب' },
  { value: 'cardiology', label: 'أمراض القلب' },
  { value: 'anesthesia', label: 'التخدير' },
  { value: 'critical_care', label: 'العناية المركزة' },
];

const countryOptions = [
  { value: 'yemen', label: 'اليمن' },
  { value: 'saudi_arabia', label: 'السعودية' },
  { value: 'oman', label: 'عُمان' },
  { value: 'uae', label: 'الإمارات' },
  { value: 'qatar', label: 'قطر' },
  { value: 'kuwait', label: 'الكويت' },
  { value: 'bahrain', label: 'البحرين' },
  { value: 'egypt', label: 'مصر' },
  { value: 'jordan', label: 'الأردن' },
];

const profileSchema = z
  .object({
    fullNameAr: z.string().min(3, 'الاسم بالعربي مطلوب'),
    fullNameEn: z.string().min(3, 'الاسم بالإنجليزي مطلوب'),
    phone: z.string().min(1, 'رقم الهاتف مطلوب'),
    gender: z.enum(['male', 'female']),
    country: z.string().min(1, 'الدولة مطلوبة'),
    countryOther: z.string().optional(),
    jobTitle: z.string().min(1, 'الصفة الوظيفية مطلوبة'),
    jobTitleOther: z.string().optional(),
    specialty: z.string().min(1, 'التخصص مطلوب'),
    specialtyOther: z.string().optional(),
    workplace: z.string().min(2, 'جهة العمل / المستشفى / الجامعة مطلوبة'),
  })
  .superRefine((data, ctx) => {
    if (data.country === OTHER_OPTION_VALUE && !data.countryOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['countryOther'],
        message: 'يرجى كتابة الدولة',
      });
    }

    if (data.jobTitle === OTHER_OPTION_VALUE && !data.jobTitleOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jobTitleOther'],
        message: 'يرجى كتابة الصفة الوظيفية',
      });
    }

    if (data.specialty === OTHER_OPTION_VALUE && !data.specialtyOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialtyOther'],
        message: 'يرجى كتابة التخصص',
      });
    }
  });

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  newPassword: z.string().min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

type PasswordForm = z.infer<typeof passwordSchema>;
type ProfileForm = z.infer<typeof profileSchema>;

export default function MemberProfilePage() {
  const { user } = useAuthStore();
  const { mutate: changePassword, isPending } = useChangePassword();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { data: verification } = useMyProfessionalVerification();
  const { mutate: uploadProfessionalVerification, isPending: isUploadingVerification } =
    useUploadProfessionalVerification();

  const mapSelectValue = (
    rawValue: string | undefined,
    options: Array<{ value: string }>,
  ): { value: string; other: string } => {
    if (!rawValue?.trim()) {
      return { value: '', other: '' };
    }

    const normalized = rawValue.trim();
    if (options.some((option) => option.value === normalized)) {
      return { value: normalized, other: '' };
    }

    return { value: OTHER_OPTION_VALUE, other: normalized };
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    watch,
    setValue,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    const country = mapSelectValue(user.country, countryOptions);
    const jobTitle = mapSelectValue(user.jobTitle, jobTitleOptions);
    const specialty = mapSelectValue(user.specialty, specialtyOptions);

    resetProfile({
      fullNameAr: user.fullNameAr || '',
      fullNameEn: user.fullNameEn || '',
      phone: user.phone || '',
      gender: user.gender || 'male',
      country: country.value,
      countryOther: country.other,
      jobTitle: jobTitle.value,
      jobTitleOther: jobTitle.other,
      specialty: specialty.value,
      specialtyOther: specialty.other,
      workplace: user.workplace || '',
    });
  }, [user, resetProfile]);

  const onSubmit = (data: PasswordForm) => {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => reset() }
    );
  };

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfile({
      fullNameAr: data.fullNameAr,
      fullNameEn: data.fullNameEn,
      phone: data.phone,
      gender: data.gender,
      country: data.country === OTHER_OPTION_VALUE ? data.countryOther?.trim() : data.country,
      jobTitle: data.jobTitle === OTHER_OPTION_VALUE ? data.jobTitleOther?.trim() : data.jobTitle,
      specialty:
        data.specialty === OTHER_OPTION_VALUE ? data.specialtyOther?.trim() : data.specialty,
      workplace: data.workplace,
    });
  };

  const verificationStatus =
    verification?.status ||
    user?.professionalVerification?.status ||
    ProfessionalVerificationStatus.NOT_SUBMITTED;

  const verificationStatusText: Record<ProfessionalVerificationStatus, string> = {
    [ProfessionalVerificationStatus.NOT_SUBMITTED]: 'لم يتم الرفع',
    [ProfessionalVerificationStatus.PENDING]: 'جاري المعالجة',
    [ProfessionalVerificationStatus.APPROVED]: 'موثق',
    [ProfessionalVerificationStatus.REJECTED]: 'مرفوض',
  };

  const verificationStatusVariant: Record<
    ProfessionalVerificationStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    [ProfessionalVerificationStatus.NOT_SUBMITTED]: 'outline',
    [ProfessionalVerificationStatus.PENDING]: 'secondary',
    [ProfessionalVerificationStatus.APPROVED]: 'default',
    [ProfessionalVerificationStatus.REJECTED]: 'destructive',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
          <TabsTrigger value="verification">توثيق العضوية</TabsTrigger>
          <TabsTrigger value="security">الأمان</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الحساب</CardTitle>
              <CardDescription>معلوماتك الشخصية المسجلة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary-100 text-2xl text-primary-700">
                    {user?.fullNameAr?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{user?.fullNameAr}</h3>
                  <p className="text-muted-foreground">{user?.fullNameEn}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input value={user?.email || ''} disabled dir="ltr" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullNameAr">الاسم (عربي)</Label>
                    <Input id="fullNameAr" {...registerProfile('fullNameAr')} className={profileErrors.fullNameAr ? 'border-destructive' : ''} />
                    {profileErrors.fullNameAr && <p className="text-sm text-destructive">{profileErrors.fullNameAr.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullNameEn">الاسم (إنجليزي)</Label>
                    <Input id="fullNameEn" dir="ltr" {...registerProfile('fullNameEn')} className={profileErrors.fullNameEn ? 'border-destructive' : ''} />
                    {profileErrors.fullNameEn && <p className="text-sm text-destructive">{profileErrors.fullNameEn.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" dir="ltr" {...registerProfile('phone')} className={profileErrors.phone ? 'border-destructive' : ''} />
                    {profileErrors.phone && <p className="text-sm text-destructive">{profileErrors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">الجنس</Label>
                    <Select
                      value={watch('gender') || ''}
                      onValueChange={(value: 'male' | 'female') => setValue('gender', value, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger id="gender" className={profileErrors.gender ? 'border-destructive' : ''}>
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    {profileErrors.gender && <p className="text-sm text-destructive">{profileErrors.gender.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">الدولة</Label>
                    <Select
                      value={watch('country') || ''}
                      onValueChange={(value) => setValue('country', value, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger id="country" className={profileErrors.country ? 'border-destructive' : ''}>
                        <SelectValue placeholder="اختر الدولة" />
                      </SelectTrigger>
                      <SelectContent>
                        {countryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch('country') === OTHER_OPTION_VALUE && (
                      <Input {...registerProfile('countryOther')} className={profileErrors.countryOther ? 'border-destructive' : ''} placeholder="اكتب الدولة" />
                    )}
                    {(profileErrors.country || profileErrors.countryOther) && (
                      <p className="text-sm text-destructive">{profileErrors.country?.message || profileErrors.countryOther?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">الصفة الوظيفية</Label>
                    <Select
                      value={watch('jobTitle') || ''}
                      onValueChange={(value) => setValue('jobTitle', value, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger id="jobTitle" className={profileErrors.jobTitle ? 'border-destructive' : ''}>
                        <SelectValue placeholder="اختر الصفة الوظيفية" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTitleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch('jobTitle') === OTHER_OPTION_VALUE && (
                      <Input {...registerProfile('jobTitleOther')} className={profileErrors.jobTitleOther ? 'border-destructive' : ''} placeholder="اكتب الصفة الوظيفية" />
                    )}
                    {(profileErrors.jobTitle || profileErrors.jobTitleOther) && (
                      <p className="text-sm text-destructive">{profileErrors.jobTitle?.message || profileErrors.jobTitleOther?.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="specialty">التخصص</Label>
                    <Select
                      value={watch('specialty') || ''}
                      onValueChange={(value) => setValue('specialty', value, { shouldValidate: true, shouldDirty: true })}
                    >
                      <SelectTrigger id="specialty" className={profileErrors.specialty ? 'border-destructive' : ''}>
                        <SelectValue placeholder="اختر التخصص" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialtyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch('specialty') === OTHER_OPTION_VALUE && (
                      <Input {...registerProfile('specialtyOther')} className={profileErrors.specialtyOther ? 'border-destructive' : ''} placeholder="اكتب التخصص" />
                    )}
                    {(profileErrors.specialty || profileErrors.specialtyOther) && (
                      <p className="text-sm text-destructive">{profileErrors.specialty?.message || profileErrors.specialtyOther?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workplace">جهة العمل / المستشفى / الجامعة</Label>
                    <Input id="workplace" {...registerProfile('workplace')} className={profileErrors.workplace ? 'border-destructive' : ''} />
                    {profileErrors.workplace && <p className="text-sm text-destructive">{profileErrors.workplace.message}</p>}
                  </div>
                </div>

                <Button type="submit" disabled={isUpdatingProfile}>
                  {isUpdatingProfile && <InlineLoader className="ml-2" />}
                  {isUpdatingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>توثيق بطاقة مزاولة المهنة</CardTitle>
              <CardDescription>
                يمكنك رفع بطاقة مزاولة المهنة ليتم اعتماد توثيق عضويتك من الإدارة.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">الحالة:</span>
                <Badge variant={verificationStatusVariant[verificationStatus]}>
                  {verificationStatusText[verificationStatus]}
                </Badge>
              </div>

              {verification?.document?.url && (
                <div className="text-sm">
                  <a
                    href={verification.document.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    عرض الملف المرفوع ({verification.document.originalName})
                  </a>
                </div>
              )}

              {verification?.lastSubmittedAt && (
                <p className="text-xs text-muted-foreground">
                  آخر رفع: {format(new Date(verification.lastSubmittedAt), 'd MMMM yyyy', { locale: ar })}
                </p>
              )}

              {verificationStatus === ProfessionalVerificationStatus.REJECTED &&
                verification?.rejectionReason && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    سبب الرفض: {verification.rejectionReason}
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="professional-verification-upload">رفع/إعادة رفع البطاقة</Label>
                <Input
                  id="professional-verification-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    uploadProfessionalVerification(file);
                    event.currentTarget.value = '';
                  }}
                  disabled={isUploadingVerification}
                />
                <p className="text-xs text-muted-foreground">
                  بعد الرفع ستتحول الحالة إلى "جاري المعالجة" حتى تتم مراجعتها من الإدارة.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>تغيير كلمة المرور</CardTitle>
              <CardDescription>قم بتحديث كلمة المرور الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...register('currentPassword')}
                    className={errors.currentPassword ? 'border-destructive' : ''}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    className={errors.newPassword ? 'border-destructive' : ''}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isPending}>
                  {isPending && <InlineLoader className="ml-2" />}
                  {isPending ? 'جاري تغيير كلمة المرور...' : 'تغيير كلمة المرور'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
