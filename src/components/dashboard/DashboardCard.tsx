type DashboardCardProps = {
  title: string;
  value: string | number;
  note?: string;
};

const DashboardCard = ({ title, value, note }: DashboardCardProps) => {
  return (
    <div className="dashboard-card">
      <p>{title}</p>
      <h3>{value}</h3>
      {note && <span>{note}</span>}
    </div>
  );
};

export default DashboardCard;