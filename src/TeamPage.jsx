// TeamPage.jsx - Team builder page
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTeam, MAX_TEAM_SIZE, NATURES } from './context/TeamContext';
import { useFavorites } from './context/FavoritesContext';
import { typeColors, getTypeGradient } from './utils/typeColors';
import TeamAnalysis from './components/TeamAnalysis';
import PokemonBuildEditor from './components/PokemonBuildEditor';
import PokemonSearchInput from './components/PokemonSearchInput';
import { fetchPokemonWithEvolution } from './Pokemon';

// Enhanced Team Member Card
const TeamMemberCard = ({ pokemon, index, onRemove, onEdit, onReorder }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const primaryType = pokemon.type || pokemon.types?.[0] || 'normal';
  const secondaryType = pokemon.types?.[1];
  const natureName = NATURES[pokemon.nature]?.name || 'Hardy';
  const hasMoves = pokemon.moves?.some(m => m);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(pokemon.id);
    }, 300);
  };

  return (
    <div
      className={`team-member-card ${isRemoving ? 'removing' : ''}`}
      style={{
        '--card-gradient': getTypeGradient(primaryType),
        '--type-color': typeColors[primaryType]?.primary || typeColors.normal.primary,
        '--type-color-secondary': secondaryType 
          ? typeColors[secondaryType]?.primary 
          : typeColors[primaryType]?.secondary,
        '--animation-delay': `${index * 0.1}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-shine"></div>
      
      <div className="slot-number">{index + 1}</div>
      
      <div className={`card-actions ${isHovered ? 'visible' : ''}`}>
        <button 
          className="edit-member-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(pokemon); }}
          title="Edit build"
          aria-label="Edit build"
        >
          ⚙️
        </button>
        <button 
          className="remove-member-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(); }}
          title="Remove from team"
          aria-label="Remove from team"
        >
          ✕
        </button>
      </div>
      
      <Link to={`/info?pokemon=${pokemon.name}`} className="card-link">
        <div className="member-image-container">
          <div className="pokemon-glow"></div>
          <img 
            src={pokemon.image || pokemon.sprite} 
            alt={pokemon.name}
            className={isHovered ? 'hovered' : ''}
          />
        </div>
        
        <div className="member-info">
          {pokemon.nickname && <p className="pokemon-nickname">{pokemon.nickname}</p>}
          <p className="pokemon-name">{pokemon.name}</p>
          <p className="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</p>
          
          <div className="pokemon-types-container">
            {pokemon.types?.map(type => (
              <span 
                key={type} 
                className={`pokemon-type type-${type}`}
                style={{ '--type-bg': typeColors[type]?.primary }}
              >
                {type}
              </span>
            ))}
          </div>
          
          {/* Build info summary */}
          <div className="build-summary">
            <span className="nature-badge">{natureName}</span>
            {pokemon.item && <span className="item-badge">📦 {pokemon.item}</span>}
            {hasMoves && <span className="moves-badge">⚔️ {pokemon.moves.filter(m => m).length}/4</span>}
          </div>
        </div>
      </Link>
    </div>
  );
};

// Empty Team Slot
const EmptySlot = ({ index, onClick }) => (
  <div 
    className="team-slot-empty clickable"
    style={{ '--animation-delay': `${index * 0.1}s` }}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
  >
    <div className="empty-slot-content">
      <div className="empty-icon">
        <span className="plus-icon">+</span>
      </div>
      <p className="slot-label">Slot {index + 1}</p>
      <p className="slot-hint">Click to add</p>
    </div>
  </div>
);

// Add Pokemon Modal
const AddPokemonModal = ({ onClose, onAdd }) => {
  const { favorites } = useFavorites();
  const { isOnTeam } = useTeam();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const availableFavorites = favorites.filter(p => !isOnTeam(p.id));

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSearch = async (query) => {
    if (!query || !query.trim()) return;
    
    setLoading(true);
    setError('');
    setSearchResult(null);
    
    try {
      const pokemon = await fetchPokemonWithEvolution(query.trim());
      setSearchResult(pokemon);
    } catch (err) {
      setError(err.message || 'Pokemon not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (pokemonName) => {
    setSearchQuery(pokemonName);
    handleSearch(pokemonName);
  };

  const handleAddPokemon = (pokemon) => {
    onAdd(pokemon);
    onClose();
  };

  return (
    <div className="add-pokemon-modal-overlay" onClick={onClose}>
      <div className="add-pokemon-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>➕ Add Pokémon to Team</h2>
          <p className="modal-subtitle">Search or pick from favorites</p>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <span>🔍</span> Search
          </button>
          <button 
            className={`modal-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <span>❤️</span> Favorites ({availableFavorites.length})
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'search' ? (
            <div className="search-tab">
              <div className="modal-search-box">
                <PokemonSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSelect={handleSelect}
                  onSubmit={() => handleSearch(searchQuery)}
                  placeholder="Enter Pokémon name or ID..."
                  className="modal-search-input"
                />
                <button 
                  className="modal-search-btn"
                  onClick={() => handleSearch(searchQuery)}
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? '...' : '🔍'}
                </button>
              </div>

              {error && (
                <div className="modal-error">
                  <span>😢</span> {error}
                </div>
              )}

              {loading && (
                <div className="modal-loading">
                  <div className="mini-pokeball-loader"></div>
                  <p>Searching...</p>
                </div>
              )}

              {searchResult && !loading && (
                <div className="search-result-card">
                  <div 
                    className="result-pokemon"
                    style={{ '--type-color': typeColors[searchResult.types?.[0]]?.primary || '#888' }}
                  >
                    <img src={searchResult.image} alt={searchResult.name} />
                    <div className="result-info">
                      <h3>{searchResult.name}</h3>
                      <p className="result-id">#{String(searchResult.id).padStart(3, '0')}</p>
                      <div className="result-types">
                        {searchResult.types?.map(type => (
                          <span key={type} className={`type-badge type-${type}`}>{type}</span>
                        ))}
                      </div>
                    </div>
                    <button 
                      className="add-result-btn"
                      onClick={() => handleAddPokemon(searchResult)}
                      disabled={isOnTeam(searchResult.id)}
                    >
                      {isOnTeam(searchResult.id) ? 'Already on Team' : '➕ Add to Team'}
                    </button>
                  </div>
                </div>
              )}

              {!searchResult && !loading && !error && (
                <div className="search-placeholder">
                  <span className="placeholder-icon">🔎</span>
                  <p>Search for any Pokémon by name or Pokédex number</p>
                </div>
              )}
            </div>
          ) : (
            <div className="favorites-tab">
              {availableFavorites.length === 0 ? (
                <div className="no-favorites">
                  <span>💔</span>
                  <p>No available favorites</p>
                  <span className="hint">Add some Pokémon to favorites first, or they're already on your team!</span>
                </div>
              ) : (
                <div className="favorites-grid">
                  {availableFavorites.map(pokemon => (
                    <button
                      key={pokemon.id}
                      className="favorite-option"
                      onClick={() => handleAddPokemon(pokemon)}
                      style={{ '--type-color': typeColors[pokemon.types?.[0]]?.primary || '#888' }}
                    >
                      <img src={pokemon.image || pokemon.sprite} alt={pokemon.name} />
                      <span className="fav-name">{pokemon.name}</span>
                      <span className="fav-id">#{String(pokemon.id).padStart(3, '0')}</span>
                      <span className="add-icon">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick Add from Favorites
const QuickAddSection = ({ onAddToTeam }) => {
  const { favorites } = useFavorites();
  const { isOnTeam, isFull } = useTeam();
  
  const availableFavorites = favorites.filter(p => !isOnTeam(p.id)).slice(0, 6);
  
  if (availableFavorites.length === 0 || isFull) return null;
  
  return (
    <div className="quick-add-section">
      <h3>⚡ Quick Add from Favorites</h3>
      <div className="quick-add-grid">
        {availableFavorites.map(pokemon => (
          <button
            key={pokemon.id}
            className="quick-add-btn"
            onClick={() => onAddToTeam(pokemon)}
            style={{
              '--type-color': typeColors[pokemon.types?.[0]]?.primary || typeColors.normal.primary
            }}
          >
            <img src={pokemon.image || pokemon.sprite} alt={pokemon.name} />
            <span className="quick-add-name">{pokemon.name}</span>
            <span className="quick-add-icon">+</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const TeamPage = () => {
  const { team, removeFromTeam, clearTeam, teamSize, addToTeam, teamAnalysis, exportToShowdown, isFull } = useTeam();
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [editingPokemon, setEditingPokemon] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [exportText, setExportText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Create array with team members and empty slots
  const teamSlots = [...team];
  while (teamSlots.length < MAX_TEAM_SIZE) {
    teamSlots.push(null);
  }

  // Get team types for display
  const teamTypes = useMemo(() => {
    const types = {};
    team.forEach(pokemon => {
      pokemon.types?.forEach(type => {
        types[type] = (types[type] || 0) + 1;
      });
    });
    return Object.entries(types).sort((a, b) => b[1] - a[1]);
  }, [team]);

  // Handle export
  const handleExport = () => {
    const text = exportToShowdown();
    setExportText(text);
    setShowExport(true);
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    // Could add a toast notification here
  };

  return (
    <div className="team-page">
      {/* Hero Header */}
      <div className="team-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <span className="star-pulse">⭐</span>
          </div>
          <h1 className="page-title">My Team</h1>
          <p className="hero-subtitle">Build your ultimate Pokémon team</p>
        </div>
        
        {/* Team Progress Bar */}
        <div className="team-progress-container">
          <div className="team-progress-bar">
            <div 
              className="team-progress-fill"
              style={{ width: `${(teamSize / MAX_TEAM_SIZE) * 100}%` }}
            >
              {teamSize > 0 && (
                <span className="progress-text">{teamSize}/{MAX_TEAM_SIZE}</span>
              )}
            </div>
          </div>
          <div className="progress-labels">
            <span>Team Roster</span>
            <span className={teamSize === MAX_TEAM_SIZE ? 'complete' : ''}>
              {teamSize === MAX_TEAM_SIZE ? '✓ Complete!' : `${MAX_TEAM_SIZE - teamSize} slots remaining`}
            </span>
          </div>
        </div>

        {/* Team Stats Quick View */}
        {teamSize > 0 && (
          <div className="team-quick-stats">
            <div className="quick-stat">
              <span className="stat-icon">🎨</span>
              <span className="stat-value">{teamTypes.length}</span>
              <span className="stat-label">Types</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">⚠️</span>
              <span className="stat-value">{Object.keys(teamAnalysis.weaknesses || {}).length}</span>
              <span className="stat-label">Weaknesses</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">🛡️</span>
              <span className="stat-value">{Object.keys(teamAnalysis.resistances || {}).length}</span>
              <span className="stat-label">Resistances</span>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">✨</span>
              <span className="stat-value">{teamAnalysis.immunities?.length || 0}</span>
              <span className="stat-label">Immunities</span>
            </div>
          </div>
        )}

        {/* Team Types Display */}
        {teamTypes.length > 0 && (
          <div className="team-types-display">
            {teamTypes.map(([type, count]) => (
              <span 
                key={type} 
                className={`type-chip type-${type}`}
                style={{ '--type-bg': typeColors[type]?.primary }}
              >
                {type} {count > 1 && `×${count}`}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Team Grid */}
      <div className="team-roster-section">
        <div className="section-header">
          <h2>🏆 Team Roster</h2>
          <div className="section-actions">
            {teamSize > 0 && (
              <>
                <button 
                  className="export-team-btn"
                  onClick={handleExport}
                  title="Export to Showdown"
                >
                  <span>📋</span> Export
                </button>
                <button 
                  className="clear-team-btn" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear your entire team?')) {
                      clearTeam();
                    }
                  }}
                >
                  <span>🗑️</span> Clear Team
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="team-grid">
          {teamSlots.map((pokemon, index) => 
            pokemon ? (
              <TeamMemberCard 
                key={pokemon.id}
                pokemon={pokemon}
                index={index}
                onRemove={removeFromTeam}
                onEdit={setEditingPokemon}
              />
            ) : (
              <EmptySlot 
                key={`empty-${index}`} 
                index={index} 
                onClick={() => !isFull && setShowAddModal(true)}
              />
            )
          )}
        </div>
      </div>
      
      {teamSize === 0 ? (
        <div className="empty-team">
          <div className="empty-illustration">
            <div className="floating-icons">
              <span>🎮</span>
              <span>⭐</span>
              <span>🏆</span>
            </div>
          </div>
          <h2 className="empty-title">Build Your Team</h2>
          <p className="empty-message">
            Add Pokémon to create your ultimate battle team!
          </p>
          <div className="empty-tips">
            <div className="tip">
              <span className="tip-icon">🔍</span>
              <span>Search for Pokémon and click "Add to Team"</span>
            </div>
            <div className="tip">
              <span className="tip-icon">❤️</span>
              <span>Add from your Favorites collection</span>
            </div>
            <div className="tip">
              <span className="tip-icon">📊</span>
              <span>Get analysis on type coverage & weaknesses</span>
            </div>
          </div>
          <div className="empty-actions">
            <Link to="/info" className="action-btn primary">
              <span>🔍</span> Search Pokémon
            </Link>
            <Link to="/favorites" className="action-btn secondary">
              <span>❤️</span> View Favorites
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Add Section */}
          <QuickAddSection onAddToTeam={addToTeam} />
          
          {/* Team Analysis Toggle */}
          <div className="analysis-toggle-section">
            <button 
              className={`analysis-toggle-btn ${showAnalysis ? 'active' : ''}`}
              onClick={() => setShowAnalysis(!showAnalysis)}
            >
              <span>📊</span>
              {showAnalysis ? 'Hide Analysis' : 'Show Team Analysis'}
              <span className="toggle-arrow">{showAnalysis ? '▲' : '▼'}</span>
            </button>
          </div>
          
          {/* Team Analysis */}
          {showAnalysis && <TeamAnalysis />}
        </>
      )}
      
      {/* Build Editor Modal */}
      {editingPokemon && (
        <PokemonBuildEditor 
          pokemon={editingPokemon}
          onClose={() => setEditingPokemon(null)}
        />
      )}
      
      {/* Export Modal */}
      {showExport && (
        <div className="export-modal-overlay" onClick={() => setShowExport(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowExport(false)}>✕</button>
            <h3>📋 Pokémon Showdown Export</h3>
            <p className="export-info">
              Copy this text and paste it into Pokémon Showdown's teambuilder to import your team.
            </p>
            <textarea
              className="export-textarea"
              value={exportText}
              readOnly
              rows={15}
            />
            <div className="export-actions">
              <button className="copy-btn" onClick={copyToClipboard}>
                📋 Copy to Clipboard
              </button>
              <a 
                href="https://play.pokemonshowdown.com/teambuilder" 
                target="_blank" 
                rel="noopener noreferrer"
                className="showdown-link"
              >
                🔗 Open Showdown Teambuilder
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Pokemon Modal */}
      {showAddModal && (
        <AddPokemonModal 
          onClose={() => setShowAddModal(false)}
          onAdd={addToTeam}
        />
      )}
    </div>
  );
};

export { TeamPage };
