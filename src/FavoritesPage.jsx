// FavoritesPage.jsx - Display all favorited Pokemon
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from './context/FavoritesContext';
import { useTeam } from './context/TeamContext';
import { typeColors, getTypeGradient } from './utils/typeColors';

const FavoriteCard = ({ pokemon, index }) => {
  const { removeFavorite } = useFavorites();
  const { addToTeam, removeFromTeam, isOnTeam, isFull } = useTeam();
  const [isHovered, setIsHovered] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const onTeam = isOnTeam(pokemon.id);
  const primaryType = pokemon.type || pokemon.types?.[0] || 'normal';
  const secondaryType = pokemon.types?.[1];

  const handleRemoveFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRemoving(true);
    setTimeout(() => {
      removeFavorite(pokemon.id);
    }, 300);
  };

  const handleTeamClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTeam) {
      removeFromTeam(pokemon.id);
    } else {
      addToTeam(pokemon);
    }
  };

  return (
    <Link 
      to={`/info?pokemon=${pokemon.name}`}
      className={`favorite-card type-themed ${isRemoving ? 'removing' : ''}`}
      style={{
        '--card-gradient': getTypeGradient(primaryType),
        '--type-color': typeColors[primaryType]?.primary || typeColors.normal.primary,
        '--type-color-secondary': secondaryType 
          ? typeColors[secondaryType]?.primary 
          : typeColors[primaryType]?.secondary,
        '--animation-delay': `${index * 0.05}s`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-shine"></div>
      
      <button 
        className={`remove-favorite-btn ${isHovered ? 'visible' : ''}`}
        onClick={handleRemoveFavorite}
        title="Remove from favorites"
        aria-label="Remove from favorites"
      >
        <span className="heart-icon">❤️</span>
        <span className="remove-icon">✕</span>
      </button>

      {onTeam && <div className="team-indicator">⭐</div>}
      
      <div className="favorite-image-container">
        <div className="pokemon-glow"></div>
        <img 
          src={pokemon.image || pokemon.sprite} 
          alt={pokemon.name}
          className={isHovered ? 'hovered' : ''}
        />
      </div>
      
      <div className="favorite-info">
        <p className="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</p>
        <p className="pokemon-name">{pokemon.name}</p>
        
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
        
        <button 
          className={`team-btn small ${onTeam ? 'on-team' : ''}`}
          onClick={handleTeamClick}
          disabled={!onTeam && isFull}
        >
          {onTeam ? '✓ On Team' : isFull ? '🔒 Full' : '+ Add'}
        </button>
      </div>
    </Link>
  );
};

const FavoritesPage = () => {
  const { favorites, favoritesCount, clearAllFavorites } = useFavorites();
  const { teamSize } = useTeam();
  const [sortBy, setSortBy] = useState('added');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique types from favorites
  const uniqueTypes = useMemo(() => {
    const types = new Set();
    favorites.forEach(pokemon => {
      pokemon.types?.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }, [favorites]);

  // Filter and sort favorites
  const filteredFavorites = useMemo(() => {
    let result = [...favorites];
    
    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(p => p.types?.includes(filterType));
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        String(p.id).includes(query)
      );
    }
    
    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'id':
        result.sort((a, b) => a.id - b.id);
        break;
      case 'type':
        result.sort((a, b) => (a.types?.[0] || '').localeCompare(b.types?.[0] || ''));
        break;
      default:
        // 'added' - keep original order
        break;
    }
    
    return result;
  }, [favorites, filterType, searchQuery, sortBy]);

  // Stats for header
  const typeStats = useMemo(() => {
    const counts = {};
    favorites.forEach(pokemon => {
      const primaryType = pokemon.types?.[0];
      if (primaryType) {
        counts[primaryType] = (counts[primaryType] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [favorites]);

  return (
    <div className="favorites-page">
      {/* Hero Header */}
      <div className="favorites-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <span className="heart-pulse">❤️</span>
          </div>
          <h1 className="page-title">My Favorites</h1>
          <p className="hero-subtitle">Your personal Pokémon collection</p>
        </div>
        
        {favoritesCount > 0 && (
          <div className="favorites-stats">
            <div className="stat-card">
              <span className="stat-number">{favoritesCount}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{teamSize}/6</span>
              <span className="stat-label">On Team</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{uniqueTypes.length}</span>
              <span className="stat-label">Types</span>
            </div>
          </div>
        )}

        {typeStats.length > 0 && (
          <div className="top-types">
            <span className="top-types-label">Top Types:</span>
            {typeStats.map(([type, count]) => (
              <span 
                key={type} 
                className={`type-chip type-${type}`}
                style={{ '--type-bg': typeColors[type]?.primary }}
              >
                {type} ({count})
              </span>
            ))}
          </div>
        )}
      </div>
      
      {favoritesCount === 0 ? (
        <div className="empty-favorites">
          <div className="empty-illustration">
            <div className="floating-hearts">
              <span>💔</span>
              <span>🤍</span>
              <span>💗</span>
            </div>
          </div>
          <h2 className="empty-title">No Favorites Yet</h2>
          <p className="empty-message">
            Start building your collection by adding Pokémon to your favorites!
          </p>
          <div className="empty-tips">
            <div className="tip">
              <span className="tip-icon">💡</span>
              <span>Click the heart ❤️ on any Pokémon card</span>
            </div>
            <div className="tip">
              <span className="tip-icon">🔍</span>
              <span>Search for your favorite Pokémon</span>
            </div>
            <div className="tip">
              <span className="tip-icon">⭐</span>
              <span>Build your dream team from favorites</span>
            </div>
          </div>
          <Link to="/info" className="explore-btn">
            <span>🔍</span> Explore Pokémon
          </Link>
        </div>
      ) : (
        <>
          {/* Controls Bar */}
          <div className="favorites-controls">
            <div className="search-filter-group">
              <div className="favorites-search">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="clear-search"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="filter-dropdown">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="type-filter"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="sort-group">
              <span className="sort-label">Sort by:</span>
              <div className="sort-buttons">
                {[
                  { value: 'added', label: '🕒 Recent' },
                  { value: 'name', label: '🔤 Name' },
                  { value: 'id', label: '#️⃣ Number' },
                  { value: 'type', label: '🎨 Type' },
                ].map(option => (
                  <button
                    key={option.value}
                    className={`sort-btn ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Count */}
          {(filterType !== 'all' || searchQuery) && (
            <div className="filter-results">
              <span>
                Showing {filteredFavorites.length} of {favoritesCount} favorites
                {filterType !== 'all' && ` • Type: ${filterType}`}
                {searchQuery && ` • Search: "${searchQuery}"`}
              </span>
              <button 
                className="clear-filters"
                onClick={() => { setFilterType('all'); setSearchQuery(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Grid */}
          {filteredFavorites.length > 0 ? (
            <div className="favorites-grid">
              {filteredFavorites.map((pokemon, index) => (
                <FavoriteCard key={pokemon.id} pokemon={pokemon} index={index} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No Pokémon match your filters</p>
              <button 
                className="clear-filters-btn"
                onClick={() => { setFilterType('all'); setSearchQuery(''); }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Footer Actions */}
          {favoritesCount > 0 && (
            <div className="favorites-footer">
              <button 
                className="clear-all-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to remove all favorites?')) {
                    clearAllFavorites();
                  }
                }}
              >
                🗑️ Clear All Favorites
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export { FavoritesPage };
