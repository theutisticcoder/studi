
import React from 'react';
import './NavBar.css';

type NavBarProps = {
  currentPage: number;
  setPage: (page: number) => void;
};

const NavBar: React.FC<NavBarProps> = ({ currentPage, setPage }) => {
  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li className={currentPage === 0 ? 'active' : ''} onClick={() => setPage(0)}>Home</li>
        <li className={currentPage === 1 ? 'active' : ''} onClick={() => setPage(1)}>Tools</li>
        <li className={currentPage === 2 ? 'active' : ''} onClick={() => setPage(2)}>Exams</li>
      </ul>
    </nav>
  );
};

export default NavBar;
