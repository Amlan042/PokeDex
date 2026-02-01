// PokemonBuildEditor.jsx - Configure Nature, IVs, EVs, Moves for team Pokemon
import React, { useState, useEffect, useMemo } from 'react';
import { useTeam, NATURES, calculateStat } from '../context/TeamContext';
import { fetchPokemonMoves, fetchAbilityDetails } from '../Pokemon';
import { typeColors } from '../utils/typeColors';

// Stat names mapping
const STAT_NAMES = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp. Atk',
  specialDefense: 'Sp. Def',
  speed: 'Speed',
};

const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];

// IV/EV Slider Component
const StatSlider = ({ stat, label, value, max, onChange, color, isEV = false }) => {
  return (
    <div className="stat-slider">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <input
          type="number"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(0, parseInt(e.target.value) || 0)))}
          className="slider-value-input"
        />
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider-range"
        style={{ '--slider-color': color }}
      />
      {isEV && (
        <div className="slider-marks">
          <span>0</span>
          <span>252</span>
        </div>
      )}
    </div>
  );
};

// Move Selector Component
const MoveSelector = ({ index, selectedMove, availableMoves, onChange, loading }) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const filteredMoves = useMemo(() => {
    if (!search) return availableMoves.slice(0, 50);
    return availableMoves.filter(move => 
      move.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50);
  }, [availableMoves, search]);
  
  const selectedMoveData = availableMoves.find(m => m.name === selectedMove);
  
  return (
    <div className="move-selector">
      <div className="move-slot-header">
        <span className="move-slot-num">Move {index + 1}</span>
      </div>
      
      <div className="move-dropdown">
        <button 
          className={`move-dropdown-trigger ${selectedMove ? 'has-move' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          style={selectedMoveData ? { '--move-color': typeColors[selectedMoveData.type]?.primary } : {}}
        >
          {selectedMove ? (
            <>
              <span className={`move-type-badge type-${selectedMoveData?.type}`}>
                {selectedMoveData?.type}
              </span>
              <span className="move-name">{selectedMove}</span>
              {selectedMoveData && (
                <span className="move-power">
                  {selectedMoveData.power || '—'}
                </span>
              )}
            </>
          ) : (
            <span className="placeholder">Select a move...</span>
          )}
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
        
        {isOpen && (
          <div className="move-dropdown-menu">
            <input
              type="text"
              placeholder="Search moves..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="move-search"
              autoFocus
            />
            
            {loading ? (
              <div className="move-loading">Loading moves...</div>
            ) : (
              <div className="move-list">
                <button 
                  className="move-option clear-option"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                >
                  — Clear —
                </button>
                {filteredMoves.map(move => (
                  <button
                    key={move.name}
                    className={`move-option ${selectedMove === move.name ? 'selected' : ''}`}
                    onClick={() => { onChange(move.name); setIsOpen(false); setSearch(''); }}
                  >
                    <span className={`move-type-dot type-${move.type}`}></span>
                    <span className="move-name">{move.name}</span>
                    <span className="move-category">{move.damageClass}</span>
                    <span className="move-power">{move.power || '—'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PokemonBuildEditor = ({ pokemon, onClose }) => {
  const { updatePokemonBuild, updatePokemonMoves, updatePokemonIVs, updatePokemonEVs } = useTeam();
  
  // Local state for editing
  const [level, setLevel] = useState(pokemon.level || 100);
  const [nature, setNature] = useState(pokemon.nature || 'hardy');
  const [ability, setAbility] = useState(pokemon.ability || '');
  const [item, setItem] = useState(pokemon.item || '');
  const [nickname, setNickname] = useState(pokemon.nickname || '');
  const [ivs, setIvs] = useState(pokemon.ivs || { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 });
  const [evs, setEvs] = useState(pokemon.evs || { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 });
  const [moves, setMoves] = useState(pokemon.moves || ['', '', '', '']);
  
  // Available moves from API
  const [availableMoves, setAvailableMoves] = useState([]);
  const [loadingMoves, setLoadingMoves] = useState(true);
  
  // Ability details
  const [abilities, setAbilities] = useState([]);
  
  // Calculate total EVs
  const totalEVs = Object.values(evs).reduce((a, b) => a + b, 0);
  const remainingEVs = 510 - totalEVs;
  
  // Fetch moves on mount
  useEffect(() => {
    const loadMoves = async () => {
      setLoadingMoves(true);
      try {
        const movesData = await fetchPokemonMoves(pokemon.id);
        // Flatten all move categories
        const allMoves = [
          ...(movesData.levelUp || []),
          ...(movesData.tm || []),
          ...(movesData.egg || []),
          ...(movesData.tutor || []),
        ];
        // Remove duplicates
        const uniqueMoves = Array.from(new Map(allMoves.map(m => [m.name, m])).values());
        setAvailableMoves(uniqueMoves.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) {
        console.error('Failed to load moves:', err);
      } finally {
        setLoadingMoves(false);
      }
    };
    loadMoves();
  }, [pokemon.id]);
  
  // Set abilities from pokemon data
  useEffect(() => {
    if (pokemon.abilities) {
      setAbilities(pokemon.abilities);
      if (!ability && pokemon.abilities.length > 0) {
        setAbility(pokemon.abilities[0]);
      }
    }
  }, [pokemon.abilities]);
  
  // Calculate final stats
  const calculatedStats = useMemo(() => {
    if (!pokemon.stats) return null;
    
    return {
      hp: calculateStat(pokemon.stats.hp, level, ivs.hp, evs.hp, nature, 'hp', true),
      attack: calculateStat(pokemon.stats.attack, level, ivs.attack, evs.attack, nature, 'attack'),
      defense: calculateStat(pokemon.stats.defense, level, ivs.defense, evs.defense, nature, 'defense'),
      specialAttack: calculateStat(pokemon.stats.specialAttack, level, ivs.specialAttack, evs.specialAttack, nature, 'specialAttack'),
      specialDefense: calculateStat(pokemon.stats.specialDefense, level, ivs.specialDefense, evs.specialDefense, nature, 'specialDefense'),
      speed: calculateStat(pokemon.stats.speed, level, ivs.speed, evs.speed, nature, 'speed'),
    };
  }, [pokemon.stats, level, ivs, evs, nature]);
  
  // Handle EV change with validation
  const handleEVChange = (stat, value) => {
    const newValue = Math.min(252, Math.max(0, value));
    const otherEVs = Object.entries(evs)
      .filter(([key]) => key !== stat)
      .reduce((sum, [, val]) => sum + val, 0);
    
    // Cap at 510 total
    if (otherEVs + newValue <= 510) {
      setEvs(prev => ({ ...prev, [stat]: newValue }));
    } else {
      setEvs(prev => ({ ...prev, [stat]: 510 - otherEVs }));
    }
  };
  
  // Handle move change
  const handleMoveChange = (index, moveName) => {
    setMoves(prev => {
      const newMoves = [...prev];
      newMoves[index] = moveName;
      return newMoves;
    });
  };
  
  // Save changes
  const handleSave = () => {
    updatePokemonBuild(pokemon.id, {
      level,
      nature,
      ability,
      item,
      nickname,
    });
    updatePokemonIVs(pokemon.id, ivs);
    updatePokemonEVs(pokemon.id, evs);
    updatePokemonMoves(pokemon.id, moves);
    onClose();
  };
  
  // Quick EV spreads
  const applyEVSpread = (spread) => {
    setEvs(spread);
  };
  
  const EV_PRESETS = [
    { name: 'Sweeper (Physical)', evs: { hp: 0, attack: 252, defense: 0, specialAttack: 0, specialDefense: 0, speed: 252 } },
    { name: 'Sweeper (Special)', evs: { hp: 0, attack: 0, defense: 0, specialAttack: 252, specialDefense: 0, speed: 252 } },
    { name: 'Tank (Physical)', evs: { hp: 252, attack: 0, defense: 252, specialAttack: 0, specialDefense: 0, speed: 0 } },
    { name: 'Tank (Special)', evs: { hp: 252, attack: 0, defense: 0, specialAttack: 0, specialDefense: 252, speed: 0 } },
    { name: 'Balanced', evs: { hp: 84, attack: 84, defense: 84, specialAttack: 84, specialDefense: 84, speed: 84 } },
    { name: 'Clear All', evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } },
  ];
  
  return (
    <div className="build-editor-overlay">
      <div className="build-editor">
        <button className="close-btn" onClick={onClose}>✕</button>
        
        {/* Header */}
        <div className="editor-header">
          <img src={pokemon.image} alt={pokemon.name} className="pokemon-sprite" />
          <div className="pokemon-info">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={pokemon.name}
              className="nickname-input"
            />
            <span className="pokemon-species">{pokemon.name}</span>
            <div className="pokemon-types">
              {pokemon.types?.map(type => (
                <span key={type} className={`type-badge type-${type}`}>{type}</span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Main Config */}
        <div className="editor-sections">
          {/* Basic Config */}
          <div className="editor-section">
            <h3>Basic Configuration</h3>
            <div className="config-grid">
              <div className="config-field">
                <label>Level</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={level}
                  onChange={(e) => setLevel(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              
              <div className="config-field">
                <label>Nature</label>
                <select value={nature} onChange={(e) => setNature(e.target.value)}>
                  {Object.entries(NATURES).map(([key, { name, increased, decreased }]) => (
                    <option key={key} value={key}>
                      {name} {increased && `(+${STAT_NAMES[increased]}, -${STAT_NAMES[decreased]})`}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="config-field">
                <label>Ability</label>
                <select value={ability} onChange={(e) => setAbility(e.target.value)}>
                  <option value="">Select ability...</option>
                  {abilities.map(ab => (
                    <option key={ab} value={ab}>{ab}</option>
                  ))}
                </select>
              </div>
              
              <div className="config-field">
                <label>Held Item</label>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="e.g. Leftovers"
                />
              </div>
            </div>
          </div>
          
          {/* Moves */}
          <div className="editor-section">
            <h3>Moves</h3>
            <div className="moves-grid">
              {[0, 1, 2, 3].map(i => (
                <MoveSelector
                  key={i}
                  index={i}
                  selectedMove={moves[i]}
                  availableMoves={availableMoves}
                  onChange={(move) => handleMoveChange(i, move)}
                  loading={loadingMoves}
                />
              ))}
            </div>
          </div>
          
          {/* EVs */}
          <div className="editor-section">
            <h3>
              EVs (Effort Values)
              <span className={`ev-counter ${remainingEVs < 0 ? 'over' : ''}`}>
                {totalEVs}/510 ({remainingEVs} remaining)
              </span>
            </h3>
            <div className="ev-presets">
              {EV_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  className="preset-btn"
                  onClick={() => applyEVSpread(preset.evs)}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="stats-grid">
              {STAT_KEYS.map((stat, i) => (
                <StatSlider
                  key={stat}
                  stat={stat}
                  label={STAT_NAMES[stat]}
                  value={evs[stat]}
                  max={252}
                  onChange={(value) => handleEVChange(stat, value)}
                  color={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'][i]}
                  isEV
                />
              ))}
            </div>
          </div>
          
          {/* IVs */}
          <div className="editor-section">
            <h3>
              IVs (Individual Values)
              <button 
                className="max-ivs-btn"
                onClick={() => setIvs({ hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 })}
              >
                Max All
              </button>
            </h3>
            <div className="stats-grid">
              {STAT_KEYS.map((stat, i) => (
                <StatSlider
                  key={stat}
                  stat={stat}
                  label={STAT_NAMES[stat]}
                  value={ivs[stat]}
                  max={31}
                  onChange={(value) => setIvs(prev => ({ ...prev, [stat]: value }))}
                  color={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'][i]}
                />
              ))}
            </div>
          </div>
          
          {/* Calculated Stats Preview */}
          {calculatedStats && (
            <div className="editor-section">
              <h3>Final Stats (Lv. {level})</h3>
              <div className="final-stats">
                {STAT_KEYS.map((stat, i) => {
                  const isIncreased = NATURES[nature]?.increased === stat;
                  const isDecreased = NATURES[nature]?.decreased === stat;
                  return (
                    <div key={stat} className="final-stat">
                      <span className="stat-name">{STAT_NAMES[stat]}</span>
                      <div className="stat-bar-container">
                        <div 
                          className="stat-bar"
                          style={{ 
                            width: `${Math.min(100, (calculatedStats[stat] / 500) * 100)}%`,
                            background: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'][i]
                          }}
                        />
                      </div>
                      <span className={`stat-value ${isIncreased ? 'increased' : ''} ${isDecreased ? 'decreased' : ''}`}>
                        {calculatedStats[stat]}
                        {isIncreased && ' ↑'}
                        {isDecreased && ' ↓'}
                      </span>
                    </div>
                  );
                })}
                <div className="total-stat">
                  <span>Total</span>
                  <span>{Object.values(calculatedStats).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="editor-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default PokemonBuildEditor;
