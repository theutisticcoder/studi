
import React from 'react';
import './ExamCard.css';

type ExamCardProps = {
  title: string;
  description: string;
};

const ExamCard: React.FC<ExamCardProps> = ({ title, description }) => (
  <div className="exam-card">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default ExamCard;
