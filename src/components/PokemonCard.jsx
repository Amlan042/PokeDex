// PokemonCard.jsx - Reusable Pokemon card component with favorites and team support
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useTeam } from '../context/TeamContext';
import { getTypeGradient, typeColors } from '../utils/typeColors';

// Stat bar component
export const StatBar = ({ name, value, maxValue = 255 }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const getColor = (val) => {
    if (val < 50) return '#ff6b6b';
    if (val < 80) return '#feca57';
    if (val < 100) return '#48dbfb';
    return '#1dd1a1';
  };

  return (
    <div className="stat-bar">
      <span className="stat-name">{name}</span>
      <div className="stat-bar-bg">
        <div 
          className="stat-bar-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor(value)
          }}
        />
      </div>
      <span className="stat-value">{value}</span>
    </div>
  );
};

// Heart icon for favorites
const HeartIcon = ({ filled, onClick }) => (
  <button 
    className={`heart-btn ${filled ? 'filled' : ''}`}
    onClick={onClick}
    title={filled ? 'Remove from favorites' : 'Add to favorites'}
    aria-label={filled ? 'Remove from favorites' : 'Add to favorites'}
  >
    {filled ? '❤️' : '🤍'}
  </button>
);

// Team add button
const TeamButton = ({ isOnTeam, isFull, onClick }) => (
  <button 
    className={`team-btn ${isOnTeam ? 'on-team' : ''}`}
    onClick={onClick}
    disabled={!isOnTeam && isFull}
    title={isOnTeam ? 'Remove from team' : isFull ? 'Team is full' : 'Add to team'}
    aria-label={isOnTeam ? 'Remove from team' : 'Add to team'}
  >
    {isOnTeam ? '⭐ On Team' : '➕ Add to Team'}
  </button>
);

// Main Pokemon Card Component
const PokemonCard = ({ 
  pokemon, 
  title, 
  showStats = true, 
  showActions = true,
  compact = false,
  linkToInfo = false,
  useTypeTheme = true,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToTeam, removeFromTeam, isOnTeam, isFull } = useTeam();

  const favorited = isFavorite(pokemon?.id);
  const onTeam = isOnTeam(pokemon?.id);

  // Get type-based styling
  const typeStyle = useMemo(() => {
    if (!useTypeTheme || !pokemon?.type) return {};
    const primaryType = pokemon.type || pokemon.types?.[0] || 'normal';
    return {
      '--card-gradient': getTypeGradient(primaryType),
      '--type-color': typeColors[primaryType]?.primary || typeColors.normal.primary,
    };
  }, [pokemon?.type, pokemon?.types, useTypeTheme]);

  if (!pokemon) return null;

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(pokemon);
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

  const CardContent = () => (
    <>
      {title && <h2>{title}</h2>}
      
      {showActions && (
        <div className="card-actions">
          <HeartIcon filled={favorited} onClick={handleFavoriteClick} />
        </div>
      )}
      
      <div className="pokemon-image-container">
        <img src={pokemon.image || pokemon.sprite} alt={pokemon.name} />
      </div>
      
      <p className="pokemon-name">{pokemon.name}</p>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>#{String(pokemon.id).padStart(3, '0')}</p>
      
      <div className="pokemon-types-container">
        {pokemon.types?.map(type => (
          <span key={type} className={`pokemon-type type-${type}`}>
            {type}
          </span>
        ))}
      </div>
      
      {!compact && (
        <div className="pokemon-measurements">
          <span>📏 {pokemon.height}m</span>
          <span>⚖️ {pokemon.weight}kg</span>
        </div>
      )}
      
      {!compact && pokemon.abilities && (
        <div className="pokemon-abilities">
          <strong>Abilities:</strong> {pokemon.abilities.map(a => a.replace('-', ' ')).join(', ')}
        </div>
      )}
      
      {showStats && pokemon.stats && !compact && (
        <div className="pokemon-stats">
          <h3>Base Stats</h3>
          <StatBar name="HP" value={pokemon.stats.hp} />
          <StatBar name="ATK" value={pokemon.stats.attack} />
          <StatBar name="DEF" value={pokemon.stats.defense} />
          <StatBar name="SP.ATK" value={pokemon.stats.specialAttack} />
          <StatBar name="SP.DEF" value={pokemon.stats.specialDefense} />
          <StatBar name="SPD" value={pokemon.stats.speed} />
        </div>
      )}
      
      {showActions && !compact && (
        <TeamButton 
          isOnTeam={onTeam} 
          isFull={isFull} 
          onClick={handleTeamClick} 
        />
      )}
    </>
  );

  const cardClassName = `pokemon-card ${compact ? 'compact' : ''} ${useTypeTheme ? 'type-themed' : ''}`;

  if (linkToInfo) {
    return (
      <Link 
        to={`/info?pokemon=${pokemon.name}`} 
        className={cardClassName}
        style={typeStyle}
      >
        <CardContent />
      </Link>
    );
  }

  return (
    <div className={cardClassName} style={typeStyle}>
      <CardContent />
    </div>
  );
};

// Mini card for team display
export const MiniPokemonCard = ({ pokemon, onRemove, showRemove = true }) => {
  const typeStyle = useMemo(() => {
    if (!pokemon?.type && !pokemon?.types?.[0]) return {};
    const primaryType = pokemon.type || pokemon.types?.[0] || 'normal';
    return {
      '--card-gradient': getTypeGradient(primaryType),
      '--type-color': typeColors[primaryType]?.primary || typeColors.normal.primary,
    };
  }, [pokemon?.type, pokemon?.types]);

  if (!pokemon) return null;

  return (
    <div className="mini-pokemon-card type-themed" style={typeStyle}>
      {showRemove && (
        <button 
          className="remove-btn"
          onClick={() => onRemove(pokemon.id)}
          title="Remove from team"
          aria-label="Remove from team"
        >
          ✕
        </button>
      )}
      <img src={pokemon.sprite || pokemon.image} alt={pokemon.name} />
      <p className="pokemon-name">{pokemon.name}</p>
      <div className="pokemon-types-container">
        {pokemon.types?.map(type => (
          <span key={type} className={`pokemon-type type-${type} small`}>
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};

// Empty team slot
export const EmptyTeamSlot = () => (
  <div className="mini-pokemon-card empty">
    <div className="empty-slot-icon">+</div>
    <p>Empty Slot</p>
  </div>
);

export default PokemonCard;
