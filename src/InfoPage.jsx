// InfoPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPokemonWithEvolution, calculateTypeEffectivenessFromAPI } from './Pokemon';
import { useFavorites } from './context/FavoritesContext';
import { useTeam } from './context/TeamContext';
import { useTheme } from './context/ThemeContext';
import { typeColors } from './utils/typeColors';
import EvolutionChain from './components/EvolutionChain';
import TypeEffectiveness from './components/TypeEffectiveness';
import MovesSection from './components/MovesSection';
import AbilitiesSection from './components/AbilitiesSection';
import FlavorTextSection from './components/FlavorTextSection';
import LocationsSection from './components/LocationsSection';
import PokemonSearchInput from './components/PokemonSearchInput';

// Animated stat ring component
const StatRing = ({ name, value, maxValue = 255, color, delay = 0 }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="stat-ring" style={{ animationDelay: `${delay}ms` }}>
      <svg viewBox="0 0 80 80">
        <circle className="stat-ring-bg" cx="40" cy="40" r="36" />
        <circle 
          className="stat-ring-fill" 
          cx="40" 
          cy="40" 
          r="36"
          style={{ 
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
            stroke: color,
          }}
        />
      </svg>
      <div className="stat-ring-content">
        <span className="stat-ring-value">{value}</span>
        <span className="stat-ring-name">{name}</span>
      </div>
    </div>
  );
};

