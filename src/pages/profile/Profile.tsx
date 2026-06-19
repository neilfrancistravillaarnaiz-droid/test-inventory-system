import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import { updateProfile, type ProfileInput } from "../../services/userService";

const Profile = () => {
  const { profile, role, loading } = useCurrentProfile();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || "");
  }, [profile]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) return;

    setSaving(true);

    const payload: ProfileInput = {
      full_name: fullName.trim() || profile.email || "StockFlow User",
      email: profile.email || "",
      role,
      status: profile.status || "Active",
    };

    const { error } = await updateProfile(profile.id, payload);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setShowSuccess(true);
  };

  if (loading) {
    return <div className="loader">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <section className="profile-page">
        <PageHeader
          title="My Profile"
          description="Your signed-in account does not have a profile row yet."
        />

        <div className="content-card">
          <p>
            Ask an admin to create a profile for your email in the Users page,
            or add it in the Supabase profiles table.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <PageHeader
        title="My Profile"
        description="View your identity, role, and account status."
      />

      <div className="settings-layout profile-layout">
        <form className="settings-form profile-form" onSubmit={handleSave}>
          <h3>Profile Information</h3>

          <div className="settings-grid">
            <div className="form-field full-field">
              <label>Full Name</label>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <input value={profile.email || ""} readOnly />
            </div>

            <div className="form-field">
              <label>Role</label>
              <input value={role} readOnly />
            </div>

            <div className="form-field">
              <label>Status</label>
              <input value={profile.status || "Active"} readOnly />
            </div>
          </div>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <aside className="settings-preview profile-summary">
          <span>Account Access</span>
          <h3>{fullName || profile.email || "StockFlow User"}</h3>
          <p>{profile.email}</p>

          <div className="settings-preview-box">
            <strong>Current Role</strong>
            <p>{role}</p>
          </div>

          <div className="settings-preview-box">
            <strong>Account Status</strong>
            <p>{profile.status || "Active"}</p>
          </div>

          <div className="settings-preview-box">
            <strong>Permission Note</strong>
            <p>
              Admins can change roles from the Users page. This page is for
              your own profile details.
            </p>
          </div>
        </aside>
      </div>

      <SuccessModal
        show={showSuccess}
        title="Profile Updated"
        message="Your profile information was saved successfully."
        confirmText="Okay"
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default Profile;
