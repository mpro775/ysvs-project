import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineLoader } from '@/components/shared/LoadingSpinner';
import { useRegister } from '@/api/hooks/useAuth';
import api from '@/api/axios';
import { ENDPOINTS } from '@/api/endpoints';

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
  { value: 'other', label: 'أخرى' },
];

const registerSchema = z
  .object({
    fullNameAr: z.string().min(3, 'الاسم بالعربي يجب أن يكون 3 أحرف على الأقل'),
    fullNameEn: z.string().min(3, 'الاسم بالإنجليزي يجب أن يكون 3 أحرف على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    phone: z.string().min(1, 'رقم الهاتف مطلوب'),
    country: z.string().min(1, 'الدولة مطلوبة'),
    countryOther: z.string().optional(),
    jobTitle: z.string().min(1, 'الصفة الوظيفية مطلوبة'),
    jobTitleOther: z.string().optional(),
    specialty: z.string().min(1, 'التخصص مطلوب'),
    specialtyOther: z.string().optional(),
    workplace: z.string().min(2, 'جهة العمل / المستشفى / الجامعة مطلوبة'),
    gender: z.enum(['male', 'female']),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'يجب الموافقة على الشروط والأحكام',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (data.country === OTHER_OPTION_VALUE && !data.countryOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['countryOther'],
        message: 'يرجى كتابة الدولة عند اختيار أخرى',
      });
    }

    if (data.jobTitle === OTHER_OPTION_VALUE && !data.jobTitleOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jobTitleOther'],
        message: 'يرجى كتابة الصفة الوظيفية عند اختيار أخرى',
      });
    }

    if (data.specialty === OTHER_OPTION_VALUE && !data.specialtyOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialtyOther'],
        message: 'يرجى كتابة التخصص عند اختيار أخرى',
      });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [professionalCardFile, setProfessionalCardFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
      country: 'yemen',
    },
  });

  const termsValue = watch('terms');
  const countryValue = watch('country');
  const jobTitleValue = watch('jobTitle');
  const specialtyValue = watch('specialty');

  const onSubmit = (data: RegisterForm) => {
    const normalizedCountry =
      data.country === OTHER_OPTION_VALUE
        ? data.countryOther?.trim() || ''
        : data.country;
    const normalizedJobTitle =
      data.jobTitle === OTHER_OPTION_VALUE
        ? data.jobTitleOther?.trim() || ''
        : data.jobTitle;
    const normalizedSpecialty =
      data.specialty === OTHER_OPTION_VALUE
        ? data.specialtyOther?.trim() || ''
        : data.specialty;

    const {
      confirmPassword: _,
      terms: __,
      countryOther: ___,
      jobTitleOther: ____,
      specialtyOther: _____,
      ...registerData
    } = data;

    registerUser(
      {
        ...registerData,
        country: normalizedCountry,
        jobTitle: normalizedJobTitle,
        specialty: normalizedSpecialty,
      },
      {
      onSuccess: async (registerResponse) => {
        if (professionalCardFile && registerResponse?.accessToken) {
          const formData = new FormData();
          formData.append('file', professionalCardFile);

          try {
            await api.post(
              ENDPOINTS.USERS.UPLOAD_PROFESSIONAL_VERIFICATION,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Authorization: `Bearer ${registerResponse.accessToken}`,
                },
              },
            );
          } catch {
            toast.warning('تم إنشاء الحساب ولكن تعذر رفع بطاقة المزاولة، يمكنك رفعها لاحقا من الملف الشخصي.');
          }
        }

        navigate('/login');
      },
    }
    );
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            انضم إلى الجمعية اليمنية لجراحة الأوعية الدموية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullNameAr">الاسم الكامل (عربي) *</Label>
                <Input
                  id="fullNameAr"
                  placeholder="د. أحمد محمد"
                  {...register('fullNameAr')}
                  className={errors.fullNameAr ? 'border-destructive' : ''}
                />
                {errors.fullNameAr && (
                  <p className="text-sm text-destructive">{errors.fullNameAr.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullNameEn">الاسم الكامل (إنجليزي) *</Label>
                <Input
                  id="fullNameEn"
                  placeholder="Dr. Ahmed Mohammed"
                  dir="ltr"
                  {...register('fullNameEn')}
                  className={errors.fullNameEn ? 'border-destructive' : ''}
                />
                {errors.fullNameEn && (
                  <p className="text-sm text-destructive">{errors.fullNameEn.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                dir="ltr"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+967 xxx xxx xxx"
                  dir="ltr"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">الجنس *</Label>
                <Select
                  value={watch('gender') || ''}
                  onValueChange={(value: 'male' | 'female') =>
                    setValue('gender', value, { shouldDirty: true, shouldValidate: true })
                  }
                >
                  <SelectTrigger id="gender" className={errors.gender ? 'border-destructive' : ''}>
                    <SelectValue placeholder="اختر الجنس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">الدولة *</Label>
                <Select
                  value={countryValue || ''}
                  onValueChange={(value) => setValue('country', value, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger id="country" className={errors.country ? 'border-destructive' : ''}>
                    <SelectValue placeholder="اختر الدولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                  </SelectContent>
                </Select>
                {countryValue === OTHER_OPTION_VALUE && (
                  <Input
                    className={errors.countryOther ? 'border-destructive' : ''}
                    placeholder="اكتب الدولة"
                    {...register('countryOther')}
                  />
                )}
                {(errors.country || errors.countryOther) && (
                  <p className="text-sm text-destructive">
                    {errors.country?.message || errors.countryOther?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">الصفة الوظيفية *</Label>
                <Select
                  value={jobTitleValue || ''}
                  onValueChange={(value) => setValue('jobTitle', value, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger id="jobTitle" className={errors.jobTitle ? 'border-destructive' : ''}>
                    <SelectValue placeholder="اختر الصفة الوظيفية" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                  </SelectContent>
                </Select>
                {jobTitleValue === OTHER_OPTION_VALUE && (
                  <Input
                    className={errors.jobTitleOther ? 'border-destructive' : ''}
                    placeholder="اكتب الصفة الوظيفية"
                    {...register('jobTitleOther')}
                  />
                )}
                {(errors.jobTitle || errors.jobTitleOther) && (
                  <p className="text-sm text-destructive">
                    {errors.jobTitle?.message || errors.jobTitleOther?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">التخصص *</Label>
                <Select
                  value={specialtyValue || ''}
                  onValueChange={(value) => setValue('specialty', value, { shouldDirty: true, shouldValidate: true })}
                >
                  <SelectTrigger id="specialty" className={errors.specialty ? 'border-destructive' : ''}>
                    <SelectValue placeholder="اختر التخصص" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={OTHER_OPTION_VALUE}>أخرى</SelectItem>
                  </SelectContent>
                </Select>
                {specialtyValue === OTHER_OPTION_VALUE && (
                  <Input
                    className={errors.specialtyOther ? 'border-destructive' : ''}
                    placeholder="اكتب التخصص"
                    {...register('specialtyOther')}
                  />
                )}
                {(errors.specialty || errors.specialtyOther) && (
                  <p className="text-sm text-destructive">
                    {errors.specialty?.message || errors.specialtyOther?.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="workplace">جهة العمل / المستشفى / الجامعة *</Label>
                <Input
                  id="workplace"
                  placeholder="مثال: مستشفى الثورة العام"
                  {...register('workplace')}
                  className={errors.workplace ? 'border-destructive' : ''}
                />
                {errors.workplace && <p className="text-sm text-destructive">{errors.workplace.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="professionalCard">
                بطاقة مزاولة المهنة (اختياري - يفيد في توثيق العضوية)
              </Label>
              <Input
                id="professionalCard"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setProfessionalCardFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                عند رفع البطاقة سيتم إرسالها للإدارة وتظهر حالتها كـ "جاري المعالجة" حتى الاعتماد.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsValue}
                onCheckedChange={(checked) => setValue('terms', checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                أوافق على{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">
                  الشروط والأحكام
                </Link>{' '}
                و{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline">
                  سياسة الخصوصية
                </Link>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-destructive">{errors.terms.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <InlineLoader className="ml-2" />}
              {isPending ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              تسجيل الدخول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
