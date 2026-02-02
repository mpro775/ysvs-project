import { Target, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBoardMembers } from '@/api/hooks/useContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AboutPage() {
  const { data: boardMembers, isLoading } = useBoardMembers();

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-900 to-primary-800 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold">عن الجمعية</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-200">
            الجمعية اليمنية لجراحة الأوعية الدموية هي جمعية طبية متخصصة تأسست بهدف
            تطوير وتعزيز مجال جراحة الأوعية الدموية في اليمن
          </p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-primary-200 bg-primary-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary-900">
                  <Eye className="h-6 w-6" />
                  رؤيتنا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-800">
                  أن نكون الجمعية الرائدة في مجال جراحة الأوعية الدموية على مستوى
                  المنطقة، ونساهم في تقديم أفضل رعاية صحية للمرضى من خلال التعليم
                  المستمر والبحث العلمي.
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent-200 bg-accent-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-accent-900">
                  <Target className="h-6 w-6" />
                  رسالتنا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-800">
                  تطوير مهارات ومعارف الأطباء في مجال جراحة الأوعية الدموية من خلال
                  تنظيم المؤتمرات والورش العلمية، وتبادل الخبرات مع الجمعيات الدولية.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="bg-neutral-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">أهدافنا</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              'تنظيم المؤتمرات والندوات العلمية المتخصصة',
              'توفير برامج التعليم الطبي المستمر (CME)',
              'تعزيز التعاون مع الجمعيات الطبية المحلية والدولية',
              'دعم البحث العلمي في مجال جراحة الأوعية',
              'رفع مستوى الوعي الصحي في المجتمع',
              'تبادل الخبرات والمعرفة بين الأعضاء',
            ].map((objective, index) => (
              <Card key={index}>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold">
                    {index + 1}
                  </div>
                  <p>{objective}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Board Members */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="flex items-center justify-center gap-2 text-2xl font-bold">
              <Users className="h-6 w-6" />
              مجلس الإدارة
            </h2>
            <p className="mt-2 text-muted-foreground">
              أعضاء مجلس إدارة الجمعية
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <Skeleton className="mx-auto h-24 w-24 rounded-full" />
                    <Skeleton className="mx-auto mt-4 h-6 w-32" />
                    <Skeleton className="mx-auto mt-2 h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : boardMembers?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {boardMembers.map((member) => (
                <Card key={member._id} className="text-center">
                  <CardContent className="pt-6">
                    <Avatar className="mx-auto h-24 w-24">
                      <AvatarImage src={member.image} alt={member.nameAr} />
                      <AvatarFallback className="bg-primary-100 text-2xl text-primary-700">
                        {member.nameAr.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-bold">{member.nameAr}</h3>
                    <p className="text-sm text-primary-600">{member.positionAr}</p>
                    {member.bioAr && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {member.bioAr}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              لا توجد بيانات متاحة حالياً
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
