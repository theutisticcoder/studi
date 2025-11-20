
import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Home from './features/home/Home';
import Tools from './features/tools/Tools';
import Exams from './features/exams/Exams';
import './App.css';

enum Page {
  Home,
  Tools,
  Exams,
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);

  const renderPage = () => {
    switch (currentPage) {
      case Page.Tools:
        return <Tools />;
      case Page.Exams:
        return <Exams />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="app-wrapper">
      <NavBar currentPage={currentPage} setPage={setCurrentPage} />
      <main className="main-content">{renderPage()}</main>
    </div>
  );
}

export default App;
