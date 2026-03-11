import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineLoader } from '@/components/shared/LoadingSpinner';
import {
  useAdminSiteContent,
  usePublishPrivacyPolicy,
  usePublishTermsAndConditions,
  useUpdateHomepageContent,
  useUpdatePrivacyPolicy,
  useUpdateSiteFooter,
  useUpdateTermsAndConditions,
} from '@/api/hooks/useContent';
import { useEvents } from '@/api/hooks/useEvents';
import type { FooterQuickLink, FooterSocialLink, LegalPage } from '@/types';

const NO_COUNTDOWN_EVENT = '__none__';

interface FooterFormState {
  descriptionAr: string;
  descriptionEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  email: string;
  quickLinks: FooterQuickLink[];
  socialLinks: FooterSocialLink[];
  copyrightAr: string;
  copyrightEn: string;
}

interface LegalFormState {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

const emptyQuickLink = (): FooterQuickLink => ({
  labelAr: '',
  labelEn: '',
  href: '',
  order: 0,
  isActive: true,
});

const emptySocialLink = (): FooterSocialLink => ({
  platform: '',
  url: '',
  order: 0,
  isActive: true,
});

function legalToForm(legal?: LegalPage): LegalFormState {
  return {
    titleAr: legal?.titleAr || '',
    titleEn: legal?.titleEn || '',
    contentAr: legal?.contentAr || '',
    contentEn: legal?.contentEn || '',
  };
}

const normalizeCountInput = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
};

