import { Award, Calendar, Users } from "lucide-react";

const stats = [
  { label: "مؤتمر علمي", value: "+25", icon: Award },
  { label: "عضو مسجل", value: "+500", icon: Users },
  { label: "فعالية سنوية", value: "+25", icon: Calendar },
];

export function StatsSection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#fff4f4_36%,_#f9fbff_100%)] py-16 sm:py-20">
      <div className="pointer-events-none absolute -right-20 top-12 h-56 w-56 rounded-full bg-[#214f96]/18 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-[#8B0000]/14 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[55%] -translate-x-1/2 rounded-full bg-[#dfe7ff]/55 blur-2xl" />

      <div className="relative mx-auto w-full max-w-[1160px] px-4">
        <div className="mb-10 text-center sm:mb-12">
          <span className="inline-flex rounded-full border border-[#c9d8ff] bg-white/85 px-4 py-1 text-[11px] font-bold text-[#214f96] backdrop-blur">
            إنجازاتنا
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1b2e63] sm:text-5xl">
            نحن فخورون بما حققناه
          </h2>

          <p className="mt-3 text-sm font-semibold text-[#5f2744] sm:text-base">
            أرقامنا تتحدث عن التزامنا بتطوير القطاع الصحي في اليمن
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-3xl border border-[#dbe6ff]/80 bg-white/85 px-6 py-9 text-center shadow-[0_18px_45px_rgba(33,79,150,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(90,30,60,0.2)]"
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#214f96] via-[#8B0000] to-[#D32F2F]" />
              <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-[#214f96]/12 blur-2xl transition group-hover:scale-125" />
              <div className="absolute right-6 top-6 h-1 w-20 rounded-full bg-gradient-to-l from-[#F8B4B4]/70 via-[#dbe6ff]/50 to-transparent" />

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-[#214f96] via-[#2b4a92] to-[#8B0000] text-white shadow-[0_8px_20px_rgba(64,45,95,0.35)]">
                <stat.icon className="h-7 w-7" strokeWidth={1.9} />
              </div>

              <p className="text-[38px] font-extrabold leading-none tracking-tight text-[#1e2f66] sm:text-[42px]">
                {stat.value}
              </p>

              <p className="mt-3 text-sm font-bold text-[#6b3250]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
