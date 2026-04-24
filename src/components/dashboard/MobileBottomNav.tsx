import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomNavItem<T extends string = string> = {
  key: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

interface MobileBottomNavProps<T extends string> {
  active: T;
  items: BottomNavItem<T>[];
  onChange: (tab: T) => void;
}

function MobileBottomNav<T extends string>({ active, items, onChange }: MobileBottomNavProps<T>) {
  const cols = items.length === 4 ? "grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className={cn("grid", cols)}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onChange(item.key)}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <span
                  className={cn(
                    "relative flex items-center justify-center h-9 w-12 rounded-xl transition-all",
                    isActive ? "bg-primary/10" : ""
                  )}
                >
                  <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10.5px] font-medium leading-none text-center">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Backward-compat preset for the applicant dashboard
export type MobileTab = "jobs" | "applications" | "profile";

export default MobileBottomNav;
