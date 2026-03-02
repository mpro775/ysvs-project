import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Article } from "@/types";
import { LatestNewsShowcaseCard } from "@/components/home/LatestNewsShowcaseCard";

interface LatestNewsSectionProps {
  articles?: Article[];
  isLoading?: boolean;
}

export function LatestNewsSection({ articles, isLoading }: LatestNewsSectionProps) {
  return (
    <section className="bg-[#f3f3f5] py-14 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-7 flex flex-col-reverse items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5047de] hover:text-[#3d35bc]"
          >
            عرض الكل
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="text-right">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#1f2437] sm:text-5xl">أحدث الأخبار</h2>
            <p className="mt-1 text-sm text-[#6a7288]">تابع آخر الأخبار والفعاليات والأنشطة</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[372px] animate-pulse rounded-2xl border border-[#e5e8ef] bg-white"
                />
              ))
            : articles?.length
              ? articles.map((article) => <LatestNewsShowcaseCard key={article._id} article={article} />)
              : (
                <p className="col-span-3 rounded-2xl bg-white p-8 text-center text-[#7a8094]">
                  لا توجد أخبار حالياً
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
