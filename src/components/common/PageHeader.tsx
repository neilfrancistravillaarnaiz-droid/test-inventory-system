type PageHeaderProps = {
  title: string;
  description: string;
};

const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default PageHeader;