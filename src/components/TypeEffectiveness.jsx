// TypeEffectiveness.jsx - Modern display of Pokemon weaknesses and resistances
import React from 'react';

const TypeBadge = ({ type, multiplier, index = 0 }) => {
  const getMultiplierDisplay = () => {
    if (multiplier === 4) return '4×';
    if (multiplier === 2) return '2×';
    if (multiplier === 0.5) return '½×';
    if (multiplier === 0.25) return '¼×';
    if (multiplier === 0) return '0×';
    return '';
  };

  const getMultiplierClass = () => {
    if (multiplier >= 4) return 'extreme';
    if (multiplier >= 2) return 'strong';
    if (multiplier <= 0.25) return 'very-resistant';
    if (multiplier <= 0.5) return 'resistant';
    if (multiplier === 0) return 'immune';
    return '';
  };

  return (
    <div 
      className={`type-eff-badge type-${type} ${getMultiplierClass()}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <span className="badge-type-name">{type}</span>
      {multiplier !== undefined && (
        <span className="badge-multiplier">{getMultiplierDisplay()}</span>
      )}
    </div>
  );
};

const EffectivenessCategory = ({ title, icon, description, types, color, emptyMessage }) => {
  if (!types || types.length === 0) return null;

  return (
    <div className="effectiveness-category" style={{ '--category-color': color }}>
      <div className="category-header">
        <div className="category-icon">{icon}</div>
        <div className="category-info">
          <h4 className="category-title">{title}</h4>
          <p className="category-description">{description}</p>
        </div>
        <div className="category-count">{types.length}</div>
      </div>
      <div className="category-badges">
        {types.map(([type, multiplier], index) => (
          <TypeBadge 
            key={type} 
            type={type} 
            multiplier={multiplier} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

const TypeEffectiveness = ({ weaknesses, resistances, immunities }) => {
  const hasWeaknesses = weaknesses && Object.keys(weaknesses).length > 0;
  const hasResistances = resistances && Object.keys(resistances).length > 0;
  const hasImmunities = immunities && immunities.length > 0;

  if (!hasWeaknesses && !hasResistances && !hasImmunities) {
    return null;
  }

  // Sort weaknesses (4x first, then 2x)
  const sortedWeaknesses = Object.entries(weaknesses || {})
    .sort(([, a], [, b]) => b - a);
  
  // Sort resistances (0.25x first, then 0.5x)
  const sortedResistances = Object.entries(resistances || {})
    .sort(([, a], [, b]) => a - b);

  // Convert immunities to same format
  const immunityEntries = (immunities || []).map(type => [type, 0]);

  return (
    <div className="type-effectiveness-modern">
      <div className="effectiveness-header">
        <div className="effectiveness-icon">⚔️</div>
        <div className="effectiveness-title-group">
          <h3 className="effectiveness-title">Type Matchups</h3>
          <p className="effectiveness-subtitle">Damage multipliers in battle</p>
        </div>
      </div>
      
      <div className="effectiveness-grid">
        <EffectivenessCategory
          title="Weaknesses"
          icon="🔥"
          description="Takes increased damage"
          types={sortedWeaknesses}
          color="#ff6b6b"
        />
        
        <EffectivenessCategory
          title="Resistances"
          icon="🛡️"
          description="Takes reduced damage"
          types={sortedResistances}
          color="#48dbfb"
        />
        
        {hasImmunities && (
          <EffectivenessCategory
            title="Immunities"
            icon="✨"
            description="Takes no damage"
            types={immunityEntries}
            color="#f093fb"
          />
        )}
      </div>
    </div>
  );
};

export default TypeEffectiveness;
