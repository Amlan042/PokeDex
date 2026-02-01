// FlavorTextSection.jsx - Display Pokedex entries from different game versions
import React, { useState, useEffect } from 'react';
import { fetchAllFlavorText } from '../Pokemon';

// Game version styling
const versionStyles = {
  red: { color: '#FF1111', icon: '🔴' },
  blue: { color: '#1111FF', icon: '🔵' },
  yellow: { color: '#FFD700', icon: '⚡' },
  gold: { color: '#DAA520', icon: '🌟' },
  silver: { color: '#C0C0C0', icon: '🌙' },
  crystal: { color: '#4FD9FF', icon: '💎' },
  ruby: { color: '#A00000', icon: '💎' },
  sapphire: { color: '#0000A0', icon: '💎' },
  emerald: { color: '#00A000', icon: '💚' },
  firered: { color: '#FF7327', icon: '🔥' },
  leafgreen: { color: '#00DD00', icon: '🍃' },
  diamond: { color: '#AAAAFF', icon: '💠' },
  pearl: { color: '#FFAAAA', icon: '🔮' },
  platinum: { color: '#999999', icon: '⚪' },
  heartgold: { color: '#B69E00', icon: '❤️' },
  soulsilver: { color: '#C0C0E1', icon: '🤍' },
  black: { color: '#444444', icon: '⚫' },
  white: { color: '#E1E1E1', icon: '⬜' },
  'black-2': { color: '#424B50', icon: '⚫' },
  'white-2': { color: '#E3CED0', icon: '⬜' },
  x: { color: '#025DA6', icon: '❌' },
  y: { color: '#EA1A3E', icon: '🔴' },
  'omega-ruby': { color: '#CF3025', icon: '🔶' },
  'alpha-sapphire': { color: '#26649C', icon: '🔷' },
  sun: { color: '#F1912B', icon: '☀️' },
  moon: { color: '#5599CA', icon: '🌙' },
  'ultra-sun': { color: '#E95B2B', icon: '🌅' },
  'ultra-moon': { color: '#226DB5', icon: '🌕' },
  'lets-go-pikachu': { color: '#F5DA Pokemon26', icon: '⚡' },
  'lets-go-eevee': { color: '#D4924B', icon: '🦊' },
  sword: { color: '#00A1E9', icon: '⚔️' },
  shield: { color: '#BF004F', icon: '🛡️' },
  'legends-arceus': { color: '#36597B', icon: '🌟' },
  scarlet: { color: '#F34824', icon: '🔴' },
  violet: { color: '#8334B0', icon: '🟣' },
};

const FlavorTextSection = ({ pokemonId, initialFlavorText }) => {
  const [flavorTexts, setFlavorTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadFlavorTexts = async () => {
      if (!pokemonId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const texts = await fetchAllFlavorText(pokemonId);
        setFlavorTexts(texts);
        if (texts.length > 0) {
          setSelectedVersion(texts[0].version);
        }
      } catch (error) {
        console.error('Error loading flavor texts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlavorTexts();
  }, [pokemonId]);

  if (loading) {
    return (
      <div className="flavor-text-section">
        <h4 className="section-label">
          <span className="label-icon">📖</span>
          Pokédex Entries
        </h4>
        <div className="flavor-loading">
          <div className="loading-spinner small"></div>
          <span>Loading entries...</span>
        </div>
      </div>
    );
  }

  if (flavorTexts.length === 0) {
    return null;
  }

  const displayTexts = showAll ? flavorTexts : flavorTexts.slice(0, 6);
  const selectedEntry = flavorTexts.find(f => f.version === selectedVersion) || flavorTexts[0];
  const versionStyle = versionStyles[selectedVersion] || { color: '#888', icon: '📘' };

  return (
    <div className="flavor-text-section">
      <h4 className="section-label">
        <span className="label-icon">📖</span>
        Pokédex Entries
      </h4>
      
      {/* Featured entry */}
      <div className="featured-entry" style={{ '--version-color': versionStyle.color }}>
        <div className="entry-version-badge">
          <span className="version-icon">{versionStyle.icon}</span>
          <span className="version-name">{selectedVersion?.replace(/-/g, ' ')}</span>
        </div>
        <p className="entry-text">{selectedEntry.text}</p>
      </div>
      
      {/* Version selector */}
      <div className="version-selector">
        <span className="selector-label">Other Versions:</span>
        <div className="version-pills">
          {displayTexts.map(entry => {
            const style = versionStyles[entry.version] || { color: '#888', icon: '📘' };
            return (
              <button
                key={entry.version}
                className={`version-pill ${selectedVersion === entry.version ? 'active' : ''}`}
                onClick={() => setSelectedVersion(entry.version)}
                style={{ '--pill-color': style.color }}
              >
                <span className="pill-icon">{style.icon}</span>
                <span className="pill-name">{entry.version.replace(/-/g, ' ')}</span>
              </button>
            );
          })}
        </div>
        
        {flavorTexts.length > 6 && (
          <button 
            className="show-all-versions"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `Show All (${flavorTexts.length})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default FlavorTextSection;
