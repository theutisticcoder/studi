
import React from 'react';
import './Home.css';
import Chat from '../chat/Chat';

const Home: React.FC = () => {
  return (
    <section className="home-section">
      <h1>Welcome to StudySphere</h1>
      <p>Your free AI-powered study companion.</p>

      <section className="welcome-card">
        <h2>Explore AI Tools</h2>
        <p>Use our suite of AI assistants for concept explanations, problem solving, and instant feedback.</p>
      </section>

      <section className="welcome-card">
        <h2>Practice Exams</h2>
        <p>Take full-length, fully graded practice exams for all 36 AP subjects.</p>
      </section>

      <Chat />
    </section>
  );
};

export default Home;
