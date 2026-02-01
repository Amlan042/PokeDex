// TeamContext.jsx - Global state for team management
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getTeam, saveTeam } from '../utils/localStorage';
import { calculateTypeEffectiveness } from '../utils/typeColors';

const TeamContext = createContext(null);

export const MAX_TEAM_SIZE = 6;

// Pokemon Natures with stat modifications
export const NATURES = {
  hardy: { name: 'Hardy', increased: null, decreased: null },
  lonely: { name: 'Lonely', increased: 'attack', decreased: 'defense' },
  brave: { name: 'Brave', increased: 'attack', decreased: 'speed' },
  adamant: { name: 'Adamant', increased: 'attack', decreased: 'specialAttack' },
  naughty: { name: 'Naughty', increased: 'attack', decreased: 'specialDefense' },
  bold: { name: 'Bold', increased: 'defense', decreased: 'attack' },
  docile: { name: 'Docile', increased: null, decreased: null },
  relaxed: { name: 'Relaxed', increased: 'defense', decreased: 'speed' },
  impish: { name: 'Impish', increased: 'defense', decreased: 'specialAttack' },
  lax: { name: 'Lax', increased: 'defense', decreased: 'specialDefense' },
  timid: { name: 'Timid', increased: 'speed', decreased: 'attack' },
  hasty: { name: 'Hasty', increased: 'speed', decreased: 'defense' },
  serious: { name: 'Serious', increased: null, decreased: null },
  jolly: { name: 'Jolly', increased: 'speed', decreased: 'specialAttack' },
  naive: { name: 'Naive', increased: 'speed', decreased: 'specialDefense' },
  modest: { name: 'Modest', increased: 'specialAttack', decreased: 'attack' },
  mild: { name: 'Mild', increased: 'specialAttack', decreased: 'defense' },
  quiet: { name: 'Quiet', increased: 'specialAttack', decreased: 'speed' },
  bashful: { name: 'Bashful', increased: null, decreased: null },
  rash: { name: 'Rash', increased: 'specialAttack', decreased: 'specialDefense' },
  calm: { name: 'Calm', increased: 'specialDefense', decreased: 'attack' },
  gentle: { name: 'Gentle', increased: 'specialDefense', decreased: 'defense' },
  sassy: { name: 'Sassy', increased: 'specialDefense', decreased: 'speed' },
  careful: { name: 'Careful', increased: 'specialDefense', decreased: 'specialAttack' },
  quirky: { name: 'Quirky', increased: null, decreased: null },
};

// Calculate stat with IVs, EVs, and Nature
export const calculateStat = (baseStat, level, iv, ev, nature, statName, isHP = false) => {
  const natureMultiplier = NATURES[nature]?.increased === statName 
    ? 1.1 
    : NATURES[nature]?.decreased === statName 
      ? 0.9 
      : 1.0;
  
  if (isHP) {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  
  return Math.floor((Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100) + 5) * natureMultiplier);
};

