import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.days, label: 'يوم' },
    { value: timeLeft.hours, label: 'ساعة' },
    { value: timeLeft.minutes, label: 'دقيقة' },
    { value: timeLeft.seconds, label: 'ثانية' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-white/20 bg-white/5 p-3 shadow-[0_10px_35px_rgba(12,20,54,0.22)] backdrop-blur-sm sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {timeUnits.map((unit) => (
          <div
            key={unit.label}
            className="rounded-xl border border-primary-200/25 bg-white/10 px-3 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] sm:px-4"
          >
            <span className="block text-3xl font-extrabold leading-none text-white sm:text-5xl">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-2 block text-xs font-medium text-primary-100 sm:text-sm">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