// Modern Pokemon Showcase Component
const PokemonShowcase = ({ pokemon, typeEffectiveness }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToTeam, removeFromTeam, isOnTeam, isFull } = useTeam();
  const { updateDynamicType, currentTheme } = useTheme();
  const [showShiny, setShowShiny] = useState(false);

  const favorited = isFavorite(pokemon?.id);
  const onTeam = isOnTeam(pokemon?.id);

  const typeStyle = useMemo(() => {
    if (!pokemon?.type) return {};
    const primaryType = pokemon.type || pokemon.types?.[0] || 'normal';
    const secondaryType = pokemon.types?.[1] || primaryType;
    return {
      '--primary-type-color': typeColors[primaryType]?.primary || typeColors.normal.primary,
      '--secondary-type-color': typeColors[secondaryType]?.primary || typeColors[primaryType]?.primary,
      '--primary-type-light': typeColors[primaryType]?.light || typeColors.normal.light,
    };
  }, [pokemon?.type, pokemon?.types]);

  // Update dynamic theme when Pokemon changes
  useEffect(() => {
    if (pokemon?.type && currentTheme === 'dynamic') {
      updateDynamicType(pokemon.type);
    }
  }, [pokemon?.type, currentTheme, updateDynamicType]);

  if (!pokemon) return null;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    toggleFavorite(pokemon);
  };

  const handleTeamClick = (e) => {
    e.preventDefault();
    if (onTeam) {
      removeFromTeam(pokemon.id);
    } else {
      addToTeam(pokemon);
    }
  };

  // Get the correct image based on shiny toggle
  const displayImage = showShiny 
    ? (pokemon.shinyImage || pokemon.image) 
    : pokemon.image;

  const statColors = {
    hp: '#ff6b6b',
    attack: '#feca57',
    defense: '#48dbfb',
    specialAttack: '#ff9ff3',
    specialDefense: '#54a0ff',
    speed: '#5f27cd',
  };

  const totalStats = Object.values(pokemon.stats).reduce((a, b) => a + b, 0);

  return (
    <div className="pokemon-showcase search-showcase" style={typeStyle}>
      {/* Floating background elements */}
      <div className="showcase-bg-elements">
        <div className="bg-circle circle-1"></div>
        <div className="bg-circle circle-2"></div>
        <div className="bg-circle circle-3"></div>
        <div className="pokeball-watermark"></div>
      </div>

      {/* Main content grid */}
      <div className="showcase-content">
        {/* Left: Pokemon visual */}
        <div className="showcase-visual">
          <div className="pokemon-id-badge">#{String(pokemon.id).padStart(3, '0')}</div>
          
          {/* Special badges */}
          {(pokemon.isLegendary || pokemon.isMythical) && (
            <div className="special-badges">
              {pokemon.isLegendary && <span className="special-badge legendary">⚡ Legendary</span>}
              {pokemon.isMythical && <span className="special-badge mythical">✨ Mythical</span>}
            </div>
          )}
          
          {/* Shiny Toggle */}
          <button 
            className={`shiny-toggle ${showShiny ? 'active' : ''}`}
            onClick={() => setShowShiny(!showShiny)}
            title={showShiny ? 'Show normal form' : 'Show shiny form'}
          >
            <span className="shiny-icon">✨</span>
            <span className="shiny-text">{showShiny ? 'Shiny' : 'Normal'}</span>
          </button>
          
          <div className={`pokemon-image-showcase ${showShiny ? 'shiny' : ''}`}>
            <div className="image-glow"></div>
            <img src={displayImage} alt={pokemon.name} />
          </div>

          <div className="quick-actions">
            <button 
              className={`action-btn favorite-action ${favorited ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="action-icon">{favorited ? '❤️' : '🤍'}</span>
              <span className="action-text">{favorited ? 'Favorited' : 'Favorite'}</span>
            </button>
            <button 
              className={`action-btn team-action ${onTeam ? 'active' : ''}`}
              onClick={handleTeamClick}
              disabled={!onTeam && isFull}
              title={onTeam ? 'Remove from team' : isFull ? 'Team is full' : 'Add to team'}
            >
              <span className="action-icon">{onTeam ? '⭐' : '➕'}</span>
              <span className="action-text">{onTeam ? 'On Team' : 'Add Team'}</span>
            </button>
          </div>
        </div>

        {/* Right: Pokemon info */}
        <div className="showcase-info">
          <div className="pokemon-header">
            <h2 className="pokemon-showcase-name">{pokemon.name}</h2>
            {pokemon.genus && (
              <p className="pokemon-genus-text">{pokemon.genus}</p>
            )}
            <div className="pokemon-types-row">
              {pokemon.types.map(type => (
                <span key={type} className={`type-pill type-${type}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* Physical attributes */}
          <div className="physical-stats">
            <div className="physical-stat">
              <div className="physical-icon">📏</div>
              <div className="physical-info">
                <span className="physical-value">{pokemon.height}m</span>
                <span className="physical-label">Height</span>
              </div>
            </div>
            <div className="physical-stat">
              <div className="physical-icon">⚖️</div>
              <div className="physical-info">
                <span className="physical-value">{pokemon.weight}kg</span>
                <span className="physical-label">Weight</span>
              </div>
            </div>
            <div className="physical-stat">
              <div className="physical-icon">⚡</div>
              <div className="physical-info">
                <span className="physical-value">{totalStats}</span>
                <span className="physical-label">Total Stats</span>
              </div>
            </div>
          </div>

          {/* Enhanced Abilities Section */}
          {pokemon.abilitiesDetailed && (
            <AbilitiesSection abilitiesDetailed={pokemon.abilitiesDetailed} />
          )}

          {/* Stats visualization */}
          <div className="stats-section">
            <h4 className="section-label">Base Stats</h4>
            <div className="stats-rings">
              <StatRing name="HP" value={pokemon.stats.hp} color={statColors.hp} delay={0} />
              <StatRing name="ATK" value={pokemon.stats.attack} color={statColors.attack} delay={100} />
              <StatRing name="DEF" value={pokemon.stats.defense} color={statColors.defense} delay={200} />
              <StatRing name="SP.A" value={pokemon.stats.specialAttack} color={statColors.specialAttack} delay={300} />
              <StatRing name="SP.D" value={pokemon.stats.specialDefense} color={statColors.specialDefense} delay={400} />
              <StatRing name="SPD" value={pokemon.stats.speed} color={statColors.speed} delay={500} />
            </div>
          </div>
        </div>
      </div>

      {/* Type Effectiveness Section - Inside Showcase */}
      {typeEffectiveness && (
        <div className="showcase-type-effectiveness">
          <TypeEffectiveness 
            weaknesses={typeEffectiveness.weaknesses}
            resistances={typeEffectiveness.resistances}
            immunities={typeEffectiveness.immunities}
          />
        </div>
      )}
    </div>
  );
};

