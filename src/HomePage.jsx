// HomePage.js
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import fetchPokemon from './Pokemon';
import { useFavorites } from './context/FavoritesContext';
import { useTeam } from './context/TeamContext';
import { getTypeGradient, typeColors } from './utils/typeColors';

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

// Modern Pokemon Card Component
const PokemonShowcase = ({ pokemon }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToTeam, removeFromTeam, isOnTeam, isFull } = useTeam();

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
    <div className="pokemon-showcase" style={typeStyle}>
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
          
          <div className="pokemon-image-showcase">
            <div className="image-glow"></div>
            <img src={pokemon.image} alt={pokemon.name} />
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

          {/* Abilities */}
          {pokemon.abilities && (
            <div className="abilities-section">
              <h4 className="section-label">Abilities</h4>
              <div className="abilities-list">
                {pokemon.abilities.map((ability, index) => (
                  <span key={ability} className="ability-tag">
                    {ability.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
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
    </div>
  );
};

const HomePage = () => {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getRandomPokemon = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const randomPokemonId = Math.floor(Math.random() * 898) + 1;
      const randomPokemon = await fetchPokemon(randomPokemonId);
      setPokemon(randomPokemon);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getRandomPokemon();
  }, [getRandomPokemon]);

  return (
    <div className="homepage">
      <div className="homepage-header">
        <h1 className="homepage-title">
          <span className="title-icon">🎲</span>
          <span className="title-text">Discover Pokémon</span>
        </h1>
        <p className="homepage-subtitle">Meet a random Pokémon from across all generations</p>
      </div>
      
      {loading && (
        <div className="loading-showcase">
          <div className="pokeball-loader">
            <div className="pokeball-top"></div>
            <div className="pokeball-center"></div>
            <div className="pokeball-bottom"></div>
          </div>
          <p className="loading-text">Finding a Pokémon...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <span className="error-icon">😢</span>
          <p className="error-message">{error}</p>
        </div>
      )}
      
      {!loading && !error && pokemon && (
        <>
          <PokemonShowcase pokemon={pokemon} />
          <button className="discover-btn" onClick={getRandomPokemon}>
            <span className="btn-icon">🔄</span>
            <span className="btn-text">Discover Another</span>
            <span className="btn-shine"></span>
          </button>
        </>
      )}
    </div>
  );
};

export { HomePage };
