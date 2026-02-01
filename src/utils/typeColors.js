// Type colors for dynamic theming
export const typeColors = {
  normal: { primary: '#A8A878', secondary: '#6D6D4E', light: '#C6C6A7' },
  fire: { primary: '#F08030', secondary: '#9C531F', light: '#F5AC78' },
  water: { primary: '#6890F0', secondary: '#445E9C', light: '#9DB7F5' },
  electric: { primary: '#F8D030', secondary: '#A1871F', light: '#FAE078' },
  grass: { primary: '#78C850', secondary: '#4E8234', light: '#A7DB8D' },
  ice: { primary: '#98D8D8', secondary: '#638D8D', light: '#BCE6E6' },
  fighting: { primary: '#C03028', secondary: '#7D1F1A', light: '#D67873' },
  poison: { primary: '#A040A0', secondary: '#682A68', light: '#C183C1' },
  ground: { primary: '#E0C068', secondary: '#927D44', light: '#EBD69D' },
  flying: { primary: '#A890F0', secondary: '#6D5E9C', light: '#C6B7F5' },
  psychic: { primary: '#F85888', secondary: '#A13959', light: '#FA92B2' },
  bug: { primary: '#A8B820', secondary: '#6D7815', light: '#C6D16E' },
  rock: { primary: '#B8A038', secondary: '#786824', light: '#D1C17D' },
  ghost: { primary: '#705898', secondary: '#493963', light: '#A292BC' },
  dragon: { primary: '#7038F8', secondary: '#4924A1', light: '#A27DFA' },
  dark: { primary: '#705848', secondary: '#49392F', light: '#A29288' },
  steel: { primary: '#B8B8D0', secondary: '#787887', light: '#D1D1E0' },
  fairy: { primary: '#EE99AC', secondary: '#9B6470', light: '#F4BDC9' },
};

// Get gradient background for a type
export const getTypeGradient = (type) => {
  const colors = typeColors[type] || typeColors.normal;
  return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
};

// Get lighter gradient for cards
export const getTypeCardGradient = (type) => {
  const colors = typeColors[type] || typeColors.normal;
  return `linear-gradient(135deg, ${colors.light} 0%, ${colors.primary} 100%)`;
};

// Type effectiveness chart
// 2 = super effective, 0.5 = not very effective, 0 = immune
export const typeEffectiveness = {
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

// Calculate weaknesses and strengths for given types
export const calculateTypeEffectiveness = (types) => {
  const allTypes = Object.keys(typeEffectiveness);
  const weaknesses = {};
  const resistances = {};
  const immunities = [];

  // Calculate defensive multipliers
  allTypes.forEach(attackingType => {
    let multiplier = 1;
    types.forEach(defendingType => {
      const effectiveness = typeEffectiveness[attackingType]?.[defendingType];
      if (effectiveness !== undefined) {
        multiplier *= effectiveness;
      }
    });

    if (multiplier === 0) {
      immunities.push(attackingType);
    } else if (multiplier >= 2) {
      weaknesses[attackingType] = multiplier;
    } else if (multiplier <= 0.5) {
      resistances[attackingType] = multiplier;
    }
  });

  return { weaknesses, resistances, immunities };
};

// Calculate offensive coverage for given types
export const calculateOffensiveCoverage = (types) => {
  const allTypes = Object.keys(typeEffectiveness);
  const superEffective = {};
  const notEffective = {};
  const noEffect = [];

  types.forEach(attackingType => {
    const effectiveness = typeEffectiveness[attackingType] || {};
    Object.entries(effectiveness).forEach(([defendingType, multiplier]) => {
      if (multiplier === 2) {
        superEffective[defendingType] = (superEffective[defendingType] || 0) + 1;
      } else if (multiplier === 0.5) {
        if (!notEffective[defendingType]) {
          notEffective[defendingType] = multiplier;
        }
      } else if (multiplier === 0) {
        if (!noEffect.includes(defendingType)) {
          noEffect.push(defendingType);
        }
      }
    });
  });

  return { superEffective, notEffective, noEffect };
};
