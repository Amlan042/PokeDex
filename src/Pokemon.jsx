// Pokemon.js - API utilities for fetching Pokemon data
import axios from 'axios';

const BASE_URL = 'https://pokeapi.co/api/v2/';

// Fetch basic Pokemon data
const fetchPokemon = async (pokemonName) => {
  try {
    const response = await axios.get(`${BASE_URL}pokemon/${String(pokemonName).toLowerCase()}`);
    const data = response.data;
    
    return {
      id: data.id,
      name: data.name,
      image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
      shinyImage: data.sprites.other['official-artwork'].front_shiny || data.sprites.front_shiny,
      sprite: data.sprites.front_default,
      shinySprite: data.sprites.front_shiny,
      type: data.types[0].type.name,
      types: data.types.map(t => t.type.name),
      height: data.height / 10, // Convert to meters
      weight: data.weight / 10, // Convert to kg
      stats: {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        specialAttack: data.stats[3].base_stat,
        specialDefense: data.stats[4].base_stat,
        speed: data.stats[5].base_stat,
      },
      abilities: data.abilities.map(a => a.ability.name),
      abilitiesDetailed: data.abilities.map(a => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
        url: a.ability.url,
      })),
      cries: {
        latest: data.cries?.latest || null,
        legacy: data.cries?.legacy || null,
      },
      moves: data.moves,
      speciesUrl: data.species.url,
    };
  } catch (error) {
    throw new Error('Pokemon not found! Please check the name and try again.');
  }
};

// Fetch Pokemon species data (includes evolution chain URL)
const fetchPokemonSpecies = async (pokemonIdOrName) => {
  try {
    const response = await axios.get(`${BASE_URL}pokemon-species/${String(pokemonIdOrName).toLowerCase()}`);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch Pokemon species data.');
  }
};

// Fetch evolution chain
const fetchEvolutionChain = async (evolutionChainUrl) => {
  try {
    const response = await axios.get(evolutionChainUrl);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch evolution chain.');
  }
};

// Parse evolution chain into a usable format
const parseEvolutionChain = (chain) => {
  const evolutions = [];
  
  const traverse = (node, stage = 1) => {
    const speciesName = node.species.name;
    const speciesId = node.species.url.split('/').filter(Boolean).pop();
    
    // Get evolution details
    const evolutionDetails = node.evolution_details?.[0] || null;
    
    evolutions.push({
      name: speciesName,
      id: parseInt(speciesId),
      stage,
      trigger: evolutionDetails?.trigger?.name || null,
      minLevel: evolutionDetails?.min_level || null,
      item: evolutionDetails?.item?.name || null,
      heldItem: evolutionDetails?.held_item?.name || null,
      timeOfDay: evolutionDetails?.time_of_day || null,
      minHappiness: evolutionDetails?.min_happiness || null,
      minAffection: evolutionDetails?.min_affection || null,
      location: evolutionDetails?.location?.name || null,
      knownMove: evolutionDetails?.known_move?.name || null,
      knownMoveType: evolutionDetails?.known_move_type?.name || null,
    });
    
    // Traverse all possible evolutions
    if (node.evolves_to && node.evolves_to.length > 0) {
      node.evolves_to.forEach(evo => traverse(evo, stage + 1));
    }
  };
  
  traverse(chain);
  return evolutions;
};

// Get full Pokemon data including evolution chain
const fetchPokemonWithEvolution = async (pokemonIdOrName) => {
  try {
    // Fetch basic Pokemon data
    const pokemon = await fetchPokemon(pokemonIdOrName);
    
    // Fetch species data for evolution chain URL
    const speciesData = await fetchPokemonSpecies(pokemon.id);
    
    // Fetch and parse evolution chain
    const evolutionData = await fetchEvolutionChain(speciesData.evolution_chain.url);
    const evolutionChain = parseEvolutionChain(evolutionData.chain);
    
    // Fetch images for all Pokemon in evolution chain
    const evolutionWithImages = await Promise.all(
      evolutionChain.map(async (evo) => {
        try {
          const evoResponse = await axios.get(`${BASE_URL}pokemon/${evo.id}`);
          return {
            ...evo,
            image: evoResponse.data.sprites.other['official-artwork'].front_default || 
                   evoResponse.data.sprites.front_default,
            sprite: evoResponse.data.sprites.front_default,
            types: evoResponse.data.types.map(t => t.type.name),
          };
        } catch {
          return {
            ...evo,
            image: null,
            sprite: null,
            types: [],
          };
        }
      })
    );
    
    return {
      ...pokemon,
      evolutionChain: evolutionWithImages,
      flavorText: speciesData.flavor_text_entries
        .find(entry => entry.language.name === 'en')?.flavor_text
        .replace(/[\n\f]/g, ' ') || '',
      genus: speciesData.genera
        .find(g => g.language.name === 'en')?.genus || '',
      generation: speciesData.generation.name,
      habitat: speciesData.habitat?.name || 'Unknown',
      isLegendary: speciesData.is_legendary,
      isMythical: speciesData.is_mythical,
    };
  } catch (error) {
    console.error('Error fetching Pokemon with evolution:', error);
    throw error;
  }
};

