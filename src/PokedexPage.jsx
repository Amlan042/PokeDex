// PokedexPage.jsx - Advanced Pokémon Browser with Filtering
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useFavorites } from './context/FavoritesContext';
import { useTeam } from './context/TeamContext';
import { typeColors } from './utils/typeColors';
import fetchPokemon, { fetchGeneration, fetchPokemonByGeneration } from './Pokemon';

// Generation data
const GENERATIONS = [
  { id: 1, name: 'Generation I', region: 'Kanto', range: [1, 151] },
  { id: 2, name: 'Generation II', region: 'Johto', range: [152, 251] },
  { id: 3, name: 'Generation III', region: 'Hoenn', range: [252, 386] },
  { id: 4, name: 'Generation IV', region: 'Sinnoh', range: [387, 493] },
  { id: 5, name: 'Generation V', region: 'Unova', range: [494, 649] },
  { id: 6, name: 'Generation VI', region: 'Kalos', range: [650, 721] },
  { id: 7, name: 'Generation VII', region: 'Alola', range: [722, 809] },
  { id: 8, name: 'Generation VIII', region: 'Galar', range: [810, 905] },
  { id: 9, name: 'Generation IX', region: 'Paldea', range: [906, 1025] },
];

// All Pokemon types
const ALL_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
];

// Sort options
const SORT_OPTIONS = [
  { value: 'id-asc', label: 'Pokédex # (Low → High)', icon: '📖' },
  { value: 'id-desc', label: 'Pokédex # (High → Low)', icon: '📖' },
  { value: 'name-asc', label: 'Name (A → Z)', icon: '🔤' },
  { value: 'name-desc', label: 'Name (Z → A)', icon: '🔤' },
  { value: 'hp-desc', label: 'HP (High → Low)', icon: '❤️' },
  { value: 'attack-desc', label: 'Attack (High → Low)', icon: '⚔️' },
  { value: 'defense-desc', label: 'Defense (High → Low)', icon: '🛡️' },
  { value: 'speed-desc', label: 'Speed (High → Low)', icon: '💨' },
  { value: 'total-desc', label: 'Total Stats (High → Low)', icon: '📊' },
];

// Compact Pokemon Card for the grid
const PokedexCard = ({ pokemon, onClick }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToTeam, removeFromTeam, isOnTeam, isFull } = useTeam();
  
  const favorited = isFavorite(pokemon.id);
  const onTeam = isOnTeam(pokemon.id);
  const primaryType = pokemon.types?.[0] || 'normal';
  const totalStats = pokemon.stats 
    ? Object.values(pokemon.stats).reduce((a, b) => a + b, 0)
    : 0;

  const handleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(pokemon);
  };

  const handleTeam = (e) => {
    e.stopPropagation();
    if (onTeam) {
      removeFromTeam(pokemon.id);
    } else if (!isFull) {
      addToTeam(pokemon);
    }
  };

  return (
    <div 
      className="pokedex-card" 
      onClick={onClick}
      style={{ '--type-color': typeColors[primaryType]?.primary || '#888' }}
    >
      <div className="card-header">
        <span className="card-id">#{String(pokemon.id).padStart(3, '0')}</span>
        <div className="card-actions">
          <button 
            className={`mini-btn ${favorited ? 'active' : ''}`}
            onClick={handleFavorite}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {favorited ? '❤️' : '🤍'}
          </button>
          <button 
            className={`mini-btn ${onTeam ? 'active' : ''}`}
            onClick={handleTeam}
            disabled={!onTeam && isFull}
            title={onTeam ? 'Remove from team' : 'Add to team'}
          >
            {onTeam ? '⭐' : '➕'}
          </button>
        </div>
      </div>
      
      <div className="card-image">
        <img 
          src={pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
          alt={pokemon.name}
          loading="lazy"
        />
      </div>
      
      <h3 className="card-name">{pokemon.name}</h3>
      
      <div className="card-types">
        {pokemon.types?.map(type => (
          <span key={type} className={`type-badge type-${type}`}>
            {type}
          </span>
        ))}
      </div>
      
      {totalStats > 0 && (
        <div className="card-stats-preview">
          <span className="stat-total">BST: {totalStats}</span>
        </div>
      )}
    </div>
  );
};

