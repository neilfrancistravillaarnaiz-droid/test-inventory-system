import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Permission } from "../constants/permissions";
import { useCurrentProfile } from "../hooks/useCurrentProfile";

type Props = {
  permission: Permission;
  children: ReactNode;
};

const RequirePermission = ({ permission, children }: Props) => {
  const { loading, can } = useCurrentProfile();

  if (loading) {
    return <div className="loader">Checking permissions...</div>;
  }

  if (!can(permission)) {
    return (
      <section className="access-denied-card">
        <span>Restricted area</span>
        <h2>Access denied</h2>
        <p>
          Your current role does not have permission to open this page. Please
          contact an administrator if you need access.
        </p>
        <Link className="primary-link" to="/dashboard">
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return <>{children}</>;
};

export default RequirePermission;
