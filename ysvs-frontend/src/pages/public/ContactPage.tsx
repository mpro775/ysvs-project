import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubmitContactMessage } from '@/api/hooks/useContact';

const contactSchema = z.object({
  name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  subject: z.string().min(5, 'الموضوع يجب أن يكون 5 أحرف على الأقل'),
  message: z.string().min(20, 'الرسالة يجب أن تكون 20 حرف على الأقل'),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const submitContactMessage = useSubmitContactMessage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactForm) => {
    submitContactMessage.mutate(
      {
        ...data,
        source: 'contact-page',
        locale: 'ar',
      },
      {
        onSuccess: () => {
          reset();
        },
      },
    );
  };

  return (
    <div className="bg-muted/20">
      <section className="bg-gradient-to-l from-primary-900 via-primary-800 to-primary-700 py-14 text-white dark:from-primary-950 dark:via-neutral-900 dark:to-neutral-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold">تواصل معنا</h1>
          <p className="mt-2 text-primary-100">
            نسعد بتواصلكم معنا والرد على استفساراتكم
          </p>
        </div>
      </section>

      <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card className="border-primary-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                العنوان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                صنعاء، اليمن
                <br />
                شارع الجامعة
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary-600" />
                الهاتف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground" dir="ltr">
                +967 1 234 567
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary-600" />
                البريد الإلكتروني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">info@ysvs.org</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="border-primary-100 lg:col-span-2">
          <CardHeader>
            <CardTitle>أرسل لنا رسالة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    placeholder="أدخل اسمك"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    dir="ltr"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">الموضوع *</Label>
                <Input
                  id="subject"
                  placeholder="موضوع الرسالة"
                  {...register('subject')}
                  className={errors.subject ? 'border-destructive' : ''}
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">الرسالة *</Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالتك هنا..."
                  rows={6}
                  {...register('message')}
                  className={errors.message ? 'border-destructive' : ''}
                />
                {errors.message && (
                  <p className="text-sm text-destructive">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitContactMessage.isPending}
              >
                {submitContactMessage.isPending ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="ml-2 h-4 w-4" />
                )}
                إرسال الرسالة
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
