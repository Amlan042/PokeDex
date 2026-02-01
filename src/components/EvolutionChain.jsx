// EvolutionChain.jsx - Modern visual display of Pokemon evolution chain
import React from 'react';
import { Link } from 'react-router-dom';
import { typeColors } from '../utils/typeColors';

const EvolutionArrow = ({ details, index = 0 }) => {
  const getEvolutionMethod = () => {
    if (!details) return { text: 'Level Up', icon: '⬆️' };
    
    const methods = [];
    let icon = '⬆️';
    
    if (details.minLevel) {
      methods.push(`Lv. ${details.minLevel}`);
      icon = '📊';
    }
    if (details.item) {
      methods.push(details.item.replace(/-/g, ' '));
      icon = '💎';
    }
    if (details.heldItem) {
      methods.push(`Hold ${details.heldItem.replace(/-/g, ' ')}`);
      icon = '🎒';
    }
    if (details.minHappiness) {
      methods.push('High Friendship');
      icon = '💕';
    }
    if (details.timeOfDay) {
      methods.push(details.timeOfDay === 'day' ? 'Daytime' : 'Nighttime');
      icon = details.timeOfDay === 'day' ? '☀️' : '🌙';
    }
    if (details.location) {
      methods.push(`@ ${details.location.replace(/-/g, ' ')}`);
      icon = '📍';
    }
    if (details.knownMove) {
      methods.push(`Know ${details.knownMove.replace(/-/g, ' ')}`);
      icon = '💫';
    }
    if (details.trigger === 'trade') {
      methods.push('Trade');
      icon = '🔄';
    }
    
    return { 
      text: methods.length > 0 ? methods.join(' + ') : 'Level Up',
      icon 
    };
  };

  const { text, icon } = getEvolutionMethod();

  return (
    <div className="evo-arrow-container" style={{ animationDelay: `${index * 150}ms` }}>
      <div className="evo-arrow-line">
        <div className="evo-arrow-glow"></div>
      </div>
      <div className="evo-method-badge">
        <span className="evo-method-icon">{icon}</span>
        <span className="evo-method-text">{text}</span>
      </div>
      <div className="evo-arrow-head">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
        </svg>
      </div>
    </div>
  );
};

const EvolutionStage = ({ pokemon, isCurrentPokemon, stageIndex = 0, itemIndex = 0 }) => {
  const primaryType = pokemon.types?.[0] || 'normal';
  const secondaryType = pokemon.types?.[1] || primaryType;
  const typeColor = typeColors[primaryType]?.primary || '#A8A878';
  const typeColorSecondary = typeColors[secondaryType]?.primary || typeColor;

  return (
    <Link 
      to={`/info?pokemon=${pokemon.name}`}
      className={`evo-stage-card ${isCurrentPokemon ? 'current' : ''}`}
      style={{ 
        '--evo-type-color': typeColor,
        '--evo-type-color-secondary': typeColorSecondary,
        animationDelay: `${(stageIndex * 200) + (itemIndex * 100)}ms`
      }}
    >
      {isCurrentPokemon && <div className="current-badge">Current</div>}
      
      <div className="evo-stage-bg"></div>
      
      <div className="evo-image-wrapper">
        <div className="evo-image-glow"></div>
        {pokemon.image ? (
          <img 
            src={pokemon.image || pokemon.sprite} 
            alt={pokemon.name}
            className="evo-pokemon-image"
          />
        ) : (
          <div className="evo-placeholder">
            <span>?</span>
          </div>
        )}
      </div>
      
      <div className="evo-pokemon-info">
        <span className="evo-pokemon-id">#{String(pokemon.id).padStart(3, '0')}</span>
        <h4 className="evo-pokemon-name">{pokemon.name}</h4>
        {pokemon.types && (
          <div className="evo-types">
            {pokemon.types.map(type => (
              <span key={type} className={`evo-type-dot type-${type}`} title={type}></span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

const EvolutionChain = ({ evolutionChain, currentPokemonId }) => {
  if (!evolutionChain || evolutionChain.length === 0) {
    return (
      <div className="evolution-chain-modern">
        <div className="evo-header">
          <div className="evo-header-icon">🔄</div>
          <div className="evo-header-info">
            <h3 className="evo-header-title">Evolution Chain</h3>
            <p className="evo-header-subtitle">Growth path of this Pokémon</p>
          </div>
        </div>
        <div className="evo-empty-state">
          <div className="evo-empty-icon">🥚</div>
          <p className="evo-empty-text">This Pokémon does not evolve</p>
          <p className="evo-empty-hint">It remains in this form permanently</p>
        </div>
      </div>
    );
  }

  // Group evolutions by stage
  const stages = evolutionChain.reduce((acc, evo) => {
    if (!acc[evo.stage]) {
      acc[evo.stage] = [];
    }
    acc[evo.stage].push(evo);
    return acc;
  }, {});

  const stageNumbers = Object.keys(stages).map(Number).sort((a, b) => a - b);
  const totalStages = stageNumbers.length;

  return (
    <div className="evolution-chain-modern">
      <div className="evo-header">
        <div className="evo-header-icon">🔄</div>
        <div className="evo-header-info">
          <h3 className="evo-header-title">Evolution Chain</h3>
          <p className="evo-header-subtitle">
            {totalStages === 1 ? 'Single stage' : `${totalStages} evolution stages`}
          </p>
        </div>
        <div className="evo-stage-indicators">
          {stageNumbers.map((_, i) => (
            <div key={i} className="stage-dot"></div>
          ))}
        </div>
      </div>
      
      <div className="evo-chain-flow">
        {stageNumbers.map((stageNum, stageIndex) => (
          <React.Fragment key={stageNum}>
            <div className={`evo-stage-column ${stages[stageNum].length > 1 ? 'branched' : ''}`}>
              <div className="stage-label">Stage {stageNum}</div>
              <div className="evo-stage-cards">
                {stages[stageNum].map((pokemon, idx) => (
                  <EvolutionStage 
                    key={pokemon.id || idx}
                    pokemon={pokemon}
                    isCurrentPokemon={pokemon.id === currentPokemonId}
                    stageIndex={stageIndex}
                    itemIndex={idx}
                  />
                ))}
              </div>
            </div>
            {stageIndex < stageNumbers.length - 1 && (
              <EvolutionArrow 
                details={stages[stageNumbers[stageIndex + 1]][0]}
                index={stageIndex}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default EvolutionChain;
