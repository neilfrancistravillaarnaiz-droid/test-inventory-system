import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import SuccessModal from "../../components/common/SuccessModal";
import {
  getSettings,
  updateSettings,
  type AppSettings,
  type AppSettingsInput,
} from "../../services/settingsService";

const Settings = () => {
  const [settingsId, setSettingsId] = useState("");
  const [form, setForm] = useState<AppSettingsInput>({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    currency: "PHP",
    default_low_stock_limit: 5,
    theme: "Glass Dark",
  });

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchSettings = async () => {
    const { data, error } = await getSettings();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const settings = data as AppSettings;

    setSettingsId(settings.id);
    setForm({
      company_name: settings.company_name || "",
      company_email: settings.company_email || "",
      company_phone: settings.company_phone || "",
      company_address: settings.company_address || "",
      currency: settings.currency || "PHP",
      default_low_stock_limit: settings.default_low_stock_limit || 5,
      theme: settings.theme || "Glass Dark",
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "default_low_stock_limit" ? Number(value) : value,
    });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!settingsId) {
      alert("Settings ID not found.");
      return;
    }

    const { error } = await updateSettings(settingsId, form);

    if (error) {
      alert(error.message);
      return;
    }

    setShowSuccess(true);
  };

  if (loading) {
    return <div className="loader">Loading settings...</div>;
  }

  return (
    <section className="settings-page">
      <PageHeader
        title="Settings"
        description="Configure system preferences and company information."
      />

      <div className="settings-layout">
        <form className="settings-form" onSubmit={handleSaveSettings}>
          <h3>Company Information</h3>

          <div className="settings-grid">
            <div className="form-field">
              <label>Company Name</label>
              <input
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Company Email</label>
              <input
                name="company_email"
                type="email"
                value={form.company_email}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Company Phone</label>
              <input
                name="company_phone"
                value={form.company_phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="PHP">PHP - Philippine Peso</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div className="form-field full-field">
              <label>Company Address</label>
              <textarea
                name="company_address"
                value={form.company_address}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3>Inventory Preferences</h3>

          <div className="settings-grid">
            <div className="form-field">
              <label>Default Low Stock Limit</label>
              <input
                name="default_low_stock_limit"
                type="number"
                min={1}
                value={form.default_low_stock_limit}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label>Theme</label>
              <select
                name="theme"
                value={form.theme}
                onChange={handleChange}
              >
                <option value="Glass Dark">Glass Dark</option>
                <option value="Simple Light">Simple Light</option>
                <option value="Professional Blue">Professional Blue</option>
              </select>
            </div>
          </div>

          <button type="submit">Save Settings</button>
        </form>

        <div className="settings-preview">
          <span>Live Preview</span>
          <h3>{form.company_name}</h3>
          <p>{form.company_email}</p>
          <p>{form.company_phone}</p>
          <p>{form.company_address}</p>

          <div className="settings-preview-box">
            <strong>Currency</strong>
            <p>{form.currency}</p>
          </div>

          <div className="settings-preview-box">
            <strong>Low Stock Limit</strong>
            <p>{form.default_low_stock_limit}</p>
          </div>

          <div className="settings-preview-box">
            <strong>Theme</strong>
            <p>{form.theme}</p>
          </div>
        </div>
      </div>

      <SuccessModal
        show={showSuccess}
        title="Settings Updated"
        message="Your system settings were saved successfully."
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
};

export default Settings;