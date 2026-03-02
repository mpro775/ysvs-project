import { Award, Calendar, Users } from "lucide-react";

const stats = [
  { label: "مؤتمر علمي", value: "+25", icon: Award },
  { label: "عضو مسجل", value: "+500", icon: Users },
  { label: "فعالية سنوية", value: "+25", icon: Calendar },
];

export function StatsSection() {
  return (
    <section className="bg-[#f6f7fb] py-16 sm:py-20">
      <div className="mx-auto w-full max-w-[1100px] px-4">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12">
          <span className="inline-flex rounded-full bg-[#dfe7ff] px-4 py-1 text-[11px] font-semibold text-[#3041a7]">
            إنجازاتنا
          </span>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
            نحن فخورون بما حققناه
          </h2>

          <p className="mt-3 text-sm text-[#6b7280] sm:text-base">
            أرقامنا تتحدث عن التزامنا بتطوير القطاع الصحي في اليمن
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="
                relative overflow-hidden rounded-[22px] bg-white px-6 py-10 text-center
                border border-[#e9ebf2]
                shadow-[0_10px_30px_rgba(16,24,40,0.10)]
                min-h-[170px]
              "
            >
              {/* bottom blue line (ملاصق للحافة مثل الصورة) */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2f80d5]" />

              <stat.icon
                className="mx-auto mb-4 h-7 w-7 text-[#2e2d9f]"
                strokeWidth={1.8}
              />

              <p className="text-[34px] font-semibold leading-none text-[#1f2937]">
                {stat.value}
              </p>

              <p className="mt-3 text-sm font-medium text-[#6b7280]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
