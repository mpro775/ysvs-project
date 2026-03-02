import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JoinAssociationSection() {
  return (
    <section className="bg-[#f3f3f5] pb-16">
      <div className="container mx-auto px-4">
        <div className="rounded-sm bg-gradient-to-r from-[#2f2aa8] via-[#2d35b9] to-[#1f4db4] py-14 text-center text-white shadow-[0_12px_30px_rgba(35,53,140,0.35)]">
          <h2 className="mb-3 text-4xl font-extrabold">إنضم إلى الجمعية اليوم</h2>
          <p className="mb-8 text-xl text-[#c8d4ff]">
            كن جزء من مجتمع أطباء الأوعية الدموية في اليمن
          </p>
          <Button
            asChild
            className="h-12 rounded-xl bg-white px-7 text-lg font-bold text-[#2a3397] hover:bg-[#eef2ff]"
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
