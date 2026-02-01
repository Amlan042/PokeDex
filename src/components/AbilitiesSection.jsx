// AbilitiesSection.jsx - Display Pokemon abilities with detailed descriptions
import React, { useState, useEffect } from 'react';
import { fetchAbilityDetails } from '../Pokemon';

const AbilityCard = ({ ability, details, isHidden }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`ability-card ${isHidden ? 'hidden-ability' : ''} ${expanded ? 'expanded' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="ability-header">
        <div className="ability-name-row">
          <span className="ability-name">{ability.replace(/-/g, ' ')}</span>
          {isHidden && (
            <span className="hidden-badge">Hidden</span>
          )}
        </div>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>
      
      {details && (
        <div className={`ability-details ${expanded ? 'visible' : ''}`}>
          {details.shortEffect && (
            <p className="ability-short-effect">{details.shortEffect}</p>
          )}
          {expanded && details.effect && details.effect !== details.shortEffect && (
            <p className="ability-full-effect">{details.effect}</p>
          )}
        </div>
      )}
      
      {!details && (
        <div className="ability-loading">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </div>
      )}
    </div>
  );
};

const AbilitiesSection = ({ abilitiesDetailed }) => {
  const [abilityDetails, setAbilityDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAbilityDetails = async () => {
      if (!abilitiesDetailed || abilitiesDetailed.length === 0) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const details = {};
      
      try {
        await Promise.all(
          abilitiesDetailed.map(async (ability) => {
            const data = await fetchAbilityDetails(ability.url);
            if (data) {
              details[ability.name] = data;
            }
          })
        );
        
        setAbilityDetails(details);
      } catch (error) {
        console.error('Error loading ability details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAbilityDetails();
  }, [abilitiesDetailed]);

  if (!abilitiesDetailed || abilitiesDetailed.length === 0) {
    return null;
  }

  // Separate normal and hidden abilities
  const normalAbilities = abilitiesDetailed.filter(a => !a.isHidden);
  const hiddenAbilities = abilitiesDetailed.filter(a => a.isHidden);

  return (
    <div className="abilities-section-detailed">
      <h4 className="section-label">
        <span className="label-icon">🎯</span>
        Abilities
      </h4>
      
      <div className="abilities-grid">
        {normalAbilities.map(ability => (
          <AbilityCard
            key={ability.name}
            ability={ability.name}
            details={abilityDetails[ability.name]}
            isHidden={false}
          />
        ))}
        
        {hiddenAbilities.map(ability => (
          <AbilityCard
            key={ability.name}
            ability={ability.name}
            details={abilityDetails[ability.name]}
            isHidden={true}
          />
        ))}
      </div>
      
      {hiddenAbilities.length > 0 && (
        <p className="hidden-ability-note">
          <span className="note-icon">💡</span>
          Hidden Abilities are special abilities that can be obtained through special methods like Hidden Grottos, Friend Safari, or breeding.
        </p>
      )}
    </div>
  );
};

export default AbilitiesSection;