const InfoPage = () => {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [searchedPokemon, setSearchedPokemon] = useState(null);
  const [typeEffectiveness, setTypeEffectiveness] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for query parameter on mount
  useEffect(() => {
    const pokemonParam = searchParams.get('pokemon');
    if (pokemonParam) {
      setSearchInput(pokemonParam);
      handleSearchPokemon(pokemonParam);
    }
  }, [searchParams]);

  const handleSearchPokemon = async (query) => {
    if (!query || !query.trim()) {
      setError('Please enter a Pokémon name or ID!');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchedPokemon(null);
    setTypeEffectiveness(null);
    
    try {
      const pokemon = await fetchPokemonWithEvolution(query.trim());
      setSearchedPokemon(pokemon);
      
      const effectiveness = await calculateTypeEffectivenessFromAPI(pokemon.types);
      setTypeEffectiveness(effectiveness);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    handleSearchPokemon(searchInput);
  };

  const handlePokemonSelect = (pokemonName) => {
    setSearchInput(pokemonName);
    handleSearchPokemon(pokemonName);
  };

  return (
    <div className="info-page">
      <div className="search-header">
        <h1 className="search-page-title">
          <span className="title-icon">🔍</span>
          <span className="title-text">Search Pokémon</span>
        </h1>
        <p className="search-subtitle">Find any Pokémon by name or Pokédex number</p>
      </div>
      
      <div className="search-box">
        <div className="search-input-wrapper">
          <span className="search-icon">🔎</span>
          <PokemonSearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSelect={handlePokemonSelect}
            onSubmit={handleSearch}
            placeholder="Enter name or ID (e.g., pikachu, 25)"
            className="search-input"
          />
        </div>
        <button onClick={handleSearch} disabled={loading} className="search-btn">
          {loading ? (
            <>
              <span className="btn-spinner"></span>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <span>Search</span>
              <span className="btn-arrow">→</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="error-container">
          <span className="error-icon">😢</span>
          <p className="error-message">{error}</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-showcase">
          <div className="pokeball-loader">
            <div className="pokeball-top"></div>
            <div className="pokeball-center"></div>
            <div className="pokeball-bottom"></div>
          </div>
          <p className="loading-text">Searching the Pokédex...</p>
        </div>
      )}
      
      {!loading && searchedPokemon && (
        <div className="search-results">
          <PokemonShowcase pokemon={searchedPokemon} typeEffectiveness={typeEffectiveness} />
          
          {/* Flavor Text / Pokedex Entries */}
          <FlavorTextSection 
            pokemonId={searchedPokemon.id}
            initialFlavorText={searchedPokemon.flavorText}
          />
          
          {/* Moves Section */}
          <MovesSection moves={searchedPokemon.moves} />
          
          {/* Evolution Chain Section */}
          <div className="evolution-section">
            <EvolutionChain 
              evolutionChain={searchedPokemon.evolutionChain}
              currentPokemonId={searchedPokemon.id}
            />
          </div>
          
          {/* Encounter Locations */}
          <LocationsSection pokemonId={searchedPokemon.id} />
        </div>
      )}
      
      {!loading && !searchedPokemon && !error && (
        <div className="search-empty-state">
          <div className="empty-pokeball">
            <div className="pokeball-static">
              <div className="pokeball-top"></div>
              <div className="pokeball-center"></div>
              <div className="pokeball-bottom"></div>
            </div>
          </div>
          <h3 className="empty-title">Ready to explore!</h3>
          <p className="empty-hint">Enter a Pokémon name or Pokédex number to get started</p>
          <div className="suggestion-chips">
            <button className="suggestion-chip" onClick={() => { setSearchInput('pikachu'); handleSearchPokemon('pikachu'); }}>Pikachu</button>
            <button className="suggestion-chip" onClick={() => { setSearchInput('charizard'); handleSearchPokemon('charizard'); }}>Charizard</button>
            <button className="suggestion-chip" onClick={() => { setSearchInput('mewtwo'); handleSearchPokemon('mewtwo'); }}>Mewtwo</button>
            <button className="suggestion-chip" onClick={() => { setSearchInput('eevee'); handleSearchPokemon('eevee'); }}>Eevee</button>
          </div>
        </div>
      )}
    </div>
  );
};

export { InfoPage };
