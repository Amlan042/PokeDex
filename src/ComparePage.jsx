// ComparePage.jsx - Compare two Pokemon side by side
import React, { useState, useCallback } from 'react';
import { fetchPokemonWithEvolution, calculateTypeEffectivenessFromAPI } from './Pokemon';
import { typeColors, calculateTypeEffectiveness as calculateOffensiveMatchup } from './utils/typeColors';
import PokemonSearchInput from './components/PokemonSearchInput';

// Radar chart for stat comparison
const StatRadarChart = ({ pokemon1, pokemon2 }) => {
  const stats = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
  const statLabels = ['HP', 'ATK', 'DEF', 'SP.A', 'SP.D', 'SPD'];
  const maxStat = 255;
  const centerX = 150;
  const centerY = 150;
  const radius = 100;

  // Calculate points for each stat
  const getPoints = (pokemon) => {
    return stats.map((stat, i) => {
      const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
      const value = pokemon?.stats[stat] || 0;
      const r = (value / maxStat) * radius;
      return {
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
      };
    });
  };

  const points1 = pokemon1 ? getPoints(pokemon1) : [];
  const points2 = pokemon2 ? getPoints(pokemon2) : [];

  // Create polygon path
  const createPath = (points) => {
    if (points.length === 0) return '';
    return points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ') + ' Z';
  };

  // Label positions
  const labelPositions = stats.map((_, i) => {
    const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
    return {
      x: centerX + (radius + 25) * Math.cos(angle),
      y: centerY + (radius + 25) * Math.sin(angle),
    };
  });

  return (
    <div className="radar-chart-container">
      <svg viewBox="0 0 300 300" className="radar-chart">
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            className="radar-bg-polygon"
            points={stats.map((_, j) => {
              const angle = (Math.PI * 2 * j) / stats.length - Math.PI / 2;
              const r = radius * scale;
              return `${centerX + r * Math.cos(angle)},${centerY + r * Math.sin(angle)}`;
            }).join(' ')}
          />
        ))}

        {/* Axis lines */}
        {stats.map((_, i) => {
          const angle = (Math.PI * 2 * i) / stats.length - Math.PI / 2;
          return (
            <line
              key={i}
              className="radar-axis"
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
            />
          );
        })}

        {/* Pokemon 1 polygon */}
        {pokemon1 && (
          <path
            className="radar-polygon pokemon1"
            d={createPath(points1)}
            style={{ 
              fill: `${typeColors[pokemon1.type]?.primary || '#ff6b6b'}33`,
              stroke: typeColors[pokemon1.type]?.primary || '#ff6b6b'
            }}
          />
        )}

        {/* Pokemon 2 polygon */}
        {pokemon2 && (
          <path
            className="radar-polygon pokemon2"
            d={createPath(points2)}
            style={{ 
              fill: `${typeColors[pokemon2.type]?.primary || '#4ecdc4'}33`,
              stroke: typeColors[pokemon2.type]?.primary || '#4ecdc4'
            }}
          />
        )}

        {/* Labels */}
        {statLabels.map((label, i) => (
          <text
            key={label}
            className="radar-label"
            x={labelPositions[i].x}
            y={labelPositions[i].y}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Stat comparison bar
const StatCompareBar = ({ name, value1, value2, max = 255 }) => {
  const percent1 = (value1 / max) * 100;
  const percent2 = (value2 / max) * 100;
  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;

  return (
    <div className="stat-compare-row">
      <div className={`stat-value left ${winner === 1 ? 'winner' : ''}`}>
        {value1}
        {winner === 1 && <span className="winner-badge">+{value1 - value2}</span>}
      </div>
      <div className="stat-bars">
        <div className="stat-bar-container left">
          <div 
            className="stat-bar-fill left" 
            style={{ width: `${percent1}%` }}
          ></div>
        </div>
        <span className="stat-name">{name}</span>
        <div className="stat-bar-container right">
          <div 
            className="stat-bar-fill right" 
            style={{ width: `${percent2}%` }}
          ></div>
        </div>
      </div>
      <div className={`stat-value right ${winner === 2 ? 'winner' : ''}`}>
        {value2}
        {winner === 2 && <span className="winner-badge">+{value2 - value1}</span>}
      </div>
    </div>
  );
};

// Pokemon selector card
const PokemonSelector = ({ pokemon, position, onSearch, loading, error }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handleSelect = (pokemonName) => {
    setInput(pokemonName);
    onSearch(pokemonName);
  };

  const typeColor = pokemon ? (typeColors[pokemon.type]?.primary || '#888') : '#888';

  return (
    <div 
      className={`pokemon-selector ${position}`}
      style={{ '--type-color': typeColor }}
    >
      <div className="selector-search">
        <PokemonSearchInput
          value={input}
          onChange={setInput}
          onSelect={handleSelect}
          onSubmit={handleSubmit}
          placeholder="Enter Pokémon name..."
          className="selector-input"
        />
        <button type="button" onClick={handleSubmit} className="selector-btn" disabled={loading}>
          {loading ? '...' : '🔍'}
        </button>
      </div>

      {error && <p className="selector-error">{error}</p>}

      {pokemon ? (
        <div className="selected-pokemon">
          <div className="pokemon-image-container">
            <img src={pokemon.image} alt={pokemon.name} />
          </div>
          <h3 className="pokemon-name">{pokemon.name}</h3>
          <p className="pokemon-id">#{String(pokemon.id).padStart(3, '0')}</p>
          <div className="pokemon-types">
            {pokemon.types.map(type => (
              <span key={type} className={`type-badge type-${type}`}>
                {type}
              </span>
            ))}
          </div>
          <div className="total-stats">
            <span className="total-label">Total Stats</span>
            <span className="total-value">
              {Object.values(pokemon.stats).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-selector">
          <div className="empty-icon">❓</div>
          <p>Select a Pokémon to compare</p>
        </div>
      )}
    </div>
  );
};

// Type matchup calculator
const TypeMatchup = ({ pokemon1, pokemon2 }) => {
  if (!pokemon1 || !pokemon2) return null;

  // Calculate how pokemon1's types fare against pokemon2's types offensively
  const getOffensiveMultiplier = (attackerTypes, defenderTypes) => {
    let maxMultiplier = 1;
    
    attackerTypes.forEach(attackType => {
      let multiplier = 1;
      defenderTypes.forEach(defType => {
        const effectiveness = {
          normal: { rock: 0.5, ghost: 0, steel: 0.5 },
          fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
          water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
          electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
          grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
          ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
          fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
          poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
          ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
          flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
          psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
          bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
          rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
          ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
          dragon: { dragon: 2, steel: 0.5, fairy: 0 },
          dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
          steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
          fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
        };
        
        const eff = effectiveness[attackType]?.[defType];
        if (eff !== undefined) {
          multiplier *= eff;
        }
      });
      
      if (multiplier > maxMultiplier) {
        maxMultiplier = multiplier;
      }
    });
    
    return maxMultiplier;
  };

  const p1VsP2 = getOffensiveMultiplier(pokemon1.types, pokemon2.types);
  const p2VsP1 = getOffensiveMultiplier(pokemon2.types, pokemon1.types);

  const getMatchupText = (multiplier) => {
    if (multiplier >= 4) return { text: '4× Super Effective!', class: 'super-effective-4x' };
    if (multiplier >= 2) return { text: '2× Super Effective', class: 'super-effective' };
    if (multiplier === 0) return { text: 'No Effect', class: 'immune' };
    if (multiplier <= 0.25) return { text: '¼× Not Effective', class: 'not-effective-4x' };
    if (multiplier <= 0.5) return { text: '½× Not Effective', class: 'not-effective' };
    return { text: '1× Neutral', class: 'neutral' };
  };

  const matchup1 = getMatchupText(p1VsP2);
  const matchup2 = getMatchupText(p2VsP1);

  return (
    <div className="type-matchup-section">
      <h3 className="matchup-title">⚔️ Type Matchup</h3>
      
      <div className="matchup-display">
        <div className="matchup-card">
          <div className="matchup-header">
            <img src={pokemon1.sprite} alt={pokemon1.name} className="matchup-sprite" />
            <span>vs</span>
            <img src={pokemon2.sprite} alt={pokemon2.name} className="matchup-sprite" />
          </div>
          <div className={`matchup-result ${matchup1.class}`}>
            <span className="attacker-name">{pokemon1.name}</span>
            <span className="arrow">→</span>
            <span className="matchup-text">{matchup1.text}</span>
          </div>
        </div>

        <div className="matchup-card">
          <div className="matchup-header">
            <img src={pokemon2.sprite} alt={pokemon2.name} className="matchup-sprite" />
            <span>vs</span>
            <img src={pokemon1.sprite} alt={pokemon1.name} className="matchup-sprite" />
          </div>
          <div className={`matchup-result ${matchup2.class}`}>
            <span className="attacker-name">{pokemon2.name}</span>
            <span className="arrow">→</span>
            <span className="matchup-text">{matchup2.text}</span>
          </div>
        </div>
      </div>

      {/* Verdict */}
      <div className="matchup-verdict">
        {p1VsP2 > p2VsP1 && (
          <p className="verdict winner-1">
            <span className="verdict-icon">🏆</span>
            <strong>{pokemon1.name}</strong> has the type advantage!
          </p>
        )}
        {p2VsP1 > p1VsP2 && (
          <p className="verdict winner-2">
            <span className="verdict-icon">🏆</span>
            <strong>{pokemon2.name}</strong> has the type advantage!
          </p>
        )}
        {p1VsP2 === p2VsP1 && (
          <p className="verdict tie">
            <span className="verdict-icon">⚖️</span>
            It's an even type matchup!
          </p>
        )}
      </div>
    </div>
  );
};

export const ComparePage = () => {
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');

  const searchPokemon1 = useCallback(async (query) => {
    setLoading1(true);
    setError1('');
    try {
      const data = await fetchPokemonWithEvolution(query);
      setPokemon1(data);
    } catch (err) {
      setError1('Pokémon not found');
    } finally {
      setLoading1(false);
    }
  }, []);

  const searchPokemon2 = useCallback(async (query) => {
    setLoading2(true);
    setError2('');
    try {
      const data = await fetchPokemonWithEvolution(query);
      setPokemon2(data);
    } catch (err) {
      setError2('Pokémon not found');
    } finally {
      setLoading2(false);
    }
  }, []);

  const bothSelected = pokemon1 && pokemon2;

  return (
    <div className="compare-page">
      {/* Header */}
      <div className="compare-header">
        <h1 className="page-title">
          <span className="title-icon">⚖️</span>
          Compare Pokémon
        </h1>
        <p className="page-subtitle">Select two Pokémon to compare their stats and type matchups</p>
      </div>

      {/* Selector cards */}
      <div className="selectors-container">
        <PokemonSelector
          pokemon={pokemon1}
          position="left"
          onSearch={searchPokemon1}
          loading={loading1}
          error={error1}
        />
        
        <div className="vs-divider">
          <span className="vs-text">VS</span>
        </div>
        
        <PokemonSelector
          pokemon={pokemon2}
          position="right"
          onSearch={searchPokemon2}
          loading={loading2}
          error={error2}
        />
      </div>

      {/* Comparison sections */}
      {bothSelected && (
        <div className="comparison-results">
          {/* Radar Chart */}
          <div className="comparison-section radar-section">
            <h3 className="section-title">📊 Stat Overview</h3>
            <div className="radar-legend">
              <div className="legend-item">
                <span 
                  className="legend-color"
                  style={{ background: typeColors[pokemon1.type]?.primary || '#ff6b6b' }}
                ></span>
                <span>{pokemon1.name}</span>
              </div>
              <div className="legend-item">
                <span 
                  className="legend-color"
                  style={{ background: typeColors[pokemon2.type]?.primary || '#4ecdc4' }}
                ></span>
                <span>{pokemon2.name}</span>
              </div>
            </div>
            <StatRadarChart pokemon1={pokemon1} pokemon2={pokemon2} />
          </div>

          {/* Stat bars comparison */}
          <div className="comparison-section stats-section">
            <h3 className="section-title">📈 Stat Comparison</h3>
            <div className="stats-comparison">
              <StatCompareBar name="HP" value1={pokemon1.stats.hp} value2={pokemon2.stats.hp} />
              <StatCompareBar name="Attack" value1={pokemon1.stats.attack} value2={pokemon2.stats.attack} />
              <StatCompareBar name="Defense" value1={pokemon1.stats.defense} value2={pokemon2.stats.defense} />
              <StatCompareBar name="Sp. Atk" value1={pokemon1.stats.specialAttack} value2={pokemon2.stats.specialAttack} />
              <StatCompareBar name="Sp. Def" value1={pokemon1.stats.specialDefense} value2={pokemon2.stats.specialDefense} />
              <StatCompareBar name="Speed" value1={pokemon1.stats.speed} value2={pokemon2.stats.speed} />
            </div>
          </div>

          {/* Type Matchup */}
          <TypeMatchup pokemon1={pokemon1} pokemon2={pokemon2} />

          {/* Physical comparison */}
          <div className="comparison-section physical-section">
            <h3 className="section-title">📐 Physical Attributes</h3>
            <div className="physical-comparison">
              <div className="physical-row">
                <span className="attr-value left">{pokemon1.height}m</span>
                <span className="attr-name">📏 Height</span>
                <span className="attr-value right">{pokemon2.height}m</span>
              </div>
              <div className="physical-row">
                <span className="attr-value left">{pokemon1.weight}kg</span>
                <span className="attr-name">⚖️ Weight</span>
                <span className="attr-value right">{pokemon2.weight}kg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick compare suggestions */}
      {!bothSelected && (
        <div className="compare-suggestions">
          <h3>Popular Comparisons</h3>
          <div className="suggestion-pairs">
            {[
              ['Pikachu', 'Eevee'],
              ['Charizard', 'Blastoise'],
              ['Mewtwo', 'Mew'],
              ['Garchomp', 'Dragonite'],
            ].map(([p1, p2]) => (
              <button
                key={`${p1}-${p2}`}
                className="suggestion-btn"
                onClick={() => {
                  searchPokemon1(p1);
                  searchPokemon2(p2);
                }}
              >
                <span>{p1}</span>
                <span className="vs">vs</span>
                <span>{p2}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
