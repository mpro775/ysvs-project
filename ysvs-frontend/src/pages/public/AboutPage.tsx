import { Target, Eye, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAboutContent, useBoardMembers } from '@/api/hooks/useContent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AboutPage() {
  const {
    data: aboutContent,
    isLoading: isAboutLoading,
    isError: isAboutError,
  } = useAboutContent();
  const { data: boardMembers, isLoading: isBoardLoading } = useBoardMembers();

  const objectives = aboutContent?.objectives
    ? [...aboutContent.objectives]
        .filter((objective) => objective.isActive)
        .sort((a, b) => a.order - b.order)
    : [];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-900 to-primary-800 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          {isAboutLoading ? (
            <>
              <Skeleton className="mx-auto h-10 w-56 bg-primary-700" />
              <Skeleton className="mx-auto mt-4 h-6 w-full max-w-2xl bg-primary-700" />
              <Skeleton className="mx-auto mt-2 h-6 w-[70%] max-w-xl bg-primary-700" />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold">
                {aboutContent?.heroTitleAr || 'عن الجمعية'}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-200">
                {aboutContent?.heroDescriptionAr || 'لا توجد بيانات متاحة حالياً'}
              </p>
            </>
          )}
        </div>
      </section>

      {isAboutError && (
        <section className="py-6">
          <div className="container mx-auto px-4">
            <Alert variant="destructive">
              <AlertTitle>تعذر تحميل المحتوى</AlertTitle>
              <AlertDescription>
                حدث خطأ أثناء جلب محتوى صفحة عن الجمعية. تم عرض بيانات احتياطية.
              </AlertDescription>
            </Alert>
          </div>
        </section>
      )}

      {/* Vision & Mission */}
      <section className="bg-muted/20 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-primary-200 bg-primary-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary-900">
                  <Eye className="h-6 w-6" />
                  {aboutContent?.visionTitleAr || 'رؤيتنا'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-800">
                  {aboutContent?.visionTextAr || 'لا توجد بيانات متاحة حالياً'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary-200 bg-primary-50/60 dark:bg-primary-950/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-primary-900">
                  <Target className="h-6 w-6" />
                  {aboutContent?.missionTitleAr || 'رسالتنا'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-primary-800">
                  {aboutContent?.missionTextAr || 'لا توجد بيانات متاحة حالياً'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Objectives */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">أهدافنا</h2>
          {isAboutLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-6 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : objectives?.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {objectives.map((objective, index) => (
                <Card key={`${objective.textAr}-${index}`}>
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-bold text-primary-600">
                      {index + 1}
                    </div>
                    <p>{objective.textAr}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              لا توجد أهداف متاحة حالياً
            </p>
          )}
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

          {isBoardLoading ? (
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
