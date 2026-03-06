import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { type ThemeMode } from '@/lib/theme';
import { useUIStore } from '@/stores/uiStore';

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'فاتح', icon: Sun },
  { value: 'dark', label: 'داكن', icon: Moon },
  { value: 'system', label: 'النظام', icon: Monitor },
];

const triggerIconMap = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useUIStore();
  const TriggerIcon = triggerIconMap[theme];
  const activeLabel = themeOptions.find((option) => option.value === theme)?.label ?? 'النظام';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'sm' : 'icon'}
          className={cn(showLabel ? 'h-9 px-3' : 'h-9 w-9', className)}
          aria-label="تغيير وضع العرض"
        >
          <TriggerIcon className="h-4 w-4" />
          {showLabel && <span className="mr-2 text-xs">{activeLabel}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {themeOptions.map((option) => {
          const OptionIcon = option.icon;
          const selected = theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <OptionIcon className="h-4 w-4" />
                {option.label}
              </span>
              {selected && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