// Stat Range Slider
const StatRangeFilter = ({ label, icon, min, max, value, onChange }) => {
  return (
    <div className="stat-range-filter">
      <div className="range-header">
        <span className="range-icon">{icon}</span>
        <span className="range-label">{label}</span>
        <span className="range-value">{value[0]} - {value[1]}</span>
      </div>
      <div className="range-inputs">
        <input 
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
          className="range-slider range-min"
        />
        <input 
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
          className="range-slider range-max"
        />
      </div>
    </div>
  );
};

const PokedexPage = () => {
  const navigate = useNavigate();
  
  // Data state
  const [allPokemon, setAllPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [sortBy, setSortBy] = useState('id-asc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Stat range filters
  const [hpRange, setHpRange] = useState([0, 255]);
  const [attackRange, setAttackRange] = useState([0, 255]);
  const [defenseRange, setDefenseRange] = useState([0, 255]);
  const [speedRange, setSpeedRange] = useState([0, 255]);
  const [totalRange, setTotalRange] = useState([0, 800]);
  
  // View state
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [displayCount, setDisplayCount] = useState(50);

  // Fetch initial Pokemon list
  useEffect(() => {
    const loadPokemonList = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch list of all Pokemon (basic info)
        const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025');
        const pokemonList = response.data.results.map((p, index) => ({
          id: index + 1,
          name: p.name,
          url: p.url,
        }));
        
        // Fetch detailed data for first batch
        const detailedPokemon = await Promise.all(
          pokemonList.slice(0, 151).map(async (p) => {
            try {
              const data = await fetchPokemon(p.id);
              return data;
            } catch {
              return {
                ...p,
                types: [],
                stats: null,
                image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
              };
            }
          })
        );
        
        // Set initial data with Gen 1 detailed, rest basic
        const combined = [
          ...detailedPokemon,
          ...pokemonList.slice(151).map(p => ({
            ...p,
            types: [],
            stats: null,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
          }))
        ];
        
        setAllPokemon(combined);
      } catch (err) {
        setError('Failed to load Pokémon list');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadPokemonList();
  }, []);

  // Load more detailed Pokemon data when generation changes
  useEffect(() => {
    const loadGenerationData = async () => {
      if (!selectedGeneration || loading) return;
      
      const gen = GENERATIONS.find(g => g.id === selectedGeneration);
      if (!gen) return;
      
      // Check if we need to load this generation's data
      const [start, end] = gen.range;
      const needsLoading = allPokemon.slice(start - 1, end).some(p => !p.stats);
      
      if (!needsLoading) return;
      
      setLoadingMore(true);
      try {
        const detailedPokemon = await Promise.all(
          allPokemon.slice(start - 1, end).map(async (p) => {
            if (p.stats) return p;
            try {
              return await fetchPokemon(p.id);
            } catch {
              return p;
            }
          })
        );
        
        setAllPokemon(prev => {
          const updated = [...prev];
          detailedPokemon.forEach((p, i) => {
            updated[start - 1 + i] = p;
          });
          return updated;
        });
      } catch (err) {
        console.error('Failed to load generation data:', err);
      } finally {
        setLoadingMore(false);
      }
    };
    
    loadGenerationData();
  }, [selectedGeneration, loading]);

  // Filter and sort Pokemon
  const filteredPokemon = useMemo(() => {
    let result = [...allPokemon];
    
    // Filter by generation
    if (selectedGeneration) {
      const gen = GENERATIONS.find(g => g.id === selectedGeneration);
      if (gen) {
        result = result.filter(p => p.id >= gen.range[0] && p.id <= gen.range[1]);
      }
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        String(p.id).includes(query) ||
        String(p.id).padStart(3, '0').includes(query)
      );
    }
    
    // Filter by types
    if (selectedTypes.length > 0) {
      result = result.filter(p => 
        p.types?.some(t => selectedTypes.includes(t))
      );
    }
    
    // Filter by stat ranges (only for Pokemon with loaded stats)
    result = result.filter(p => {
      if (!p.stats) return true; // Include Pokemon without loaded stats
      
      const hp = p.stats.hp || 0;
      const atk = p.stats.attack || 0;
      const def = p.stats.defense || 0;
      const spd = p.stats.speed || 0;
      const total = Object.values(p.stats).reduce((a, b) => a + b, 0);
      
      return (
        hp >= hpRange[0] && hp <= hpRange[1] &&
        atk >= attackRange[0] && atk <= attackRange[1] &&
        def >= defenseRange[0] && def <= defenseRange[1] &&
        spd >= speedRange[0] && spd <= speedRange[1] &&
        total >= totalRange[0] && total <= totalRange[1]
      );
    });
    
    // Sort
    const [sortField, sortDir] = sortBy.split('-');
    result.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          return sortDir === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'hp':
          aVal = a.stats?.hp || 0;
          bVal = b.stats?.hp || 0;
          break;
        case 'attack':
          aVal = a.stats?.attack || 0;
          bVal = b.stats?.attack || 0;
          break;
        case 'defense':
          aVal = a.stats?.defense || 0;
          bVal = b.stats?.defense || 0;
          break;
        case 'speed':
          aVal = a.stats?.speed || 0;
          bVal = b.stats?.speed || 0;
          break;
        case 'total':
          aVal = a.stats ? Object.values(a.stats).reduce((x, y) => x + y, 0) : 0;
          bVal = b.stats ? Object.values(b.stats).reduce((x, y) => x + y, 0) : 0;
          break;
        default: // id
          aVal = a.id;
          bVal = b.id;
      }
      
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return result;
  }, [allPokemon, searchQuery, selectedTypes, selectedGeneration, sortBy, 
      hpRange, attackRange, defenseRange, speedRange, totalRange]);

  // Toggle type filter
  const toggleType = useCallback((type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedGeneration(null);
    setSortBy('id-asc');
    setHpRange([0, 255]);
    setAttackRange([0, 255]);
    setDefenseRange([0, 255]);
    setSpeedRange([0, 255]);
    setTotalRange([0, 800]);
  }, []);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedTypes.length > 0) count++;
    if (selectedGeneration) count++;
    if (hpRange[0] > 0 || hpRange[1] < 255) count++;
    if (attackRange[0] > 0 || attackRange[1] < 255) count++;
    if (defenseRange[0] > 0 || defenseRange[1] < 255) count++;
    if (speedRange[0] > 0 || speedRange[1] < 255) count++;
    if (totalRange[0] > 0 || totalRange[1] < 800) count++;
    return count;
  }, [searchQuery, selectedTypes, selectedGeneration, hpRange, attackRange, defenseRange, speedRange, totalRange]);

  // Handle Pokemon click
  const handlePokemonClick = (pokemon) => {
    navigate(`/info?query=${pokemon.name}`);
  };

  // Load more
  const loadMore = () => {
    setDisplayCount(prev => Math.min(prev + 50, filteredPokemon.length));
  };

  const displayedPokemon = filteredPokemon.slice(0, displayCount);

  return (
    <div className="pokedex-page">
      {/* Header */}
      <div className="pokedex-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📱</span>
            <span>Pokédex</span>
          </h1>
          <p className="page-subtitle">Browse and filter all Pokémon</p>
        </div>
        
        <div className="header-stats">
          <span className="stat-pill">
            <span className="stat-icon">🔢</span>
            <span>{filteredPokemon.length} Pokémon</span>
          </span>
          {activeFilterCount > 0 && (
            <span className="stat-pill active">
              <span className="stat-icon">🎯</span>
              <span>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="pokedex-controls">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
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
        
        <div className="control-buttons">
          <button 
            className={`control-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>🎛️</span>
            <span>Filters</span>
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
          
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              ◫
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          {/* Generation Filter */}
          <div className="filter-section">
            <h3 className="filter-title">
              <span>🌍</span> Generation
            </h3>
            <div className="generation-buttons">
              <button
                className={`gen-btn ${selectedGeneration === null ? 'active' : ''}`}
                onClick={() => setSelectedGeneration(null)}
              >
                All
              </button>
              {GENERATIONS.map(gen => (
                <button
                  key={gen.id}
                  className={`gen-btn ${selectedGeneration === gen.id ? 'active' : ''}`}
                  onClick={() => setSelectedGeneration(gen.id)}
                  title={`${gen.name} (${gen.region})`}
                >
                  {gen.id}
                </button>
              ))}
            </div>
            {selectedGeneration && (
              <p className="gen-info">
                {GENERATIONS.find(g => g.id === selectedGeneration)?.name} - {GENERATIONS.find(g => g.id === selectedGeneration)?.region}
              </p>
            )}
          </div>

          {/* Type Filter */}
          <div className="filter-section">
            <h3 className="filter-title">
              <span>⚡</span> Types
              {selectedTypes.length > 0 && (
                <button className="clear-types" onClick={() => setSelectedTypes([])}>
                  Clear
                </button>
              )}
            </h3>
            <div className="type-buttons">
              {ALL_TYPES.map(type => (
                <button
                  key={type}
                  className={`type-filter-btn type-${type} ${selectedTypes.includes(type) ? 'active' : ''}`}
                  onClick={() => toggleType(type)}
                  style={{ '--type-color': typeColors[type]?.primary }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Range Filters */}
          <div className="filter-section">
            <h3 className="filter-title">
              <span>📊</span> Base Stats
            </h3>
            <div className="stat-filters">
              <StatRangeFilter
                label="HP"
                icon="❤️"
                min={0}
                max={255}
                value={hpRange}
                onChange={setHpRange}
              />
              <StatRangeFilter
                label="Attack"
                icon="⚔️"
                min={0}
                max={255}
                value={attackRange}
                onChange={setAttackRange}
              />
              <StatRangeFilter
                label="Defense"
                icon="🛡️"
                min={0}
                max={255}
                value={defenseRange}
                onChange={setDefenseRange}
              />
              <StatRangeFilter
                label="Speed"
                icon="💨"
                min={0}
                max={255}
                value={speedRange}
                onChange={setSpeedRange}
              />
              <StatRangeFilter
                label="Total"
                icon="📊"
                min={0}
                max={800}
                value={totalRange}
                onChange={setTotalRange}
              />
            </div>
          </div>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <button className="reset-filters-btn" onClick={resetFilters}>
              <span>🔄</span> Reset All Filters
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="pokeball-loader">
            <div className="pokeball-top"></div>
            <div className="pokeball-center"></div>
            <div className="pokeball-bottom"></div>
          </div>
          <p>Loading Pokédex...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-state">
          <span className="error-icon">😢</span>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="loading-more-bar">
          Loading detailed data for this generation...
        </div>
      )}

      {/* Pokemon Grid/List */}
      {!loading && !error && (
        <>
          {filteredPokemon.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <h3>No Pokémon Found</h3>
              <p>Try adjusting your filters or search query</p>
              <button onClick={resetFilters}>Reset Filters</button>
            </div>
          ) : (
            <>
              <div className={`pokemon-${viewMode}`}>
                {displayedPokemon.map(pokemon => (
                  <PokedexCard
                    key={pokemon.id}
                    pokemon={pokemon}
                    onClick={() => handlePokemonClick(pokemon)}
                  />
                ))}
              </div>
              
              {displayCount < filteredPokemon.length && (
                <button className="load-more-btn" onClick={loadMore}>
                  <span>📥</span>
                  <span>Load More ({filteredPokemon.length - displayCount} remaining)</span>
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PokedexPage;
