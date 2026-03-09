import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InlineLoader } from "@/components/shared/LoadingSpinner";
import {
  useAdminAboutContent,
  useUpdateAboutContent,
} from "@/api/hooks/useContent";
import type { AboutObjective } from "@/types";

interface AboutFormState {
  heroTitleAr: string;
  heroTitleEn: string;
  heroDescriptionAr: string;
  heroDescriptionEn: string;
  visionTitleAr: string;
  visionTitleEn: string;
  visionTextAr: string;
  visionTextEn: string;
  missionTitleAr: string;
  missionTitleEn: string;
  missionTextAr: string;
  missionTextEn: string;
  objectives: AboutObjective[];
}

const emptyObjective = (): AboutObjective => ({
  textAr: "",
  textEn: "",
  order: 0,
  isActive: true,
});

export default function AdminAboutContentPage() {
  const { data, isLoading, isError } = useAdminAboutContent();
  const { mutate: updateAbout, isPending: isSaving } = useUpdateAboutContent();

  const [initialized, setInitialized] = useState(false);
  const [form, setForm] = useState<AboutFormState>({
    heroTitleAr: "",
    heroTitleEn: "",
    heroDescriptionAr: "",
    heroDescriptionEn: "",
    visionTitleAr: "",
    visionTitleEn: "",
    visionTextAr: "",
    visionTextEn: "",
    missionTitleAr: "",
    missionTitleEn: "",
    missionTextAr: "",
    missionTextEn: "",
    objectives: [],
  });

  useEffect(() => {
    if (!data || initialized) return;

    const normalizedObjectives = [...(data.objectives || [])]
      .sort((a, b) => a.order - b.order)
      .map((objective, index) => ({ ...objective, order: index }));

    setForm({
      heroTitleAr: data.heroTitleAr,
      heroTitleEn: data.heroTitleEn,
      heroDescriptionAr: data.heroDescriptionAr,
      heroDescriptionEn: data.heroDescriptionEn,
      visionTitleAr: data.visionTitleAr,
      visionTitleEn: data.visionTitleEn,
      visionTextAr: data.visionTextAr,
      visionTextEn: data.visionTextEn,
      missionTitleAr: data.missionTitleAr,
      missionTitleEn: data.missionTitleEn,
      missionTextAr: data.missionTextAr,
      missionTextEn: data.missionTextEn,
      objectives: normalizedObjectives,
    });

    setInitialized(true);
  }, [data, initialized]);

  const canSave = useMemo(() => {
    if (!initialized) return false;
    return Boolean(
      form.heroTitleAr.trim() &&
      form.heroTitleEn.trim() &&
      form.heroDescriptionAr.trim() &&
      form.heroDescriptionEn.trim() &&
      form.visionTitleAr.trim() &&
      form.visionTitleEn.trim() &&
      form.visionTextAr.trim() &&
      form.visionTextEn.trim() &&
      form.missionTitleAr.trim() &&
      form.missionTitleEn.trim() &&
      form.missionTextAr.trim() &&
      form.missionTextEn.trim() &&
      form.objectives.every(
        (objective) => objective.textAr.trim() && objective.textEn.trim(),
      )
    );
  }, [form, initialized]);

  const updateObjective = (
    index: number,
    updater: (objective: AboutObjective) => AboutObjective,
  ) => {
    setForm((prev) => ({
      ...prev,
      objectives: prev.objectives.map((objective, objectiveIndex) =>
        objectiveIndex === index ? updater(objective) : objective,
      ),
    }));
  };

  const addObjective = () => {
    setForm((prev) => ({
      ...prev,
      objectives: [...prev.objectives, { ...emptyObjective(), order: prev.objectives.length }],
    }));
  };

  const removeObjective = (index: number) => {
    setForm((prev) => ({
      ...prev,
      objectives: prev.objectives
        .filter((_, objectiveIndex) => objectiveIndex !== index)
        .map((objective, objectiveIndex) => ({ ...objective, order: objectiveIndex })),
    }));
  };

  const moveObjective = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.objectives.length) return prev;

      const objectives = [...prev.objectives];
      const current = objectives[index];
      objectives[index] = objectives[nextIndex];
      objectives[nextIndex] = current;

      return {
        ...prev,
        objectives: objectives.map((objective, objectiveIndex) => ({
          ...objective,
          order: objectiveIndex,
        })),
      };
    });
  };

  const handleSave = () => {
    updateAbout({
      ...form,
      objectives: form.objectives
        .map((objective) => ({
          ...objective,
          textAr: objective.textAr.trim(),
          textEn: objective.textEn.trim(),
        }))
        .filter((objective) => objective.textAr && objective.textEn)
        .map((objective, index) => ({
          ...objective,
          order: index,
        })),
    });
  };

  if (isLoading && !initialized) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">عن الجمعية</h1>
          <p className="text-sm text-muted-foreground">
            إدارة محتوى صفحة عن الجمعية
          </p>
        </div>
        <Button onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? (
            <>
              <InlineLoader className="ml-2" />
              جاري حفظ التغييرات...
            </>
          ) : (
            <>
              <Save className="ml-2 h-4 w-4" />
              حفظ التغييرات
            </>
          )}
        </Button>
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertTitle>تعذر تحميل البيانات</AlertTitle>
          <AlertDescription>
            حدث خطأ أثناء جلب محتوى الصفحة. يمكنك التعديل على البيانات الحالية ثم الحفظ.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>القسم الرئيسي</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>العنوان (عربي)</Label>
              <Input
                value={form.heroTitleAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, heroTitleAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>العنوان (إنجليزي)</Label>
              <Input
                dir="ltr"
                value={form.heroTitleEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, heroTitleEn: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الوصف (عربي)</Label>
              <Textarea
                value={form.heroDescriptionAr}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    heroDescriptionAr: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                value={form.heroDescriptionEn}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    heroDescriptionEn: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الرؤية والرسالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>عنوان الرؤية (عربي)</Label>
              <Input
                value={form.visionTitleAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visionTitleAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان الرؤية (إنجليزي)</Label>
              <Input
                dir="ltr"
                value={form.visionTitleEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visionTitleEn: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>نص الرؤية (عربي)</Label>
              <Textarea
                value={form.visionTextAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visionTextAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>نص الرؤية (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                value={form.visionTextEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visionTextEn: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>عنوان الرسالة (عربي)</Label>
              <Input
                value={form.missionTitleAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, missionTitleAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>عنوان الرسالة (إنجليزي)</Label>
              <Input
                dir="ltr"
                value={form.missionTitleEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, missionTitleEn: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>نص الرسالة (عربي)</Label>
              <Textarea
                value={form.missionTextAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, missionTextAr: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>نص الرسالة (إنجليزي)</Label>
              <Textarea
                dir="ltr"
                value={form.missionTextEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, missionTextEn: event.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الأهداف</CardTitle>
          <Button type="button" variant="outline" onClick={addObjective}>
            <Plus className="ml-2 h-4 w-4" />
            إضافة هدف
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.objectives.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد أهداف حالياً</p>
          ) : (
            form.objectives.map((objective, index) => (
              <div key={`${index}-${objective.order}`} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">هدف #{index + 1}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0}
                      onClick={() => moveObjective(index, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === form.objectives.length - 1}
                      onClick={() => moveObjective(index, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>النص (عربي)</Label>
                    <Input
                      value={objective.textAr}
                      onChange={(event) =>
                        updateObjective(index, (current) => ({
                          ...current,
                          textAr: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>النص (إنجليزي)</Label>
                    <Input
                      dir="ltr"
                      value={objective.textEn}
                      onChange={(event) =>
                        updateObjective(index, (current) => ({
                          ...current,
                          textEn: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={objective.isActive}
                    onCheckedChange={(checked) =>
                      updateObjective(index, (current) => ({
                        ...current,
                        isActive: checked,
                      }))
                    }
                  />
                  <Label>مفعل</Label>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
