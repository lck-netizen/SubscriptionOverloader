import { useEffect, useState } from "react";
import { notifications } from "@/services/notificationService";
import { toast } from "sonner";
import NotificationList from "@/components/notifications/NotificationList";
import { CheckCheck } from "lucide-react";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await notifications.getAll();
      setItems(data.notifications || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notifications.markAllAsRead();
      loadItems();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notifications.delete(id);
      loadItems();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-eyebrow">Notifications</div>
          <h2 className="mt-1 font-[Work_Sans] text-xl font-semibold tracking-tight sm:text-2xl">
            What we've been tracking
          </h2>
        </div>
        <button onClick={markAllAsRead} className="btn-ghost inline-flex items-center gap-2" data-testid="mark-all-read-button">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      <NotificationList
        items={items}
        loading={loading}
        onDelete={deleteNotification}
      />
    </div>
  );
}
