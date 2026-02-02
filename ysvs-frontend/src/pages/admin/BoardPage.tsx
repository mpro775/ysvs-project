import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBoardMembers,
  useCreateBoardMember,
  useUpdateBoardMember,
  useDeleteBoardMember,
} from "@/api/hooks/useContent";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import type { BoardMember } from "@/types";

export default function AdminBoardPage() {
  const { data: members, isLoading } = useBoardMembers();
  const { mutate: createMember, isPending: isCreating } =
    useCreateBoardMember();
  const { mutate: updateMember, isPending: isUpdating } =
    useUpdateBoardMember();
  const { mutate: deleteMember, isPending: isDeleting } =
    useDeleteBoardMember();

  const [editMember, setEditMember] = useState<BoardMember | null>(null);
  const [deleteMemberDialog, setDeleteMemberDialog] =
    useState<BoardMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    positionAr: "",
    positionEn: "",
    bioAr: "",
    isActive: true,
    order: 0,
  });

  const resetForm = () => {
    setForm({
      nameAr: "",
      nameEn: "",
      positionAr: "",
      positionEn: "",
      bioAr: "",
      isActive: true,
      order: 0,
    });
    setEditMember(null);
  };

  const handleEdit = (member: BoardMember) => {
    setEditMember(member);
    setForm({
      nameAr: member.nameAr,
      nameEn: member.nameEn,
      positionAr: member.positionAr,
      positionEn: member.positionEn,
      bioAr: member.bioAr || "",
      isActive: member.isActive,
      order: member.order,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editMember) {
      updateMember(
        { id: editMember._id, data: form },
        {
          onSuccess: () => {
            setDialogOpen(false);
            resetForm();
          },
        }
      );
    } else {
      createMember(form, {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleDelete = () => {
    if (deleteMemberDialog) {
      deleteMember(deleteMemberDialog._id, {
        onSuccess: () => setDeleteMemberDialog(null),
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">مجلس الإدارة</h1>
          <p className="text-sm text-muted-foreground">
            إدارة أعضاء مجلس الإدارة
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="ml-2 h-4 w-4" />
              إضافة عضو
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editMember ? "تعديل العضو" : "إضافة عضو جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم (عربي)</Label>
                  <Input
                    value={form.nameAr}
                    onChange={(e) =>
                      setForm({ ...form, nameAr: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={form.nameEn}
                    onChange={(e) =>
                      setForm({ ...form, nameEn: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>المنصب (عربي)</Label>
                  <Input
                    value={form.positionAr}
                    onChange={(e) =>
                      setForm({ ...form, positionAr: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>المنصب (إنجليزي)</Label>
                  <Input
                    dir="ltr"
                    value={form.positionEn}
                    onChange={(e) =>
                      setForm({ ...form, positionEn: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>نبذة</Label>
                <Textarea
                  value={form.bioAr}
                  onChange={(e) => setForm({ ...form, bioAr: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isActive: checked })
                  }
                />
                <Label>نشط</Label>
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isCreating || isUpdating}
              >
                {editMember ? "حفظ التغييرات" : "إضافة العضو"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card key={member._id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.image} />
                    <AvatarFallback>{member.nameAr.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold">{member.nameAr}</h3>
                    <p className="text-sm text-primary-600">
                      {member.positionAr}
                    </p>
                    {member.bioAr && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {member.bioAr}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteMemberDialog(member)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="لا يوجد أعضاء"
          description="لم تتم إضافة أعضاء مجلس الإدارة بعد"
        />
      )}

      <ConfirmDialog
        open={!!deleteMemberDialog}
        onOpenChange={() => setDeleteMemberDialog(null)}
        title="حذف العضو"
        description={`هل أنت متأكد من حذف "${deleteMemberDialog?.nameAr}"؟`}
        confirmText="حذف"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
