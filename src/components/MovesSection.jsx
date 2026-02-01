// MovesSection.jsx - Display Pokemon moves organized by learn method
import React, { useState, useEffect } from 'react';
import { fetchPokemonMoves, fetchMoveDetails } from '../Pokemon';
import { typeColors } from '../utils/typeColors';

const MoveCard = ({ move, expanded, onToggle }) => {
  const typeColor = typeColors[move.type]?.primary || typeColors.normal.primary;
  
  return (
    <div 
      className={`move-card ${expanded ? 'expanded' : ''}`}
      onClick={onToggle}
      style={{ '--move-type-color': typeColor }}
    >
      <div className="move-header">
        <span className={`move-type-badge type-${move.type}`}>
          {move.type}
        </span>
        <span className="move-name">{move.name.replace(/-/g, ' ')}</span>
        {move.level > 0 && (
          <span className="move-level">Lv. {move.level}</span>
        )}
      </div>
      
      <div className="move-stats">
        <div className="move-stat">
          <span className="stat-label">PWR</span>
          <span className="stat-value">{move.power || '—'}</span>
        </div>
        <div className="move-stat">
          <span className="stat-label">ACC</span>
          <span className="stat-value">{move.accuracy ? `${move.accuracy}%` : '—'}</span>
        </div>
        <div className="move-stat">
          <span className="stat-label">PP</span>
          <span className="stat-value">{move.pp}</span>
        </div>
        <div className={`move-class ${move.damageClass}`}>
          {move.damageClass === 'physical' && '💥'}
          {move.damageClass === 'special' && '✨'}
          {move.damageClass === 'status' && '🔄'}
          <span>{move.damageClass}</span>
        </div>
      </div>
      
      {expanded && move.effect && (
        <div className="move-effect">
          <p>{move.effect.replace(/\$effect_chance/g, '10')}</p>
        </div>
      )}
    </div>
  );
};

const MovesSection = ({ moves, loading: externalLoading }) => {
  const [organizedMoves, setOrganizedMoves] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('levelUp');
  const [expandedMove, setExpandedMove] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadMoves = async () => {
      if (!moves || moves.length === 0) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const organized = await fetchPokemonMoves(moves, 40);
        setOrganizedMoves(organized);
      } catch (error) {
        console.error('Error loading moves:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMoves();
  }, [moves]);

  if (loading || externalLoading) {
    return (
      <div className="moves-section">
        <h3 className="section-title">
          <span className="title-icon">⚔️</span>
          Moves
        </h3>
        <div className="moves-loading">
          <div className="loading-spinner"></div>
          <p>Loading moves...</p>
        </div>
      </div>
    );
  }

  if (!organizedMoves) {
    return null;
  }

  const tabs = [
    { id: 'levelUp', label: 'Level Up', icon: '📈', count: organizedMoves.levelUp.length },
    { id: 'machine', label: 'TM/HM', icon: '💿', count: organizedMoves.machine.length },
    { id: 'egg', label: 'Egg', icon: '🥚', count: organizedMoves.egg.length },
    { id: 'tutor', label: 'Tutor', icon: '👨‍🏫', count: organizedMoves.tutor.length },
  ];

  const currentMoves = organizedMoves[activeTab] || [];
  const displayMoves = showAll ? currentMoves : currentMoves.slice(0, 10);

  return (
    <div className="moves-section">
      <h3 className="section-title">
        <span className="title-icon">⚔️</span>
        Moves
      </h3>
      
      <div className="moves-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`move-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setShowAll(false);
              setExpandedMove(null);
            }}
            disabled={tab.count === 0}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>
      
      <div className="moves-list">
        {displayMoves.length > 0 ? (
          <>
            {displayMoves.map((move, index) => (
              <MoveCard
                key={`${move.name}-${index}`}
                move={move}
                expanded={expandedMove === `${move.name}-${index}`}
                onToggle={() => setExpandedMove(
                  expandedMove === `${move.name}-${index}` ? null : `${move.name}-${index}`
                )}
              />
            ))}
            
            {currentMoves.length > 10 && (
              <button 
                className="show-more-btn"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `Show All (${currentMoves.length})`}
              </button>
            )}
          </>
        ) : (
          <div className="no-moves">
            <p>No moves learned by this method.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovesSection;
