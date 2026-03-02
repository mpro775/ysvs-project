import { type FormEvent } from "react";
import { Mail, Send } from "lucide-react";

export function NewsletterSection() {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="bg-[#f3f3f5] pb-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-sm border border-[#2dc8ff]/60 bg-gradient-to-b from-[#3c34c8] via-[#312db4] to-[#243f9c] px-4 py-14 text-white sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/8 shadow-[0_10px_25px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <Mail className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-extrabold sm:text-5xl">
              اشترك في النشرة البريدية
            </h2>
            <p className="mt-3 text-sm text-[#d8defe] sm:text-lg">
              احصل على آخر الأخبار والتحديثات والفعاليات مباشرة إلى بريدك
              الإلكتروني
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-sm sm:flex-row-reverse"
            >
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#2d2f97] transition hover:bg-[#edf1ff]"
              >
                <Send className="h-4 w-4" />
                اشترك الآن
              </button>

              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#d8defe]" />
                <input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/8 pr-3 pl-10 text-right text-sm text-white placeholder:text-[#d8defe] focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </form>

            <p className="mt-4 text-xs text-[#d8defe]">
              نحترم خصوصيتك، يمكنك إلغاء الاشتراك في أي وقت.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-extrabold">5000+</p>
                <p className="mt-1 text-sm text-[#d8defe]">مشترك نشط</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">أسبوعية</p>
                <p className="mt-1 text-sm text-[#d8defe]">نشرات منتظمة</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">حصري</p>
                <p className="mt-1 text-sm text-[#d8defe]">محتوى مميز</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
