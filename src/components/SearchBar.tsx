
import React from 'react';
import './SearchBar.css';

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search…', value, onChange }) => {
  return (
    <input
      type="text"
      className="search-bar"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
};

export default SearchBar;
