import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JoinAssociationSection() {
  return (
    <section className="bg-muted/30 pb-16">
      <div className="container mx-auto px-4">
        <div className="rounded-sm bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700 py-14 text-center text-white shadow-[0_12px_30px_rgba(90,22,22,0.35)] dark:from-primary-950 dark:via-neutral-900 dark:to-neutral-800">
          <h2 className="mb-3 text-4xl font-extrabold">إنضم إلى الجمعية اليوم</h2>
          <p className="mb-8 text-xl text-primary-100">
            كن جزء من مجتمع أطباء الأوعية الدموية في اليمن
          </p>
          <Button
            asChild
            className="h-12 rounded-xl bg-white px-7 text-lg font-bold text-primary-900 hover:bg-primary-50"
          >
            <Link to="/register" className="flex items-center gap-2">
              إنشاء حساب مجاني
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
