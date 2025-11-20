
import React, { useEffect, useState } from 'react';
import './Exams.css';
import ExamCard from '../../components/ExamCard';
import { getRandomExams } from '../../services/mockExamService';

const Exams: React.FC = () => {
  const [exams, setExams] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getRandomExams();
      setExams(data);
    };
    load();
  }, []);

  return (
    <section className="exam-section">
      <h1>Practice Exams</h1>
      <div className="exam-grid">
        {exams.map((exam, idx) => (
          <ExamCard key={idx} title={exam} description={`Full-length ${exam} exam.`} />
        ))}
      </div>
    </section>
  );
};

export default Exams;