export default function AdminSiteContentPage() {
  const { data, isLoading, isError } = useAdminSiteContent();
  const { data: upcomingEventsResponse, isLoading: isLoadingUpcomingEvents } = useEvents({
    status: 'upcoming',
    limit: 100,
  });
  const { mutate: updateFooter, isPending: isFooterSaving } = useUpdateSiteFooter();
  const { mutate: updateHomepageContent, isPending: isHomepageSaving } = useUpdateHomepageContent();
  const { mutate: updatePrivacy, isPending: isPrivacySaving } = useUpdatePrivacyPolicy();
  const { mutate: updateTerms, isPending: isTermsSaving } = useUpdateTermsAndConditions();
  const { mutate: publishPrivacy, isPending: isPublishingPrivacy } = usePublishPrivacyPolicy();
  const { mutate: publishTerms, isPending: isPublishingTerms } = usePublishTermsAndConditions();

  const [initialized, setInitialized] = useState(false);
  const [footerForm, setFooterForm] = useState<FooterFormState>({
    descriptionAr: '',
    descriptionEn: '',
    addressAr: '',
    addressEn: '',
    phone: '',
    email: '',
    quickLinks: [],
    socialLinks: [],
    copyrightAr: '',
    copyrightEn: '',
  });
  const [privacyForm, setPrivacyForm] = useState<LegalFormState>(legalToForm());
  const [termsForm, setTermsForm] = useState<LegalFormState>(legalToForm());
  const [homepageCountdownEventId, setHomepageCountdownEventId] = useState<string | null>(null);
  const [homepageConferencesCount, setHomepageConferencesCount] = useState('25');
  const [homepageRegisteredMembersCount, setHomepageRegisteredMembersCount] = useState('500');
  const [homepageAnnualActivitiesCount, setHomepageAnnualActivitiesCount] = useState('25');

  useEffect(() => {
    if (!data || initialized) return;

    const sortedQuickLinks = [...(data.footer.quickLinks || [])].sort(
      (a, b) => a.order - b.order,
    );
    const sortedSocialLinks = [...(data.footer.socialLinks || [])].sort(
      (a, b) => a.order - b.order,
    );

    setFooterForm({
      descriptionAr: data.footer.descriptionAr,
      descriptionEn: data.footer.descriptionEn,
      addressAr: data.footer.addressAr,
      addressEn: data.footer.addressEn,
      phone: data.footer.phone,
      email: data.footer.email,
      quickLinks: sortedQuickLinks,
      socialLinks: sortedSocialLinks,
      copyrightAr: data.footer.copyrightAr,
      copyrightEn: data.footer.copyrightEn,
    });

    setPrivacyForm(legalToForm(data.legalPages.privacy));
    setTermsForm(legalToForm(data.legalPages.terms));
    setHomepageCountdownEventId(data.homepage?.countdownEventId || null);
    setHomepageConferencesCount(String(data.homepage?.conferencesCount ?? 25));
    setHomepageRegisteredMembersCount(String(data.homepage?.registeredMembersCount ?? 500));
    setHomepageAnnualActivitiesCount(String(data.homepage?.annualActivitiesCount ?? 25));
    setInitialized(true);
  }, [data, initialized]);

  const upcomingEvents = useMemo(
    () =>
      [...(upcomingEventsResponse?.data || [])].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
    [upcomingEventsResponse?.data],
  );

  const canSaveFooter = useMemo(() => {
    if (!initialized) return false;
    return Boolean(
      footerForm.descriptionAr.trim() &&
        footerForm.addressAr.trim() &&
        footerForm.phone.trim() &&
        footerForm.email.trim() &&
        footerForm.quickLinks.every((link) => link.labelAr.trim() && link.href.trim()) &&
        footerForm.socialLinks.every((social) => social.platform.trim() && social.url.trim()),
    );
  }, [footerForm, initialized]);

  const canSavePrivacy = useMemo(
    () =>
      Boolean(
        privacyForm.titleAr.trim() &&
          privacyForm.titleEn.trim() &&
          privacyForm.contentAr.trim() &&
          privacyForm.contentEn.trim(),
      ),
    [privacyForm],
  );

  const canSaveHomepage = useMemo(() => {
    if (!initialized) return false;

    const initialCountdownEventId = data?.homepage?.countdownEventId || null;
    const initialConferencesCount = data?.homepage?.conferencesCount ?? 25;
    const initialRegisteredMembersCount = data?.homepage?.registeredMembersCount ?? 500;
    const initialAnnualActivitiesCount = data?.homepage?.annualActivitiesCount ?? 25;

    const currentConferencesCount = normalizeCountInput(homepageConferencesCount);
    const currentRegisteredMembersCount = normalizeCountInput(homepageRegisteredMembersCount);
    const currentAnnualActivitiesCount = normalizeCountInput(homepageAnnualActivitiesCount);

    return (
      initialCountdownEventId !== homepageCountdownEventId ||
      initialConferencesCount !== currentConferencesCount ||
      initialRegisteredMembersCount !== currentRegisteredMembersCount ||
      initialAnnualActivitiesCount !== currentAnnualActivitiesCount
    );
  }, [
    data?.homepage?.annualActivitiesCount,
    data?.homepage?.conferencesCount,
    data?.homepage?.countdownEventId,
    data?.homepage?.registeredMembersCount,
    homepageAnnualActivitiesCount,
    homepageConferencesCount,
    homepageCountdownEventId,
    homepageRegisteredMembersCount,
    initialized,
  ]);

  const hasStaleCountdownSelection = useMemo(() => {
    if (!homepageCountdownEventId) return false;
    return !upcomingEvents.some((event) => event._id === homepageCountdownEventId);
  }, [homepageCountdownEventId, upcomingEvents]);

  const canSaveTerms = useMemo(
    () =>
      Boolean(
        termsForm.titleAr.trim() &&
          termsForm.titleEn.trim() &&
          termsForm.contentAr.trim() &&
          termsForm.contentEn.trim(),
      ),
    [termsForm],
  );

  const updateQuickLink = (
    index: number,
    updater: (link: FooterQuickLink) => FooterQuickLink,
  ) => {
    setFooterForm((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) => (i === index ? updater(link) : link)),
    }));
  };

  const updateSocialLink = (
    index: number,
    updater: (link: FooterSocialLink) => FooterSocialLink,
  ) => {
    setFooterForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.map((link, i) => (i === index ? updater(link) : link)),
    }));
  };

  const addQuickLink = () => {
    setFooterForm((prev) => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { ...emptyQuickLink(), order: prev.quickLinks.length }],
    }));
  };

  const addSocialLink = () => {
    setFooterForm((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { ...emptySocialLink(), order: prev.socialLinks.length }],
    }));
  };

  const removeQuickLink = (index: number) => {
    setFooterForm((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks
        .filter((_, i) => i !== index)
        .map((link, i) => ({ ...link, order: i })),
    }));
  };

  const removeSocialLink = (index: number) => {
    setFooterForm((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks
        .filter((_, i) => i !== index)
        .map((link, i) => ({ ...link, order: i })),
    }));
  };

  const moveQuickLink = (index: number, direction: 'up' | 'down') => {
    setFooterForm((prev) => {
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.quickLinks.length) return prev;

      const nextQuickLinks = [...prev.quickLinks];
      const current = nextQuickLinks[index];
      nextQuickLinks[index] = nextQuickLinks[nextIndex];
      nextQuickLinks[nextIndex] = current;

      return {
        ...prev,
        quickLinks: nextQuickLinks.map((link, i) => ({ ...link, order: i })),
      };
    });
  };

  const moveSocialLink = (index: number, direction: 'up' | 'down') => {
    setFooterForm((prev) => {
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.socialLinks.length) return prev;

      const nextSocialLinks = [...prev.socialLinks];
      const current = nextSocialLinks[index];
      nextSocialLinks[index] = nextSocialLinks[nextIndex];
      nextSocialLinks[nextIndex] = current;

      return {
        ...prev,
        socialLinks: nextSocialLinks.map((link, i) => ({ ...link, order: i })),
      };
    });
  };

  const handleSaveFooter = () => {
    updateFooter({
      ...footerForm,
      descriptionAr: footerForm.descriptionAr.trim(),
      descriptionEn: footerForm.descriptionEn.trim(),
      addressAr: footerForm.addressAr.trim(),
      addressEn: footerForm.addressEn.trim(),
      phone: footerForm.phone.trim(),
      email: footerForm.email.trim(),
      quickLinks: footerForm.quickLinks
        .map((link) => ({
          ...link,
          labelAr: link.labelAr.trim(),
          labelEn: link.labelEn.trim(),
          href: link.href.trim(),
        }))
        .filter((link) => link.labelAr && link.href)
        .map((link, i) => ({ ...link, order: i })),
      socialLinks: footerForm.socialLinks
        .map((social) => ({
          ...social,
          platform: social.platform.trim(),
          url: social.url.trim(),
        }))
        .filter((social) => social.platform && social.url)
        .map((social, i) => ({ ...social, order: i })),
      copyrightAr: footerForm.copyrightAr.trim(),
      copyrightEn: footerForm.copyrightEn.trim(),
    });
  };

  const handleSaveHomepage = () => {
    updateHomepageContent({
      countdownEventId: homepageCountdownEventId || null,
      conferencesCount: normalizeCountInput(homepageConferencesCount),
      registeredMembersCount: normalizeCountInput(homepageRegisteredMembersCount),
      annualActivitiesCount: normalizeCountInput(homepageAnnualActivitiesCount),
    });
  };

  const handleDisableHomepageCountdown = () => {
    setHomepageCountdownEventId(null);
    updateHomepageContent({ countdownEventId: null });
  };

  const handleSavePrivacy = () => {
    updatePrivacy({
      titleAr: privacyForm.titleAr.trim(),
      titleEn: privacyForm.titleEn.trim(),
      contentAr: privacyForm.contentAr.trim(),
      contentEn: privacyForm.contentEn.trim(),
    });
  };

  const handleSaveTerms = () => {
    updateTerms({
      titleAr: termsForm.titleAr.trim(),
      titleEn: termsForm.titleEn.trim(),
      contentAr: termsForm.contentAr.trim(),
      contentEn: termsForm.contentEn.trim(),
    });
  };

  if (isLoading && !initialized) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">المحتوى العام</h1>
        <p className="text-sm text-muted-foreground">
          إدارة الفوتر وصفحات سياسة الخصوصية والشروط والأحكام
        </p>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>تعذر تحميل المحتوى</AlertTitle>
          <AlertDescription>
            حدث خطأ أثناء جلب المحتوى. يمكنك متابعة التعديل ثم إعادة الحفظ.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="footer" className="space-y-6">
        <TabsList className="flex w-full flex-wrap sm:inline-flex">
          <TabsTrigger value="footer">الفوتر</TabsTrigger>
          <TabsTrigger value="homepage">الصفحة الرئيسية</TabsTrigger>
          <TabsTrigger value="privacy">سياسة الخصوصية</TabsTrigger>
          <TabsTrigger value="terms">الشروط والأحكام</TabsTrigger>
        </TabsList>

        <TabsContent value="footer" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>بيانات الفوتر</CardTitle>
              <Button onClick={handleSaveFooter} disabled={!canSaveFooter || isFooterSaving}>
                {isFooterSaving ? (
                  <>
                    <InlineLoader className="ml-2" />
                    جاري حفظ الفوتر...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ الفوتر
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الوصف (عربي)</Label>
                  <Textarea
                    value={footerForm.descriptionAr}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, descriptionAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الوصف (إنجليزي)</Label>
                  <Textarea
                    dir="ltr"
                    value={footerForm.descriptionEn}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, descriptionEn: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={footerForm.addressAr}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, addressAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={footerForm.addressEn}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, addressEn: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input
                    dir="ltr"
                    value={footerForm.phone}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    dir="ltr"
                    value={footerForm.email}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>حقوق النشر (عربي)</Label>
                  <Input
                    value={footerForm.copyrightAr}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, copyrightAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>حقوق النشر (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={footerForm.copyrightEn}
                    onChange={(event) =>
                      setFooterForm((prev) => ({ ...prev, copyrightEn: event.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>الروابط السريعة</CardTitle>
              <Button type="button" variant="outline" onClick={addQuickLink}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة رابط
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {footerForm.quickLinks.map((link, index) => (
                <div key={`${index}-${link.order}`} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">رابط #{index + 1}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveQuickLink(index, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === footerForm.quickLinks.length - 1}
                        onClick={() => moveQuickLink(index, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeQuickLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>العنوان (عربي)</Label>
                      <Input
                        value={link.labelAr}
                        onChange={(event) =>
                          updateQuickLink(index, (current) => ({
                            ...current,
                            labelAr: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان (إنجليزي)</Label>
                      <Input
                        dir="ltr"
                        value={link.labelEn}
                        onChange={(event) =>
                          updateQuickLink(index, (current) => ({
                            ...current,
                            labelEn: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرابط</Label>
                      <Input
                        dir="ltr"
                        value={link.href}
                        onChange={(event) =>
                          updateQuickLink(index, (current) => ({
                            ...current,
                            href: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>روابط التواصل الاجتماعي</CardTitle>
              <Button type="button" variant="outline" onClick={addSocialLink}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة منصة
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {footerForm.socialLinks.map((social, index) => (
                <div key={`${index}-${social.order}`} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">منصة #{index + 1}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveSocialLink(index, 'up')}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === footerForm.socialLinks.length - 1}
                        onClick={() => moveSocialLink(index, 'down')}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeSocialLink(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>اسم المنصة</Label>
                      <Input
                        dir="ltr"
                        value={social.platform}
                        onChange={(event) =>
                          updateSocialLink(index, (current) => ({
                            ...current,
                            platform: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرابط</Label>
                      <Input
                        dir="ltr"
                        value={social.url}
                        onChange={(event) =>
                          updateSocialLink(index, (current) => ({
                            ...current,
                            url: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homepage">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>عداد المؤتمر القادم</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveHomepage} disabled={!canSaveHomepage || isHomepageSaving}>
                  {isHomepageSaving ? (
                    <>
                      <InlineLoader className="ml-2" />
                      جاري حفظ الإعداد...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ الاختيار
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisableHomepageCountdown}
                  disabled={isHomepageSaving || homepageCountdownEventId === null}
                >
                  تعطيل العداد
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>مهم</AlertTitle>
                <AlertDescription>
                  إذا انتهى المؤتمر المختار أو تغيّرت حالته، سيختفي العداد تلقائياً من الصفحة الرئيسية
                  حتى تقوم بتفعيله عبر اختيار مؤتمر قادم جديد.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>المؤتمر المعروض في العداد</Label>
                <Select
                  value={homepageCountdownEventId || NO_COUNTDOWN_EVENT}
                  onValueChange={(value) => {
                    setHomepageCountdownEventId(value === NO_COUNTDOWN_EVENT ? null : value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مؤتمراً قادماً" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_COUNTDOWN_EVENT}>بدون عداد</SelectItem>
                    {hasStaleCountdownSelection && homepageCountdownEventId && (
                      <SelectItem value={homepageCountdownEventId}>
                        اختيار سابق غير صالح (انتهى أو غير متاح)
                      </SelectItem>
                    )}
                    {upcomingEvents.map((event) => (
                      <SelectItem key={event._id} value={event._id}>
                        {event.titleAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>عدد المؤتمرات العلمية</Label>
                  <Input
                    type="number"
                    min={0}
                    value={homepageConferencesCount}
                    onChange={(event) => setHomepageConferencesCount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عدد الأعضاء المسجلين</Label>
                  <Input
                    type="number"
                    min={0}
                    value={homepageRegisteredMembersCount}
                    onChange={(event) => setHomepageRegisteredMembersCount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عدد الفعاليات السنوية</Label>
                  <Input
                    type="number"
                    min={0}
                    value={homepageAnnualActivitiesCount}
                    onChange={(event) => setHomepageAnnualActivitiesCount(event.target.value)}
                  />
                </div>
              </div>

              {isLoadingUpcomingEvents ? (
                <p className="text-sm text-muted-foreground">جاري تحميل قائمة المؤتمرات القادمة...</p>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا توجد مؤتمرات قادمة حالياً. يمكنك تعطيل العداد أو إنشاء مؤتمر جديد.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>سياسة الخصوصية</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSavePrivacy} disabled={!canSavePrivacy || isPrivacySaving}>
                  {isPrivacySaving ? (
                    <>
                      <InlineLoader className="ml-2" />
                      جاري حفظ المسودة...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ المسودة
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => publishPrivacy()}
                  disabled={isPublishingPrivacy}
                >
                  {isPublishingPrivacy ? (
                    <>
                      <InlineLoader className="ml-2" />
                      جاري نشر سياسة الخصوصية...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      نشر
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={privacyForm.titleAr}
                    onChange={(event) =>
                      setPrivacyForm((prev) => ({ ...prev, titleAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={privacyForm.titleEn}
                    onChange={(event) =>
                      setPrivacyForm((prev) => ({ ...prev, titleEn: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المحتوى (عربي - HTML)</Label>
                  <Textarea
                    className="min-h-72"
                    value={privacyForm.contentAr}
                    onChange={(event) =>
                      setPrivacyForm((prev) => ({ ...prev, contentAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى (إنجليزي - HTML)</Label>
                  <Textarea
                    dir="ltr"
                    className="min-h-72"
                    value={privacyForm.contentEn}
                    onChange={(event) =>
                      setPrivacyForm((prev) => ({ ...prev, contentEn: event.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terms">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>الشروط والأحكام</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveTerms} disabled={!canSaveTerms || isTermsSaving}>
                  {isTermsSaving ? (
                    <>
                      <InlineLoader className="ml-2" />
                      جاري حفظ المسودة...
                    </>
                  ) : (
                    <>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ المسودة
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => publishTerms()}
                  disabled={isPublishingTerms}
                >
                  {isPublishingTerms ? (
                    <>
                      <InlineLoader className="ml-2" />
                      جاري نشر الشروط والأحكام...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      نشر
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>العنوان (عربي)</Label>
                  <Input
                    value={termsForm.titleAr}
                    onChange={(event) =>
                      setTermsForm((prev) => ({ ...prev, titleAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>العنوان (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={termsForm.titleEn}
                    onChange={(event) =>
                      setTermsForm((prev) => ({ ...prev, titleEn: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المحتوى (عربي - HTML)</Label>
                  <Textarea
                    className="min-h-72"
                    value={termsForm.contentAr}
                    onChange={(event) =>
                      setTermsForm((prev) => ({ ...prev, contentAr: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>المحتوى (إنجليزي - HTML)</Label>
                  <Textarea
                    dir="ltr"
                    className="min-h-72"
                    value={termsForm.contentEn}
                    onChange={(event) =>
                      setTermsForm((prev) => ({ ...prev, contentEn: event.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