// Fetch type data for type effectiveness
const fetchTypeData = async (typeName) => {
  try {
    const response = await axios.get(`${BASE_URL}type/${typeName}`);
    return response.data;
  } catch (error) {
    throw new Error(`Could not fetch type data for ${typeName}`);
  }
};

// Calculate type effectiveness from API data
const calculateTypeEffectivenessFromAPI = async (types) => {
  try {
    const typeDataPromises = types.map(type => fetchTypeData(type));
    const typeDataArray = await Promise.all(typeDataPromises);
    
    const weaknesses = {};
    const resistances = {};
    const immunities = [];
    
    // Process defensive matchups
    typeDataArray.forEach(typeData => {
      // Double damage from (weaknesses)
      typeData.damage_relations.double_damage_from.forEach(t => {
        weaknesses[t.name] = (weaknesses[t.name] || 1) * 2;
      });
      
      // Half damage from (resistances)
      typeData.damage_relations.half_damage_from.forEach(t => {
        resistances[t.name] = (resistances[t.name] || 1) * 0.5;
      });
      
      // No damage from (immunities)
      typeData.damage_relations.no_damage_from.forEach(t => {
        if (!immunities.includes(t.name)) {
          immunities.push(t.name);
        }
      });
    });
    
    // Remove immunities from weaknesses and resistances
    immunities.forEach(type => {
      delete weaknesses[type];
      delete resistances[type];
    });
    
    // Remove types that appear in both (cancel out to normal)
    Object.keys(weaknesses).forEach(type => {
      if (resistances[type]) {
        const combined = weaknesses[type] * resistances[type];
        if (combined === 1) {
          delete weaknesses[type];
          delete resistances[type];
        } else if (combined > 1) {
          weaknesses[type] = combined;
          delete resistances[type];
        } else {
          resistances[type] = combined;
          delete weaknesses[type];
        }
      }
    });
    
    return { weaknesses, resistances, immunities };
  } catch (error) {
    console.error('Error calculating type effectiveness:', error);
    throw error;
  }
};

// Fetch a random Pokemon for the game
const fetchRandomPokemon = async (maxId = 898) => {
  const randomId = Math.floor(Math.random() * maxId) + 1;
  return await fetchPokemon(randomId);
};

// Fetch multiple random Pokemon for game options
const fetchRandomPokemonOptions = async (correctPokemon, count = 3) => {
  const options = [correctPokemon];
  const usedIds = new Set([correctPokemon.id]);
  
  while (options.length < count + 1) {
    try {
      const randomId = Math.floor(Math.random() * 898) + 1;
      if (!usedIds.has(randomId)) {
        const pokemon = await fetchPokemon(randomId);
        options.push(pokemon);
        usedIds.add(randomId);
      }
    } catch (error) {
      // If fetch fails, just try again with a different ID
      continue;
    }
  }
  
  // Shuffle options
  return options.sort(() => Math.random() - 0.5);
};

// Fetch list of Pokemon for browsing
const fetchPokemonList = async (limit = 20, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}pokemon?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch Pokemon list.');
  }
};

export default fetchPokemon;
export {
  fetchPokemon,
  fetchPokemonSpecies,
  fetchEvolutionChain,
  fetchPokemonWithEvolution,
  fetchTypeData,
  calculateTypeEffectivenessFromAPI,
  fetchRandomPokemon,
  fetchRandomPokemonOptions,
  fetchPokemonList,
  parseEvolutionChain,
};

// Fetch ability details
export const fetchAbilityDetails = async (abilityUrl) => {
  try {
    const response = await axios.get(abilityUrl);
    const data = response.data;
    
    const englishEffect = data.effect_entries.find(e => e.language.name === 'en');
    const englishFlavorText = data.flavor_text_entries.find(e => e.language.name === 'en');
    
    return {
      name: data.name,
      effect: englishEffect?.effect || englishEffect?.short_effect || 'No description available.',
      shortEffect: englishEffect?.short_effect || '',
      flavorText: englishFlavorText?.flavor_text || '',
    };
  } catch (error) {
    console.error('Error fetching ability:', error);
    return null;
  }
};

