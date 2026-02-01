// LocationsSection.jsx - Display Pokemon encounter locations
import React, { useState, useEffect } from 'react';
import { fetchPokemonLocations } from '../Pokemon';

// Game version colors for styling
const versionColors = {
  red: '#FF1111',
  blue: '#1111FF',
  yellow: '#FFD700',
  gold: '#DAA520',
  silver: '#C0C0C0',
  crystal: '#4FD9FF',
  ruby: '#A00000',
  sapphire: '#0000A0',
  emerald: '#00A000',
  firered: '#FF7327',
  leafgreen: '#00DD00',
  diamond: '#AAAAFF',
  pearl: '#FFAAAA',
  platinum: '#999999',
  heartgold: '#B69E00',
  soulsilver: '#C0C0E1',
  black: '#444444',
  white: '#E1E1E1',
  'black-2': '#424B50',
  'white-2': '#E3CED0',
  x: '#025DA6',
  y: '#EA1A3E',
  'omega-ruby': '#CF3025',
  'alpha-sapphire': '#26649C',
  sun: '#F1912B',
  moon: '#5599CA',
  'ultra-sun': '#E95B2B',
  'ultra-moon': '#226DB5',
  sword: '#00A1E9',
  shield: '#BF004F',
  scarlet: '#F34824',
  violet: '#8334B0',
};

const LocationCard = ({ location, expanded, onToggle }) => {
  return (
    <div 
      className={`location-card ${expanded ? 'expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="location-header">
        <span className="location-icon">📍</span>
        <span className="location-name">{location.locationName}</span>
        <span className="location-versions-count">
          {location.versions.length} game{location.versions.length !== 1 ? 's' : ''}
        </span>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </div>
      
      {expanded && (
        <div className="location-details">
          {location.versions.map(version => (
            <div 
              key={version.version} 
              className="version-encounter"
              style={{ '--version-color': versionColors[version.version] || '#888' }}
            >
              <div className="version-header">
                <span className="version-name">{version.version.replace(/-/g, ' ')}</span>
                <span className="max-chance">{version.maxChance}% max chance</span>
              </div>
              
              <div className="encounter-methods">
                {version.encounters.slice(0, 3).map((encounter, idx) => (
                  <div key={idx} className="encounter-method">
                    <span className="method-icon">
                      {encounter.method === 'walk' && '🚶'}
                      {encounter.method === 'surf' && '🏊'}
                      {encounter.method === 'old-rod' && '🎣'}
                      {encounter.method === 'good-rod' && '🎣'}
                      {encounter.method === 'super-rod' && '🎣'}
                      {encounter.method === 'rock-smash' && '🪨'}
                      {encounter.method === 'headbutt' && '🌳'}
                      {!['walk', 'surf', 'old-rod', 'good-rod', 'super-rod', 'rock-smash', 'headbutt'].includes(encounter.method) && '❓'}
                    </span>
                    <span className="method-name">{encounter.method.replace(/-/g, ' ')}</span>
                    <span className="level-range">
                      Lv. {encounter.minLevel === encounter.maxLevel 
                        ? encounter.minLevel 
                        : `${encounter.minLevel}-${encounter.maxLevel}`}
                    </span>
                    <span className="encounter-chance">{encounter.chance}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LocationsSection = ({ pokemonId }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLocation, setExpandedLocation] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadLocations = async () => {
      if (!pokemonId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const locationData = await fetchPokemonLocations(pokemonId);
        setLocations(locationData);
      } catch (error) {
        console.error('Error loading locations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [pokemonId]);

  if (loading) {
    return (
      <div className="locations-section">
        <h4 className="section-label">
          <span className="label-icon">🗺️</span>
          Encounter Locations
        </h4>
        <div className="locations-loading">
          <div className="loading-spinner small"></div>
          <span>Finding locations...</span>
        </div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="locations-section">
        <h4 className="section-label">
          <span className="label-icon">🗺️</span>
          Encounter Locations
        </h4>
        <div className="no-locations">
          <span className="no-data-icon">🔮</span>
          <p>This Pokémon cannot be encountered in the wild.</p>
          <span className="no-data-hint">It may be obtained through special events, evolution, or trading.</span>
        </div>
      </div>
    );
  }

  const displayLocations = showAll ? locations : locations.slice(0, 5);

  return (
    <div className="locations-section">
      <h4 className="section-label">
        <span className="label-icon">🗺️</span>
        Encounter Locations
        <span className="location-count">({locations.length})</span>
      </h4>
      
      <div className="locations-list">
        {displayLocations.map((location, index) => (
          <LocationCard
            key={location.locationName}
            location={location}
            expanded={expandedLocation === index}
            onToggle={() => setExpandedLocation(
              expandedLocation === index ? null : index
            )}
          />
        ))}
      </div>
      
      {locations.length > 5 && (
        <button 
          className="show-more-locations"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show Less' : `Show All Locations (${locations.length})`}
        </button>
      )}
    </div>
  );
};

export default LocationsSection;
