import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    setTransitionKey((prev) => prev + 1);
    // Jump instantly to top so navigation feels snappy
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  const path = location.pathname;
  const isDashboardArea =
    path.startsWith("/admin") ||
    path.startsWith("/customer") ||
    path.startsWith("/garage") ||
    path.startsWith("/mechanic");

  const animationClasses = isDashboardArea
    ? "animate-in fade-in-0 slide-in-from-right-2 zoom-in-95 duration-200"
    : "animate-in fade-in-0 slide-in-from-bottom-2 zoom-in-95 duration-200";

  return (
    <div
      key={`${location.pathname}-${transitionKey}`}
      className={cn(
        "w-full flex flex-col motion-reduce:transition-none motion-reduce:animate-none",
        animationClasses,
        className
      )}
    >
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
    );
}