// Fetch move details
export const fetchMoveDetails = async (moveUrl) => {
  try {
    const response = await axios.get(moveUrl);
    const data = response.data;
    
    const englishFlavorText = data.flavor_text_entries.find(e => e.language.name === 'en');
    const englishEffect = data.effect_entries.find(e => e.language.name === 'en');
    
    return {
      name: data.name,
      type: data.type.name,
      power: data.power,
      accuracy: data.accuracy,
      pp: data.pp,
      damageClass: data.damage_class.name, // physical, special, status
      effect: englishEffect?.short_effect || '',
      flavorText: englishFlavorText?.flavor_text || '',
      priority: data.priority,
      target: data.target.name,
    };
  } catch (error) {
    console.error('Error fetching move:', error);
    return null;
  }
};

// Fetch Pokemon moves organized by learn method
export const fetchPokemonMoves = async (moves, limit = 50) => {
  const organizedMoves = {
    levelUp: [],
    machine: [],
    egg: [],
    tutor: [],
  };
  
  // Get unique moves by learn method
  const movesByMethod = {};
  
  moves.forEach(move => {
    move.version_group_details.forEach(detail => {
      const method = detail.move_learn_method.name;
      const level = detail.level_learned_at;
      
      if (!movesByMethod[move.move.name]) {
        movesByMethod[move.move.name] = {
          url: move.move.url,
          methods: {}
        };
      }
      
      if (!movesByMethod[move.move.name].methods[method]) {
        movesByMethod[move.move.name].methods[method] = level;
      }
    });
  });
  
  // Fetch details for limited moves
  const moveNames = Object.keys(movesByMethod).slice(0, limit);
  const moveDetailsPromises = moveNames.map(async (moveName) => {
    const moveInfo = movesByMethod[moveName];
    const details = await fetchMoveDetails(moveInfo.url);
    return { ...details, learnMethods: moveInfo.methods };
  });
  
  const moveDetails = await Promise.all(moveDetailsPromises);
  
  // Organize by learn method
  moveDetails.filter(Boolean).forEach(move => {
    Object.entries(move.learnMethods).forEach(([method, level]) => {
      const moveData = { ...move, level };
      
      switch (method) {
        case 'level-up':
          organizedMoves.levelUp.push(moveData);
          break;
        case 'machine':
          organizedMoves.machine.push(moveData);
          break;
        case 'egg':
          organizedMoves.egg.push(moveData);
          break;
        case 'tutor':
          organizedMoves.tutor.push(moveData);
          break;
        default:
          break;
      }
    });
  });
  
  // Sort level-up moves by level
  organizedMoves.levelUp.sort((a, b) => a.level - b.level);
  
  return organizedMoves;
};

