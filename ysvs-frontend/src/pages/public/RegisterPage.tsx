import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegister } from '@/api/hooks/useAuth';

const registerSchema = z
  .object({
    fullNameAr: z.string().min(3, 'الاسم بالعربي يجب أن يكون 3 أحرف على الأقل'),
    fullNameEn: z.string().min(3, 'الاسم بالإنجليزي يجب أن يكون 3 أحرف على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    phone: z.string().optional(),
    specialty: z.string().optional(),
    workplace: z.string().optional(),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: 'يجب الموافقة على الشروط والأحكام',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
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
    },
  });

  const termsValue = watch('terms');

  const onSubmit = (data: RegisterForm) => {
    const { confirmPassword: _, terms: __, ...registerData } = data;
    registerUser(registerData, {
      onSuccess: () => {
        navigate('/login');
      },
    });
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
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+967 xxx xxx xxx"
                  dir="ltr"
                  {...register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">التخصص</Label>
                <Input
                  id="specialty"
                  placeholder="جراحة الأوعية الدموية"
                  {...register('specialty')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workplace">مكان العمل</Label>
              <Input
                id="workplace"
                placeholder="مستشفى الثورة العام"
                {...register('workplace')}
              />
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
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء الحساب
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