export const TeamProvider = ({ children }) => {
  const [team, setTeam] = useState([]);
  const [notification, setNotification] = useState(null);

  // Load team from localStorage on mount
  useEffect(() => {
    const storedTeam = getTeam();
    setTeam(storedTeam);
  }, []);

  // Show notification temporarily
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Add a Pokemon to team
  const addToTeam = useCallback((pokemon) => {
    setTeam(prev => {
      if (prev.length >= MAX_TEAM_SIZE) {
        showNotification('Team is full! Maximum 6 Pokémon allowed.', 'error');
        return prev;
      }
      if (prev.find(p => p.id === pokemon.id)) {
        showNotification('This Pokémon is already on your team!', 'warning');
        return prev;
      }
      const newTeam = [...prev, {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        sprite: pokemon.sprite,
        types: pokemon.types,
        type: pokemon.type || pokemon.types[0],
        stats: pokemon.stats,
        // Build configuration
        level: 100,
        nature: 'hardy',
        ability: pokemon.abilities?.[0] || '',
        item: '',
        moves: ['', '', '', ''],
        ivs: { hp: 31, attack: 31, defense: 31, specialAttack: 31, specialDefense: 31, speed: 31 },
        evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
        nickname: '',
      }];
      saveTeam(newTeam);
      showNotification(`${pokemon.name} added to team!`, 'success');
      return newTeam;
    });
  }, [showNotification]);

  // Remove a Pokemon from team
  const removeFromTeam = useCallback((pokemonId) => {
    setTeam(prev => {
      const pokemon = prev.find(p => p.id === pokemonId);
      const newTeam = prev.filter(p => p.id !== pokemonId);
      saveTeam(newTeam);
      if (pokemon) {
        showNotification(`${pokemon.name} removed from team.`, 'info');
      }
      return newTeam;
    });
  }, [showNotification]);

  // Check if a Pokemon is on team
  const isOnTeam = useCallback((pokemonId) => {
    return team.some(p => p.id === pokemonId);
  }, [team]);

  // Clear the entire team
  const clearTeam = useCallback(() => {
    setTeam([]);
    saveTeam([]);
    showNotification('Team cleared!', 'info');
  }, [showNotification]);

  // Update a Pokemon's build configuration
  const updatePokemonBuild = useCallback((pokemonId, updates) => {
    setTeam(prev => {
      const newTeam = prev.map(p => {
        if (p.id === pokemonId) {
          return { ...p, ...updates };
        }
        return p;
      });
      saveTeam(newTeam);
      return newTeam;
    });
  }, []);

  // Update Pokemon's moves
  const updatePokemonMoves = useCallback((pokemonId, moves) => {
    setTeam(prev => {
      const newTeam = prev.map(p => {
        if (p.id === pokemonId) {
          return { ...p, moves };
        }
        return p;
      });
      saveTeam(newTeam);
      return newTeam;
    });
  }, []);

  // Update Pokemon's IVs
  const updatePokemonIVs = useCallback((pokemonId, ivs) => {
    setTeam(prev => {
      const newTeam = prev.map(p => {
        if (p.id === pokemonId) {
          return { ...p, ivs: { ...p.ivs, ...ivs } };
        }
        return p;
      });
      saveTeam(newTeam);
      return newTeam;
    });
  }, []);

  // Update Pokemon's EVs
  const updatePokemonEVs = useCallback((pokemonId, evs) => {
    setTeam(prev => {
      const newTeam = prev.map(p => {
        if (p.id === pokemonId) {
          return { ...p, evs: { ...p.evs, ...evs } };
        }
        return p;
      });
      saveTeam(newTeam);
      return newTeam;
    });
  }, []);

  // Generate Showdown export format
  const exportToShowdown = useCallback(() => {
    return team.map(pokemon => {
      const lines = [];
      
      // Name line: nickname (species) @ item or just species @ item
      let nameLine = pokemon.nickname 
        ? `${pokemon.nickname} (${pokemon.name})` 
        : pokemon.name;
      if (pokemon.item) {
        nameLine += ` @ ${pokemon.item}`;
      }
      lines.push(nameLine);
      
      // Ability
      if (pokemon.ability) {
        lines.push(`Ability: ${pokemon.ability}`);
      }
      
      // Level if not 100
      if (pokemon.level && pokemon.level !== 100) {
        lines.push(`Level: ${pokemon.level}`);
      }
      
      // EVs
      const evParts = [];
      if (pokemon.evs?.hp > 0) evParts.push(`${pokemon.evs.hp} HP`);
      if (pokemon.evs?.attack > 0) evParts.push(`${pokemon.evs.attack} Atk`);
      if (pokemon.evs?.defense > 0) evParts.push(`${pokemon.evs.defense} Def`);
      if (pokemon.evs?.specialAttack > 0) evParts.push(`${pokemon.evs.specialAttack} SpA`);
      if (pokemon.evs?.specialDefense > 0) evParts.push(`${pokemon.evs.specialDefense} SpD`);
      if (pokemon.evs?.speed > 0) evParts.push(`${pokemon.evs.speed} Spe`);
      if (evParts.length > 0) {
        lines.push(`EVs: ${evParts.join(' / ')}`);
      }
      
      // Nature
      if (pokemon.nature && pokemon.nature !== 'hardy') {
        const natureName = NATURES[pokemon.nature]?.name || pokemon.nature;
        lines.push(`${natureName} Nature`);
      }
      
      // IVs (only list if not perfect)
      const ivParts = [];
      if (pokemon.ivs?.hp < 31) ivParts.push(`${pokemon.ivs.hp} HP`);
      if (pokemon.ivs?.attack < 31) ivParts.push(`${pokemon.ivs.attack} Atk`);
      if (pokemon.ivs?.defense < 31) ivParts.push(`${pokemon.ivs.defense} Def`);
      if (pokemon.ivs?.specialAttack < 31) ivParts.push(`${pokemon.ivs.specialAttack} SpA`);
      if (pokemon.ivs?.specialDefense < 31) ivParts.push(`${pokemon.ivs.specialDefense} SpD`);
      if (pokemon.ivs?.speed < 31) ivParts.push(`${pokemon.ivs.speed} Spe`);
      if (ivParts.length > 0) {
        lines.push(`IVs: ${ivParts.join(' / ')}`);
      }
      
      // Moves
      pokemon.moves?.filter(m => m).forEach(move => {
        lines.push(`- ${move}`);
      });
      
      return lines.join('\n');
    }).join('\n\n');
  }, [team]);

  // Calculate team analysis
  const teamAnalysis = useMemo(() => {
    if (team.length === 0) {
      return {
        allTypes: [],
        weaknesses: {},
        resistances: {},
        immunities: [],
        coverage: {},
        uncoveredTypes: [],
      };
    }

    // Collect all types in team
    const allTypes = [...new Set(team.flatMap(p => p.types))];

    // Calculate combined weaknesses/resistances
    const combinedWeaknesses = {};
    const combinedResistances = {};
    const combinedImmunities = new Set();

    team.forEach(pokemon => {
      const { weaknesses, resistances, immunities } = calculateTypeEffectiveness(pokemon.types);
      
      Object.entries(weaknesses).forEach(([type, multiplier]) => {
        combinedWeaknesses[type] = (combinedWeaknesses[type] || 0) + 1;
      });
      
      Object.entries(resistances).forEach(([type, multiplier]) => {
        combinedResistances[type] = (combinedResistances[type] || 0) + 1;
      });
      
      immunities.forEach(type => combinedImmunities.add(type));
    });

    // Calculate offensive coverage
    const allPokemonTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    
    const typeCoverage = {};
    allPokemonTypes.forEach(type => {
      typeCoverage[type] = allTypes.some(teamType => {
        // Simple coverage check - team type is super effective against this type
        const coverageMap = {
          normal: [],
          fire: ['grass', 'ice', 'bug', 'steel'],
          water: ['fire', 'ground', 'rock'],
          electric: ['water', 'flying'],
          grass: ['water', 'ground', 'rock'],
          ice: ['grass', 'ground', 'flying', 'dragon'],
          fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
          poison: ['grass', 'fairy'],
          ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
          flying: ['grass', 'fighting', 'bug'],
          psychic: ['fighting', 'poison'],
          bug: ['grass', 'psychic', 'dark'],
          rock: ['fire', 'ice', 'flying', 'bug'],
          ghost: ['psychic', 'ghost'],
          dragon: ['dragon'],
          dark: ['psychic', 'ghost'],
          steel: ['ice', 'rock', 'fairy'],
          fairy: ['fighting', 'dragon', 'dark'],
        };
        return coverageMap[teamType]?.includes(type);
      });
    });

    const uncoveredTypes = allPokemonTypes.filter(type => !typeCoverage[type]);

    return {
      allTypes,
      weaknesses: combinedWeaknesses,
      resistances: combinedResistances,
      immunities: Array.from(combinedImmunities),
      coverage: typeCoverage,
      uncoveredTypes,
    };
  }, [team]);

  const value = {
    team,
    addToTeam,
    removeFromTeam,
    isOnTeam,
    clearTeam,
    teamSize: team.length,
    isFull: team.length >= MAX_TEAM_SIZE,
    teamAnalysis,
    notification,
    clearNotification: () => setNotification(null),
    // Build configuration functions
    updatePokemonBuild,
    updatePokemonMoves,
    updatePokemonIVs,
    updatePokemonEVs,
    exportToShowdown,
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export default TeamContext;