// Fetch Pokemon encounter locations
export const fetchPokemonLocations = async (pokemonId) => {
  try {
    const response = await axios.get(`${BASE_URL}pokemon/${pokemonId}/encounters`);
    const data = response.data;
    
    const locations = data.map(encounter => ({
      locationName: encounter.location_area.name.replace(/-/g, ' '),
      versions: encounter.version_details.map(v => ({
        version: v.version.name,
        maxChance: v.max_chance,
        encounters: v.encounter_details.map(e => ({
          minLevel: e.min_level,
          maxLevel: e.max_level,
          chance: e.chance,
          method: e.method.name,
          conditions: e.condition_values.map(c => c.name),
        })),
      })),
    }));
    
    return locations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

// Fetch all flavor text entries for a Pokemon
export const fetchAllFlavorText = async (pokemonIdOrName) => {
  try {
    const speciesData = await fetchPokemonSpecies(pokemonIdOrName);
    
    const englishEntries = speciesData.flavor_text_entries
      .filter(entry => entry.language.name === 'en')
      .map(entry => ({
        text: entry.flavor_text.replace(/[\n\f]/g, ' '),
        version: entry.version.name,
      }));
    
    // Remove duplicates
    const uniqueEntries = [];
    const seenTexts = new Set();
    
    englishEntries.forEach(entry => {
      if (!seenTexts.has(entry.text)) {
        seenTexts.add(entry.text);
        uniqueEntries.push(entry);
      }
    });
    
    return uniqueEntries;
  } catch (error) {
    console.error('Error fetching flavor text:', error);
    return [];
  }
};

// Fetch item details
export const fetchItem = async (itemId) => {
  try {
    const response = await axios.get(`${BASE_URL}item/${itemId}`);
    const data = response.data;
    
    const englishEffect = data.effect_entries.find(e => e.language.name === 'en');
    const englishFlavorText = data.flavor_text_entries.find(e => e.language.name === 'en');
    
    return {
      id: data.id,
      name: data.name,
      cost: data.cost,
      category: data.category.name,
      sprite: data.sprites.default,
      effect: englishEffect?.effect || '',
      shortEffect: englishEffect?.short_effect || '',
      flavorText: englishFlavorText?.text || '',
      attributes: data.attributes.map(a => a.name),
      flingPower: data.fling_power,
      flingEffect: data.fling_effect?.name || null,
    };
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
};

// Fetch item list
export const fetchItemList = async (limit = 50, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}item?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch item list.');
  }
};

// Fetch items by category
export const fetchItemsByCategory = async (categoryName) => {
  try {
    const response = await axios.get(`${BASE_URL}item-category/${categoryName}`);
    return response.data.items;
  } catch (error) {
    console.error('Error fetching items by category:', error);
    return [];
  }
};

// Fetch berry details
export const fetchBerry = async (berryId) => {
  try {
    const response = await axios.get(`${BASE_URL}berry/${berryId}`);
    const data = response.data;
    
    // Also fetch the item data for more details
    const itemData = await fetchItem(data.item.name);
    
    return {
      id: data.id,
      name: data.name,
      growthTime: data.growth_time,
      maxHarvest: data.max_harvest,
      naturalGiftPower: data.natural_gift_power,
      naturalGiftType: data.natural_gift_type.name,
      size: data.size,
      smoothness: data.smoothness,
      soilDryness: data.soil_dryness,
      firmness: data.firmness.name,
      flavors: data.flavors.map(f => ({
        name: f.flavor.name,
        potency: f.potency,
      })),
      item: itemData,
    };
  } catch (error) {
    console.error('Error fetching berry:', error);
    return null;
  }
};

// Fetch berry list
export const fetchBerryList = async (limit = 64, offset = 0) => {
  try {
    const response = await axios.get(`${BASE_URL}berry?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    throw new Error('Could not fetch berry list.');
  }
};

// Fetch generation details
export const fetchGeneration = async (genId) => {
  try {
    const response = await axios.get(`${BASE_URL}generation/${genId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching generation:', error);
    return null;
  }
};

// Fetch all Pokemon by generation
export const fetchPokemonByGeneration = async (genId) => {
  try {
    const genData = await fetchGeneration(genId);
    return genData.pokemon_species.map(p => ({
      name: p.name,
      id: parseInt(p.url.split('/').filter(Boolean).pop()),
    }));
  } catch (error) {
    console.error('Error fetching Pokemon by generation:', error);
    return [];
  }
};

// Pokemon natures data (for team builder)
export const NATURES = {
  hardy: { increased: null, decreased: null },
  lonely: { increased: 'attack', decreased: 'defense' },
  brave: { increased: 'attack', decreased: 'speed' },
  adamant: { increased: 'attack', decreased: 'specialAttack' },
  naughty: { increased: 'attack', decreased: 'specialDefense' },
  bold: { increased: 'defense', decreased: 'attack' },
  docile: { increased: null, decreased: null },
  relaxed: { increased: 'defense', decreased: 'speed' },
  impish: { increased: 'defense', decreased: 'specialAttack' },
  lax: { increased: 'defense', decreased: 'specialDefense' },
  timid: { increased: 'speed', decreased: 'attack' },
  hasty: { increased: 'speed', decreased: 'defense' },
  serious: { increased: null, decreased: null },
  jolly: { increased: 'speed', decreased: 'specialAttack' },
  naive: { increased: 'speed', decreased: 'specialDefense' },
  modest: { increased: 'specialAttack', decreased: 'attack' },
  mild: { increased: 'specialAttack', decreased: 'defense' },
  quiet: { increased: 'specialAttack', decreased: 'speed' },
  bashful: { increased: null, decreased: null },
  rash: { increased: 'specialAttack', decreased: 'specialDefense' },
  calm: { increased: 'specialDefense', decreased: 'attack' },
  gentle: { increased: 'specialDefense', decreased: 'defense' },
  sassy: { increased: 'specialDefense', decreased: 'speed' },
  careful: { increased: 'specialDefense', decreased: 'specialAttack' },
  quirky: { increased: null, decreased: null },
};

// Calculate stats with nature, IVs, and EVs
export const calculateStat = (baseStat, iv = 31, ev = 0, level = 50, nature = null, statName = 'hp') => {
  const natureMultiplier = nature 
    ? (NATURES[nature]?.increased === statName ? 1.1 : NATURES[nature]?.decreased === statName ? 0.9 : 1)
    : 1;
  
  if (statName === 'hp') {
    return Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level / 100) + level + 10);
  }
  
  return Math.floor((((2 * baseStat + iv + Math.floor(ev / 4)) * level / 100) + 5) * natureMultiplier);
};
