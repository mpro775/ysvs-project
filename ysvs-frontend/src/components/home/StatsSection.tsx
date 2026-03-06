import { Award, Calendar, Users } from "lucide-react";

const stats = [
  { label: "مؤتمر علمي", value: "+25", icon: Award },
  { label: "عضو مسجل", value: "+500", icon: Users },
  { label: "فعالية سنوية", value: "+25", icon: Calendar },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-background bg-[radial-gradient(circle_at_top,_rgba(139,0,0,0.12)_0%,_transparent_42%)] py-16 sm:py-20">
      <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[55%] -translate-x-1/2 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative mx-auto w-full max-w-[1160px] px-4">
        <div className="mb-10 text-center sm:mb-12">
          <span className="inline-flex rounded-full border border-primary/20 bg-card/80 px-4 py-1 text-[11px] font-bold text-primary backdrop-blur">
            إنجازاتنا
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            نحن فخورون بما حققناه
          </h2>

          <p className="mt-3 text-sm font-semibold text-muted-foreground sm:text-base">
            أرقامنا تتحدث عن التزامنا بتطوير القطاع الصحي في اليمن
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 px-6 py-9 text-center shadow-[0_18px_45px_rgba(120,24,24,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(90,30,60,0.2)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-800 via-primary-700 to-primary-500" />
              <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-primary/15 blur-2xl transition group-hover:scale-125" />
              <div className="absolute right-6 top-6 h-1 w-20 rounded-full bg-gradient-to-l from-primary/40 via-primary/20 to-transparent" />

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700 text-white shadow-[0_8px_20px_rgba(95,45,45,0.35)]">
                <stat.icon className="h-7 w-7" strokeWidth={1.9} />
              </div>

              <p className="text-[38px] font-extrabold leading-none tracking-tight text-foreground sm:text-[42px]">
                {stat.value}
              </p>

              <p className="mt-3 text-sm font-bold text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
