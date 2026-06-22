import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { supabase } from "../../lib/supabaseClient";
import { getAuditLogs, type AuditLog } from "../../services/auditLogService";
import {
  addProfile,
  deleteProfile,
  getProfiles,
  updateProfile,
  type ProfileInput,
  type UserRole,
  type UserStatus,
} from "../../services/userService";

type Profile = ProfileInput & {
  id: string;
  created_at?: string;
};

type UserAccessSummary = {
  lastOpenedAt?: string;
  accessCount: number;
};

const emptyForm: ProfileInput = {
  full_name: "",
  email: "",
  role: "Viewer",
  status: "Active",
};

const roles: UserRole[] = ["Admin", "Staff", "Viewer"];
const statuses: UserStatus[] = ["Active", "Inactive"];

const Users = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<ProfileInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const accessByEmail = useMemo(() => {
    const summaries = new Map<string, UserAccessSummary>();

    auditLogs
      .filter(
        (log) =>
          log.module === "Access" &&
          log.action === "System Opened" &&
          log.description
      )
      .forEach((log) => {
        const emailMatch = log.description.match(/\(([^)@\s]+@[^)\s]+)\)/);
        const email = emailMatch?.[1]?.toLowerCase();

        if (!email) return;

        const current = summaries.get(email) || { accessCount: 0 };
        const currentLast = current.lastOpenedAt
          ? new Date(current.lastOpenedAt).getTime()
          : 0;
        const nextTime = new Date(log.created_at).getTime();

        summaries.set(email, {
          accessCount: current.accessCount + 1,
          lastOpenedAt:
            nextTime > currentLast ? log.created_at : current.lastOpenedAt,
        });
      });

    return summaries;
  }, [auditLogs]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      total: profiles.length,
      admins: profiles.filter((profile) => profile.role === "Admin").length,
      staff: profiles.filter((profile) => profile.role === "Staff").length,
      viewers: profiles.filter((profile) => profile.role === "Viewer").length,
      openedToday: profiles.filter((profile) => {
        const access = accessByEmail.get(profile.email.toLowerCase());
        return access?.lastOpenedAt
          ? new Date(access.lastOpenedAt).getTime() >= today.getTime()
          : false;
      }).length,
    };
  }, [accessByEmail, profiles]);

  const fetchProfiles = async () => {
    setLoading(true);
    const [{ data, error }, auditResponse] = await Promise.all([
      getProfiles(),
      getAuditLogs(),
    ]);

    if (error) {
      alert(error.message);
    } else {
      setProfiles((data as Profile[]) || []);
    }

    if (!auditResponse.error) {
      setAuditLogs(auditResponse.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();

    const refreshUsers = () => void fetchProfiles();

    const profilesChannel = supabase
      .channel(`stockflow-user-profiles-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        refreshUsers
      )
      .subscribe();

    const accessChannel = supabase
      .channel(`stockflow-user-access-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        refreshUsers
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(profilesChannel);
      void supabase.removeChannel(accessChannel);
    };
  }, []);

  const formatDateTime = (value?: string) => {
    if (!value) return "No app open recorded yet";

    return new Date(value).toLocaleString();
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const payload: ProfileInput = {
      ...form,
      full_name: form.full_name.trim(),
      email: form.email.trim(),
    };

    const { error } = editingId
      ? await updateProfile(editingId, payload)
      : await addProfile(payload);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    setShowSavedModal(true);
    fetchProfiles();
  };

  const handleEdit = (profile: Profile) => {
    setEditingId(profile.id);
    setForm({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    const { error } = await deleteProfile(deleteId);

    if (error) {
      alert(error.message);
      return;
    }

    setDeleteId(null);
    fetchProfiles();
  };

  if (loading) {
    return <div className="loader">Loading users...</div>;
  }

  return (
    <section className="users-page">
      <PageHeader
        title="Users"
        description="Track registered users, roles, and recent system access."
      />

      <div className="user-stats-grid">
        <article className="user-stat-card">
          <span>Total Users</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="user-stat-card">
          <span>Admins</span>
          <strong>{stats.admins}</strong>
        </article>
        <article className="user-stat-card">
          <span>Staff</span>
          <strong>{stats.staff}</strong>
        </article>
        <article className="user-stat-card">
          <span>Viewers</span>
          <strong>{stats.viewers}</strong>
        </article>
        <article className="user-stat-card">
          <span>Opened Today</span>
          <strong>{stats.openedToday}</strong>
        </article>
      </div>

      <div className="users-layout">
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit User Role" : "Add User Profile"}</h3>

          <label>
            Full Name
            <input
              type="text"
              value={form.full_name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  full_name: event.target.value,
                }))
              }
              placeholder="Full name"
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="user@company.com"
              required
            />
          </label>

          <label>
            Role
            <select
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  role: event.target.value as UserRole,
                }))
              }
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as UserStatus,
                }))
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Save User"}
          </button>

          {editingId && (
            <button type="button" className="secondary-btn" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </form>

        <div className="users-panel">
          <div className="users-panel-header">
            <div>
              <h3>User List</h3>
              <p>
                Admins can see registered profiles and recent app access.
              </p>
            </div>
          </div>

          <div className="users-list">
            {profiles.length === 0 ? (
              <div className="empty-cell">
                No profiles found. Add your first admin profile in Supabase if
                this app has no admin yet.
              </div>
            ) : (
              profiles.map((profile) => (
                <article className="user-profile-card" key={profile.id}>
                  <div className="user-profile-main">
                    <div>
                      <h4>{profile.full_name || "Unnamed User"}</h4>
                      <p>{profile.email}</p>
                    </div>

                    <div className="user-tracking-meta">
                      <span>
                        Registered: {formatDateTime(profile.created_at)}
                      </span>
                      <span>
                        Last opened:{" "}
                        {formatDateTime(
                          accessByEmail.get(profile.email.toLowerCase())
                            ?.lastOpenedAt
                        )}
                      </span>
                      <span>
                        System opens:{" "}
                        {accessByEmail.get(profile.email.toLowerCase())
                          ?.accessCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="user-role-pills">
                    <span className="badge success">{profile.role}</span>
                    <span
                      className={
                        profile.status === "Active"
                          ? "badge success"
                          : "badge danger"
                      }
                    >
                      {profile.status}
                    </span>
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => handleEdit(profile)}
                    >
                      Edit Role
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => setDeleteId(profile.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <SuccessModal
        show={showSavedModal}
        title="User Saved"
        message="The user profile and role were saved successfully."
        confirmText="Okay"
        onClose={() => setShowSavedModal(false)}
      />

      <SuccessModal
        show={!!deleteId}
        type="warning"
        title="Delete User Profile?"
        message="This removes the profile record from the app. It does not delete the Supabase Auth account."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default Users;
