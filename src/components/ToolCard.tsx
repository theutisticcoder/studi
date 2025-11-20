
import React from 'react';
import './ToolCard.css';

type ToolCardProps = {
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, children }) => {
  return (
    <div className="tool-card">
      <div className="tool-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children && <div className="tool-children">{children}</div>}
    </div>
  );
};

export default ToolCard;
