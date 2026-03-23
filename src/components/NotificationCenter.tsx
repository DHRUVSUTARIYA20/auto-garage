import { useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Notification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read?: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: "welcome",
    title: "Keyboard shortcuts enabled",
    description: "Press \"/\" to jump to garage search. Use g → d to open your dashboard.",
    time: "Just now",
  },
  {
    id: "routing",
    title: "Smooth page transitions",
    description: "Pages now animate with subtle motion when you navigate.",
    time: "Today",
  },
  {
    id: "status",
    title: "Live system status",
    description: "Background 3D car and route loader are active on every page.",
    time: "Today",
  },
];

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      // Mark as read shortly after opening, so the badge fades out
      window.setTimeout(markAllRead, 400);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur hover:bg-accent/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open notifications"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Activity Center</p>
            <p className="text-[11px] text-muted-foreground">
              Recent system updates & tips.
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-wide"
            >
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="max-h-72">
          <div className="p-3 space-y-2">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="w-full text-left rounded-md border border-border/60 bg-background/60 hover:bg-accent/60 transition-colors px-3 py-2 flex gap-3 items-start"
              >
                <div className="mt-0.5">
                  {notification.read ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs font-semibold leading-snug">
                    {notification.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {notification.description}
                  </p>
                  <p className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                    <span>{notification.time}</span>
                    {!notification.read && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t px-3 py-2 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Shortcuts: <span className="font-semibold">/</span> search,{" "}
            <span className="font-semibold">g d</span> dashboard
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] px-2"
            onClick={markAllRead}
          >
            Mark all read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

