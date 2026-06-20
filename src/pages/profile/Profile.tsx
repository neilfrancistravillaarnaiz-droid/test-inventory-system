import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import { useCurrentProfile } from "../../hooks/useCurrentProfile";
import { updateProfile, type ProfileInput } from "../../services/userService";
import { ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import {
  deleteStoredImage,
  uploadProfileImage,
} from "../../services/storageService";

const DEFAULT_AVATAR = "https://i.pravatar.cc/120?img=12";

const Profile = () => {
  const { session, profile, role, loading } = useCurrentProfile();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [photoSaving, setPhotoSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setAvatarPreview(session?.user.user_metadata?.avatar_url || DEFAULT_AVATAR);
  }, [profile, session]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      alert("Please choose an image file that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfilePhoto = async () => {
    if (!avatarFile || !session?.user) return;

    setPhotoSaving(true);
    const previousUrl = session.user.user_metadata?.avatar_url as string | undefined;
    const { imageUrl, error: uploadError } = await uploadProfileImage(avatarFile);

    if (uploadError || !imageUrl) {
      setPhotoSaving(false);
      alert(uploadError?.message || "Unable to upload the profile picture.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: imageUrl },
    });

    if (error) {
      await deleteStoredImage(imageUrl);
      setPhotoSaving(false);
      alert(error.message);
      return;
    }

    await deleteStoredImage(previousUrl);
    setAvatarFile(null);
    setAvatarPreview(imageUrl);
    setPhotoSaving(false);
    setShowSuccess(true);
  };

  const removeProfilePhoto = async () => {
    if (!session?.user) return;

    setPhotoSaving(true);
    const previousUrl = session.user.user_metadata?.avatar_url as string | undefined;
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: null },
    });

    if (error) {
      setPhotoSaving(false);
      alert(error.message);
      return;
    }

    await deleteStoredImage(previousUrl);
    setAvatarFile(null);
    setAvatarPreview(DEFAULT_AVATAR);
    setPhotoSaving(false);
    setShowSuccess(true);
  };

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

          <div className="profile-photo-editor">
            <img src={avatarPreview} alt="Profile preview" />
            <div className="media-upload-actions">
              <label className="media-upload-button">
                <ImagePlus size={17} aria-hidden="true" />
                {avatarFile ? "Choose Another" : "Change Picture"}
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>

              {avatarFile && (
                <button
                  type="button"
                  className="media-save-button"
                  onClick={saveProfilePhoto}
                  disabled={photoSaving}
                >
                  {photoSaving ? "Uploading..." : "Save Picture"}
                </button>
              )}

              {(avatarFile || session?.user.user_metadata?.avatar_url) && (
                <button
                  type="button"
                  className="media-remove-button"
                  onClick={removeProfilePhoto}
                  disabled={photoSaving}
                >
                  <Trash2 size={17} aria-hidden="true" />
                  Remove Picture
                </button>
              )}
              <small>JPG, PNG, or WebP. Maximum 5 MB.</small>
            </div>
          </div>

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
          <img className="profile-summary-avatar" src={avatarPreview} alt="Profile" />
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
