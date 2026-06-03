import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { getAuditLogs } from "../../services/auditLogService";

type AuditLog = {
  id: string;
  action: string;
  module: string;
  description: string;
  created_at: string;
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await getAuditLogs();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.module.toLowerCase().includes(search.toLowerCase());

    const matchesModule =
      filterModule === "ALL" || log.module === filterModule;

    return matchesSearch && matchesModule;
  });

  const modules = Array.from(new Set(logs.map((log) => log.module)));

  if (loading) {
    return <div className="loader">Loading audit logs...</div>;
  }

  return (
    <section className="audit-page">
      <PageHeader
        title="Audit Logs"
        description="Track activities and important system changes."
      />

      <div className="audit-tools">
        <input
          type="text"
          placeholder="Search action, module, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
        >
          <option value="ALL">All Modules</option>
          {modules.map((module) => (
            <option key={module} value={module}>
              {module}
            </option>
          ))}
        </select>
      </div>

      <div className="audit-timeline">
        {filteredLogs.length === 0 ? (
          <div className="content-card">No audit logs found.</div>
        ) : (
          filteredLogs.map((log) => (
            <div className="audit-item" key={log.id}>
              <div className="audit-dot" />

              <div className="audit-content">
                <span>{log.module}</span>
                <h3>{log.action}</h3>
                <p>{log.description}</p>
                <small>{new Date(log.created_at).toLocaleString()}</small>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default AuditLogs;