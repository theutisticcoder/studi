
import React, { useState } from 'react';
import './Tools.css';
import ToolCard from '../../components/ToolCard';
import SearchBar from '../../components/SearchBar';
import { useLatex } from '../../hooks/useLatex';

// Sample tool definitions
const toolDefinitions = [
  {
    id: 'concept-explorer',
    title: 'Concept Explorer',
    description: 'Explain any concept in plain language and math.',
    icon: '🔍',
  },
  {
    id: 'problem-solver',
    title: 'Problem Solver',
    description: 'Solve mathematical expressions and show LaTeX step-by-step.',
    icon: '➗',
  },
  {
    id: 'essay-assistant',
    title: 'Essay Assistant',
    description: 'Draft, edit, and analyze essays with AI.',
    icon: '📝',
  },
];

const Tools: React.FC = () => {
  const [search, setSearch] = useState('');
  const { render } = useLatex();

  const filtered = toolDefinitions.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="tools-section">
      <h1>AI Study Tools</h1>
      <SearchBar placeholder="Search tools…" value={search} onChange={setSearch} />
      <div className="tools-grid">
        {filtered.map(tool => (
          <ToolCard key={tool.id} icon={tool.icon} title={tool.title} description={tool.description}>
            <div dangerouslySetInnerHTML={{ __html: render('E=mc^2') }} />
          </ToolCard>
        ))}
      </div>
    </section>
  );
};

export default Tools;
