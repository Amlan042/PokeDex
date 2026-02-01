// FavoritesContext.jsx - Global state for favorites management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getFavorites, saveFavorites } from '../utils/localStorage';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = getFavorites();
    setFavorites(storedFavorites);
  }, []);

  // Add a Pokemon to favorites
  const addFavorite = useCallback((pokemon) => {
    setFavorites(prev => {
      if (prev.find(p => p.id === pokemon.id)) {
        return prev;
      }
      const newFavorites = [...prev, {
        id: pokemon.id,
        name: pokemon.name,
        image: pokemon.image,
        sprite: pokemon.sprite,
        types: pokemon.types,
        type: pokemon.type || pokemon.types[0],
      }];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // Remove a Pokemon from favorites
  const removeFavorite = useCallback((pokemonId) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(p => p.id !== pokemonId);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback((pokemon) => {
    setFavorites(prev => {
      const exists = prev.find(p => p.id === pokemon.id);
      if (exists) {
        const newFavorites = prev.filter(p => p.id !== pokemon.id);
        saveFavorites(newFavorites);
        return newFavorites;
      } else {
        const newFavorites = [...prev, {
          id: pokemon.id,
          name: pokemon.name,
          image: pokemon.image,
          sprite: pokemon.sprite,
          types: pokemon.types,
          type: pokemon.type || pokemon.types[0],
        }];
        saveFavorites(newFavorites);
        return newFavorites;
      }
    });
  }, []);

  // Check if a Pokemon is favorited
  const isFavorite = useCallback((pokemonId) => {
    return favorites.some(p => p.id === pokemonId);
  }, [favorites]);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    setFavorites([]);
    saveFavorites([]);
  }, []);

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAllFavorites,
    favoritesCount: favorites.length,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
