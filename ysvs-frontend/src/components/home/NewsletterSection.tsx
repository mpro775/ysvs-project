import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import { useNewsletterSubscribe } from "@/api/hooks/useContent";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const subscribeMutation = useNewsletterSubscribe();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFeedback({
        type: "error",
        text: "الرجاء إدخال البريد الإلكتروني.",
      });
      return;
    }

    setFeedback(null);
    subscribeMutation.mutate(
      {
        email: normalizedEmail,
        source: "homepage",
        locale: "ar",
      },
      {
        onSuccess: () => {
          setEmail("");
          setFeedback({
            type: "success",
            text: "شكراً لاشتراكك في النشرة البريدية.",
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            text: error.message || "تعذر تنفيذ الاشتراك حالياً.",
          });
        },
      },
    );
  };

  return (
    <section className="bg-muted/30 pb-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-sm border border-primary/35 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700 px-4 py-14 text-white dark:from-primary-950 dark:via-neutral-900 dark:to-neutral-800 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/8 shadow-[0_10px_25px_rgba(0,0,0,0.18)] backdrop-blur-sm">
              <Mail className="h-8 w-8" />
            </div>

            <h2 className="text-3xl font-extrabold sm:text-5xl">
              اشترك في النشرة البريدية
            </h2>
            <p className="mt-3 text-sm text-primary-100 sm:text-lg">
              احصل على آخر الأخبار والتحديثات والفعاليات مباشرة إلى بريدك
              الإلكتروني
            </p>

            <form
              onSubmit={handleSubmit}
              className="mx-auto mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-sm sm:flex-row-reverse"
            >
              <button
                type="submit"
                disabled={subscribeMutation.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-primary-900 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {subscribeMutation.isPending ? "جاري الاشتراك..." : "اشترك الآن"}
              </button>

              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary-100" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="أدخل بريدك الإلكتروني"
                  className="h-11 w-full rounded-xl border border-white/10 bg-white/8 pr-3 pl-10 text-right text-sm text-white placeholder:text-primary-100 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </form>

            {feedback && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-3 text-sm ${feedback.type === "success" ? "text-emerald-200" : "text-rose-200"}`}
              >
                {feedback.text}
              </p>
            )}

            <p className="mt-4 text-xs text-primary-100">
              نحترم خصوصيتك، يمكنك إلغاء الاشتراك في أي وقت.
            </p>

            <div className="mx-auto mt-10 grid max-w-xl grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-extrabold">5000+</p>
                <p className="mt-1 text-sm text-primary-100">مشترك نشط</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">أسبوعية</p>
                <p className="mt-1 text-sm text-primary-100">نشرات منتظمة</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold">حصري</p>
                <p className="mt-1 text-sm text-primary-100">محتوى مميز</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
