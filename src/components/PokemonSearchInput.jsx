// PokemonSearchInput.jsx - Reusable search input with autocomplete suggestions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Cache for Pokemon names to avoid repeated API calls
let pokemonNamesCache = null;
let cachePromise = null;

const fetchPokemonNames = async () => {
  if (pokemonNamesCache) return pokemonNamesCache;
  if (cachePromise) return cachePromise;
  
  cachePromise = axios.get('https://pokeapi.co/api/v2/pokemon?limit=1025')
    .then(response => {
      pokemonNamesCache = response.data.results.map((p, index) => ({
        id: index + 1,
        name: p.name,
      }));
      return pokemonNamesCache;
    })
    .catch(() => {
      cachePromise = null;
      return [];
    });
  
  return cachePromise;
};

const PokemonSearchInput = ({
  value,
  onChange,
  onSelect,
  onSubmit,
  placeholder = "Enter Pokémon name...",
  className = "",
  disabled = false,
  autoFocus = false,
  maxSuggestions = 8,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allPokemon, setAllPokemon] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load Pokemon names on mount
  useEffect(() => {
    fetchPokemonNames().then(setAllPokemon);
  }, []);

  // Filter suggestions based on input
  const updateSuggestions = useCallback((query) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Check if input is a number (ID search)
    const isNumber = /^\d+$/.test(searchTerm);
    
    let filtered;
    if (isNumber) {
      const id = parseInt(searchTerm);
      filtered = allPokemon.filter(p => 
        p.id.toString().startsWith(searchTerm) || p.id === id
      );
    } else {
      // Prioritize names that start with the search term
      const startsWithMatch = allPokemon.filter(p => 
        p.name.startsWith(searchTerm)
      );
      const containsMatch = allPokemon.filter(p => 
        !p.name.startsWith(searchTerm) && p.name.includes(searchTerm)
      );
      filtered = [...startsWithMatch, ...containsMatch];
    }

    setSuggestions(filtered.slice(0, maxSuggestions));
    setSelectedIndex(-1);
  }, [allPokemon, maxSuggestions]);

  // Update suggestions when input changes
  useEffect(() => {
    updateSuggestions(value);
  }, [value, updateSuggestions]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(e.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (pokemon) => {
    onChange(pokemon.name);
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect(pokemon.name);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit(value);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else if (onSubmit) {
          setShowSuggestions(false);
          onSubmit(value);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleFocus = () => {
    if (value && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const formatPokemonId = (id) => `#${String(id).padStart(3, '0')}`;

  return (
    <div className={`pokemon-search-wrapper ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showSuggestions && suggestions.length > 0}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <ul 
          ref={suggestionsRef}
          className="pokemon-suggestions"
          role="listbox"
        >
          {suggestions.map((pokemon, index) => (
            <li
              key={pokemon.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelectSuggestion(pokemon)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                alt={pokemon.name}
                className="suggestion-sprite"
                loading="lazy"
              />
              <span className="suggestion-name">{pokemon.name}</span>
              <span className="suggestion-id">{formatPokemonId(pokemon.id)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PokemonSearchInput;
