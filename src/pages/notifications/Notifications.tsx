import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { useProducts } from "../../hooks/useProducts";
import {
  addNotification,
  deleteNotification,
  getNotifications,
  updateNotificationStatus,
  type NotificationStatus,
} from "../../services/notificationService";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  status: NotificationStatus;
  created_at: string;
};

const Notifications = () => {
  const { products } = useProducts();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("ALL");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
  });

  const lowStockProducts = products.filter(
    (item) => item.quantity <= item.low_stock_limit
  );

  const fetchNotifications = async () => {
    const { data, error } = await getNotifications();

    if (error) {
      alert(error.message);
      return;
    }

    setNotifications(data || []);
  };

  useEffect(() => {
    const loadNotifications = async () => {
      await fetchNotifications();
    };

    loadNotifications();
  }, []);

  const generateLowStockAlerts = async () => {
    if (lowStockProducts.length === 0) {
      setModal({
        show: true,
        title: "No Low Stock Items",
        message: "All products are currently above their low stock limit.",
      });
      return;
    }

    for (const product of lowStockProducts) {
      await addNotification({
        title: "Low Stock Alert",
        message: `${product.name} is low on stock. Current quantity: ${product.quantity}.`,
        type: "warning",
        status: "Unread",
      });
    }

    await fetchNotifications();

    setModal({
      show: true,
      title: "Alerts Generated",
      message: "Low stock notifications were successfully created.",
    });
  };

  const toggleStatus = async (notification: Notification) => {
    const newStatus = notification.status === "Unread" ? "Read" : "Unread";

    const { error } = await updateNotificationStatus(notification.id, newStatus);

    if (error) {
      alert(error.message);
      return;
    }

    fetchNotifications();
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const { error } = await deleteNotification(deleteId);

    if (error) {
      alert(error.message);
      return;
    }

    setDeleteId(null);
    setShowDeleteConfirm(false);
    fetchNotifications();

    setModal({
      show: true,
      title: "Notification Deleted",
      message: "The notification was successfully deleted.",
    });
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  const unreadCount = notifications.filter((item) => item.status === "Unread").length;

  return (
    <section className="notifications-page">
      <div className="notification-header-row">
        <PageHeader
          title="Notifications"
          description="Monitor low stock alerts and system messages."
        />

        <button className="generate-alert-btn" onClick={generateLowStockAlerts}>
          Generate Low Stock Alerts
        </button>
      </div>

      <div className="notification-stats-grid">
        <div className="notification-stat-card">
          <span>Total Notifications</span>
          <strong>{notifications.length}</strong>
        </div>

        <div className="notification-stat-card warning">
          <span>Unread Alerts</span>
          <strong>{unreadCount}</strong>
        </div>

        <div className="notification-stat-card danger">
          <span>Low Stock Products</span>
          <strong>{lowStockProducts.length}</strong>
        </div>
      </div>

      <div className="notification-tools">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="ALL">All Notifications</option>
          <option value="Unread">Unread Only</option>
          <option value="Read">Read Only</option>
        </select>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="content-card">No notifications found.</div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              className={`notification-item ${
                item.status === "Unread" ? "unread" : ""
              }`}
              key={item.id}
            >
              <div className="notification-icon">
                {item.type === "warning" ? "!" : "i"}
              </div>

              <div className="notification-content">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                <small>{new Date(item.created_at).toLocaleString()}</small>
              </div>

              <div className="notification-actions">
                <button
                  type="button"
                  className="primary-link"
                  onClick={() => toggleStatus(item)}
                >
                  Mark as {item.status === "Unread" ? "Read" : "Unread"}
                </button>

                <button
                  type="button"
                  className="danger-btn category-delete-btn"
                  onClick={() => openDeleteModal(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <SuccessModal
        show={showDeleteConfirm}
        type="warning"
        title="Delete Notification?"
        message="Are you sure you want to delete this notification?"
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />

      <SuccessModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        onClose={() =>
          setModal({
            show: false,
            title: "",
            message: "",
          })
        }
      />
    </section>
  );
};

export default Notifications;