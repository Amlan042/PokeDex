// localStorage utility functions

const FAVORITES_KEY = 'pokemon_favorites';
const TEAM_KEY = 'pokemon_team';
const GAME_SCORES_KEY = 'pokemon_game_scores';

// Generic storage functions
export const loadFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Favorites
export const getFavorites = () => {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return [];
  }
};

export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
};

export const addFavorite = (pokemon) => {
  const favorites = getFavorites();
  if (!favorites.find(p => p.id === pokemon.id)) {
    const newFavorites = [...favorites, pokemon];
    saveFavorites(newFavorites);
    return newFavorites;
  }
  return favorites;
};

export const removeFavorite = (pokemonId) => {
  const favorites = getFavorites();
  const newFavorites = favorites.filter(p => p.id !== pokemonId);
  saveFavorites(newFavorites);
  return newFavorites;
};

export const isFavorite = (pokemonId) => {
  const favorites = getFavorites();
  return favorites.some(p => p.id === pokemonId);
};

// Team
export const getTeam = () => {
  try {
    const team = localStorage.getItem(TEAM_KEY);
    return team ? JSON.parse(team) : [];
  } catch (error) {
    console.error('Error reading team from localStorage:', error);
    return [];
  }
};

export const saveTeam = (team) => {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch (error) {
    console.error('Error saving team to localStorage:', error);
  }
};

export const addToTeam = (pokemon) => {
  const team = getTeam();
  if (team.length >= 6) {
    return { success: false, message: 'Team is full! Maximum 6 Pokémon allowed.', team };
  }
  if (team.find(p => p.id === pokemon.id)) {
    return { success: false, message: 'This Pokémon is already on your team!', team };
  }
  const newTeam = [...team, pokemon];
  saveTeam(newTeam);
  return { success: true, message: `${pokemon.name} added to team!`, team: newTeam };
};

export const removeFromTeam = (pokemonId) => {
  const team = getTeam();
  const newTeam = team.filter(p => p.id !== pokemonId);
  saveTeam(newTeam);
  return newTeam;
};

export const isOnTeam = (pokemonId) => {
  const team = getTeam();
  return team.some(p => p.id === pokemonId);
};

// Game Scores
export const getGameScores = () => {
  try {
    const scores = localStorage.getItem(GAME_SCORES_KEY);
    return scores ? JSON.parse(scores) : { highScore: 0, gamesPlayed: 0, totalCorrect: 0 };
  } catch (error) {
    console.error('Error reading game scores from localStorage:', error);
    return { highScore: 0, gamesPlayed: 0, totalCorrect: 0 };
  }
};

export const saveGameScore = (score) => {
  const currentScores = getGameScores();
  const newScores = {
    highScore: Math.max(currentScores.highScore, score),
    gamesPlayed: currentScores.gamesPlayed + 1,
    totalCorrect: currentScores.totalCorrect + score,
  };
  try {
    localStorage.setItem(GAME_SCORES_KEY, JSON.stringify(newScores));
  } catch (error) {
    console.error('Error saving game scores to localStorage:', error);
  }
  return newScores;
};

export const resetGameScores = () => {
  const defaultScores = { highScore: 0, gamesPlayed: 0, totalCorrect: 0 };
  try {
    localStorage.setItem(GAME_SCORES_KEY, JSON.stringify(defaultScores));
  } catch (error) {
    console.error('Error resetting game scores:', error);
  }
  return defaultScores;
};
