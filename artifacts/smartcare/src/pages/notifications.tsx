import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle, Calendar, Pill, CreditCard, AlertTriangle } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  APPOINTMENT: Calendar,
  PRESCRIPTION: Pill,
  BILLING: CreditCard,
  SYSTEM_ERROR: AlertTriangle,
};

const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT: "bg-blue-100 text-blue-800",
  PRESCRIPTION: "bg-green-100 text-green-800",
  BILLING: "bg-amber-100 text-amber-800",
  SYSTEM_ERROR: "bg-red-100 text-red-800",
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications({});

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() })
    }
  });

  const unreadCount = (notifications ?? []).filter((n: any) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : "All caught up!"}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      )}

      {!isLoading && (notifications ?? []).length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      )}

      <div className="space-y-2">
        {(notifications ?? []).map((n: any) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          return (
            <Card key={n.notificationId} className={`transition-all ${n.isRead ? "opacity-70" : "border-primary/20 shadow-sm"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[n.type] ?? "bg-muted"} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{n.type}</Badge>
                      <Badge variant="secondary" className="text-xs">{n.channel}</Badge>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.sentAt ? new Date(n.sentAt).toLocaleString() : ""}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1 shrink-0"
                      onClick={() => markReadMutation.mutate({ id: n.notificationId })}
                      disabled={markReadMutation.isPending}
                    >
                      <CheckCircle className="w-3 h-3" />
                      Mark read
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
