// GamePage.jsx - "Who's That Pokémon?" game with multiple modes
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchRandomPokemon, fetchRandomPokemonOptions } from './Pokemon';
import { getGameScores, saveGameScore, resetGameScores } from './utils/localStorage';
import PokemonSearchInput from './components/PokemonSearchInput';

// Game Types
const GAME_TYPES = {
  CLASSIC: 'classic',
  CRY_QUIZ: 'cry_quiz',
  TIME_ATTACK: 'time_attack',
  BLUR_MODE: 'blur_mode',
};

const GAME_TYPE_INFO = {
  [GAME_TYPES.CLASSIC]: {
    name: 'Classic',
    description: 'Guess the silhouette',
    icon: '🎭',
    color: '#667eea',
  },
  [GAME_TYPES.CRY_QUIZ]: {
    name: 'Cry Quiz',
    description: 'Identify by sound',
    icon: '🔊',
    color: '#ff6b6b',
  },
  [GAME_TYPES.TIME_ATTACK]: {
    name: 'Time Attack',
    description: 'Race against the clock',
    icon: '⏱️',
    color: '#feca57',
  },
  [GAME_TYPES.BLUR_MODE]: {
    name: 'Blur Mode',
    description: 'Gradually revealing image',
    icon: '🔍',
    color: '#4ecdc4',
  },
};

const GAME_MODES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TEXT_INPUT: 'text_input',
};

const DIFFICULTY = {
  EASY: { maxId: 151, name: 'Gen 1 (Kanto)', options: 4, icon: '🌱', color: '#1dd1a1' },
  MEDIUM: { maxId: 386, name: 'Gen 1-3', options: 4, icon: '⚡', color: '#feca57' },
  HARD: { maxId: 898, name: 'All Gens', options: 6, icon: '🔥', color: '#ff6b6b' },
};

// Streak flames component
const StreakFlames = ({ streak }) => {
  if (streak < 2) return null;
  return (
    <div className="streak-flames">
      {[...Array(Math.min(streak, 5))].map((_, i) => (
        <span key={i} className="flame" style={{ '--delay': `${i * 0.1}s` }}>🔥</span>
      ))}
    </div>
  );
};

// Progress dots component
const ProgressDots = ({ round, maxRounds, results }) => (
  <div className="progress-dots">
    {[...Array(maxRounds)].map((_, i) => (
      <div 
        key={i} 
        className={`progress-dot ${
          i < round - 1 ? (results[i] ? 'correct' : 'incorrect') : 
          i === round - 1 ? 'current' : ''
        }`}
      >
        {i < round - 1 && (results[i] ? '✓' : '✗')}
        {i === round - 1 && <span className="current-indicator"></span>}
      </div>
    ))}
  </div>
);

const GamePage = () => {
  // Game type and mode selection
  const [gameType, setGameType] = useState(GAME_TYPES.CLASSIC);
  const [gameMode, setGameMode] = useState(GAME_MODES.MULTIPLE_CHOICE);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.EASY);
  
  // Game state
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [options, setOptions] = useState([]);
  const [guess, setGuess] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState(getGameScores());
  const [gameStarted, setGameStarted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [roundResults, setRoundResults] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef(null);
  
  // Time Attack specific state
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeAttackScore, setTimeAttackScore] = useState(0);
  const timerRef = useRef(null);
  
  // Blur Mode specific state
  const [blurLevel, setBlurLevel] = useState(30);
  const blurIntervalRef = useRef(null);
  
  // Cry Quiz specific state
  const [isPlayingCry, setIsPlayingCry] = useState(false);
  const audioRef = useRef(null);

  // Calculate accuracy
  const accuracy = useMemo(() => {
    if (scores.gamesPlayed === 0) return 0;
    return Math.round((scores.totalCorrect / (scores.gamesPlayed * maxRounds)) * 100);
  }, [scores, maxRounds]);

  // Load a new Pokemon
  const loadNewPokemon = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setIsCorrect(null);
    setGuess('');
    setShowHint(false);
    setBlurLevel(30); // Reset blur for blur mode
    
    try {
      const pokemon = await fetchRandomPokemon(difficulty.maxId);
      setCurrentPokemon(pokemon);
      
      if (gameMode === GAME_MODES.MULTIPLE_CHOICE) {
        const allOptions = await fetchRandomPokemonOptions(pokemon, difficulty.options - 1);
        setOptions(allOptions);
      }
      
      // Start blur reduction for blur mode
      if (gameType === GAME_TYPES.BLUR_MODE) {
        startBlurReduction();
      }
      
    } catch (error) {
      console.error('Error loading Pokemon:', error);
    } finally {
      setLoading(false);
    }
  }, [difficulty, gameMode, gameType]);

  // Start the game
  const startGame = useCallback(() => {
    setGameStarted(true);
    setScore(0);
    setRound(1);
    setGameOver(false);
    setStreak(0);
    setRoundResults([]);
    setTimeLeft(60);
    setTimeAttackScore(0);
    setBlurLevel(30);
    
    // Start timer for time attack mode
    if (gameType === GAME_TYPES.TIME_ATTACK) {
      startTimer();
    }
    
    loadNewPokemon();
  }, [loadNewPokemon, gameType]);
  
  // Timer for Time Attack mode
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(60);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameOver(true);
          const newScores = saveGameScore(timeAttackScore);
          setScores(newScores);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timeAttackScore]);
  
  // Blur reduction for Blur Mode
  const startBlurReduction = useCallback(() => {
    if (blurIntervalRef.current) clearInterval(blurIntervalRef.current);
    setBlurLevel(30);
    blurIntervalRef.current = setInterval(() => {
      setBlurLevel(prev => {
        if (prev <= 0) {
          clearInterval(blurIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 300); // Reduces blur every 300ms
  }, []);
  
  // Stop blur reduction
  const stopBlurReduction = useCallback(() => {
    if (blurIntervalRef.current) {
      clearInterval(blurIntervalRef.current);
    }
  }, []);
  
  // Play Pokemon cry
  const playCry = useCallback(() => {
    if (!currentPokemon?.cries?.latest && !currentPokemon?.cries?.legacy) return;
    
    const cryUrl = currentPokemon.cries?.latest || currentPokemon.cries?.legacy;
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    audioRef.current = new Audio(cryUrl);
    setIsPlayingCry(true);
    audioRef.current.play().then(() => {
      audioRef.current.onended = () => setIsPlayingCry(false);
    }).catch(err => {
      console.error('Error playing cry:', err);
      setIsPlayingCry(false);
    });
  }, [currentPokemon]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (blurIntervalRef.current) clearInterval(blurIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Focus input when Pokemon loads
  useEffect(() => {
    if (!loading && gameMode === GAME_MODES.TEXT_INPUT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, gameMode]);

  // Handle guess submission
  const handleGuess = (guessedName) => {
    if (revealed || loading) return;

    const isGuessCorrect = guessedName.toLowerCase().trim() === currentPokemon.name.toLowerCase();
    setIsCorrect(isGuessCorrect);
    setRevealed(true);
    setRoundResults(prev => [...prev, isGuessCorrect]);
    
    // Stop blur reduction when answered
    if (gameType === GAME_TYPES.BLUR_MODE) {
      stopBlurReduction();
    }
    
    if (isGuessCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
      
      // Time Attack: add bonus time for correct answers
      if (gameType === GAME_TYPES.TIME_ATTACK) {
        setTimeAttackScore(prev => prev + 1);
        setTimeLeft(prev => Math.min(prev + 3, 60)); // Add 3 seconds, cap at 60
      }
      
      // Blur Mode: bonus for faster answers
      if (gameType === GAME_TYPES.BLUR_MODE && blurLevel > 15) {
        // Answered while still blurry - bonus point!
        setScore(prev => prev + 1);
      }
    } else {
      setStreak(0);
    }
  };

  // Handle text input submission
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (guess.trim()) {
      handleGuess(guess);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (gameType === GAME_TYPES.BLUR_MODE) {
      stopBlurReduction();
    }
    setIsCorrect(false);
    setRevealed(true);
    setStreak(0);
    setRoundResults(prev => [...prev, false]);
  };

  // Get hint (first letter)
  const getHint = () => {
    setShowHint(true);
  };

  // Move to next round
  const nextRound = () => {
    // Time Attack mode - continuous play until time runs out
    if (gameType === GAME_TYPES.TIME_ATTACK) {
      loadNewPokemon();
      return;
    }
    
    if (round >= maxRounds) {
      // Game over
      if (timerRef.current) clearInterval(timerRef.current);
      const newScores = saveGameScore(score);
      setScores(newScores);
      setGameOver(true);
    } else {
      setRound(prev => prev + 1);
      loadNewPokemon();
    }
  };

  // Play again
  const playAgain = () => {
    startGame();
  };

  // Reset high scores
  const handleResetScores = () => {
    if (window.confirm('Are you sure you want to reset all scores?')) {
      const newScores = resetGameScores();
      setScores(newScores);
    }
  };

  // Game not started - show menu
  if (!gameStarted) {
    return (
      <div className="game-page">
        {/* Hero Section */}
        <div className="game-hero">
          <div className="hero-content">
            <div className="hero-icon">
              <span className="game-icon-pulse">🎮</span>
            </div>
            <h1 className="page-title">Pokémon Games</h1>
            <p className="hero-subtitle">Test your Pokémon knowledge!</p>
          </div>
        </div>
        
        <div className="game-menu">
          {/* Game Type Selection */}
          <div className="game-type-section">
            <h3>🎯 Choose Game Mode</h3>
            <div className="game-type-buttons">
              {Object.entries(GAME_TYPE_INFO).map(([type, info]) => (
                <button
                  key={type}
                  className={`game-type-btn ${gameType === type ? 'active' : ''}`}
                  onClick={() => setGameType(type)}
                  style={{ '--type-color': info.color }}
                >
                  <span className="type-icon">{info.icon}</span>
                  <span className="type-name">{info.name}</span>
                  <span className="type-desc">{info.description}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="stats-showcase">
            <div className="stat-card featured">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <span className="stat-value">{scores.highScore}<span className="stat-max">/{maxRounds}</span></span>
                <span className="stat-label">High Score</span>
              </div>
              {scores.highScore === maxRounds && <div className="perfect-badge">PERFECT!</div>}
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <span className="stat-value">{accuracy}<span className="stat-unit">%</span></span>
                <span className="stat-label">Accuracy</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎮</div>
              <div className="stat-content">
                <span className="stat-value">{scores.gamesPlayed}</span>
                <span className="stat-label">Games Played</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <span className="stat-value">{scores.totalCorrect}</span>
                <span className="stat-label">Total Correct</span>
              </div>
            </div>
          </div>

          {scores.gamesPlayed > 0 && (
            <button className="reset-scores-btn" onClick={handleResetScores}>
              🗑️ Reset Stats
            </button>
          )}

          {/* Game Settings */}
          <div className="game-settings">
            <h3>⚙️ Game Settings</h3>
            
            {/* Hide answer mode for Cry Quiz - must type answer */}
            {gameType !== GAME_TYPES.CRY_QUIZ && (
              <div className="setting-group">
                <label>Answer Mode</label>
                <div className="mode-buttons">
                  <button 
                    className={`mode-btn ${gameMode === GAME_MODES.MULTIPLE_CHOICE ? 'active' : ''}`}
                    onClick={() => setGameMode(GAME_MODES.MULTIPLE_CHOICE)}
                  >
                    <span className="mode-icon">🔘</span>
                    <span className="mode-name">Multiple Choice</span>
                    <span className="mode-desc">Choose from options</span>
                  </button>
                  <button 
                    className={`mode-btn ${gameMode === GAME_MODES.TEXT_INPUT ? 'active' : ''}`}
                    onClick={() => setGameMode(GAME_MODES.TEXT_INPUT)}
                  >
                    <span className="mode-icon">⌨️</span>
                    <span className="mode-name">Type Answer</span>
                    <span className="mode-desc">Enter the name</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="setting-group">
              <label>Difficulty</label>
              <div className="difficulty-buttons">
                {Object.entries(DIFFICULTY).map(([key, value]) => (
                  <button
                    key={key}
                    className={`difficulty-btn ${difficulty.name === value.name ? 'active' : ''}`}
                    onClick={() => setDifficulty(value)}
                    style={{ '--diff-color': value.color }}
                  >
                    <span className="diff-icon">{value.icon}</span>
                    <span className="diff-name">{value.name}</span>
                    <span className="diff-pokemon">{value.maxId} Pokémon</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button className="start-game-btn" onClick={startGame}>
            <span className="btn-icon">{GAME_TYPE_INFO[gameType].icon}</span>
            <span className="btn-text">Start {GAME_TYPE_INFO[gameType].name}</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    );
  }

  // Game over screen
  if (gameOver) {
    const percentage = Math.round((score / maxRounds) * 100);
    const getMessage = () => {
      if (percentage === 100) return { text: "Pokémon Master!", emoji: "🏆", color: "#ffd700" };
      if (percentage >= 80) return { text: "Excellent!", emoji: "🌟", color: "#1dd1a1" };
      if (percentage >= 60) return { text: "Good job!", emoji: "👍", color: "#48dbfb" };
      if (percentage >= 40) return { text: "Not bad!", emoji: "🎯", color: "#feca57" };
      return { text: "Keep practicing!", emoji: "📚", color: "#ff6b6b" };
    };

    const message = getMessage();
    const isNewHighScore = score === scores.highScore && score > 0 && scores.gamesPlayed <= 1 || score > scores.highScore - 1;

    return (
      <div className="game-page">
        <div className="game-over-container">
          {/* Confetti effect for high scores */}
          {percentage >= 80 && (
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="confetti" style={{ '--delay': `${i * 0.1}s`, '--x': `${Math.random() * 100}%` }}></div>
              ))}
            </div>
          )}
          
          <div className="game-over-header">
            <span className="game-over-emoji">{message.emoji}</span>
            <h1 className="game-over-title">Game Over!</h1>
            {isNewHighScore && (
              <div className="new-high-score">
                <span>🎉</span> New High Score! <span>🎉</span>
              </div>
            )}
          </div>
          
          <div className="score-display">
            <div className="score-ring" style={{ '--score-color': message.color, '--percentage': percentage }}>
              <svg viewBox="0 0 100 100">
                <circle className="score-ring-bg" cx="50" cy="50" r="45" />
                <circle className="score-ring-fill" cx="50" cy="50" r="45" />
              </svg>
              <div className="score-content">
                <span className="score-number">{score}</span>
                <span className="score-divider">/</span>
                <span className="score-total">{maxRounds}</span>
              </div>
            </div>
            <p className="score-percentage">{percentage}% Correct</p>
            <p className="score-message" style={{ color: message.color }}>{message.text}</p>
          </div>

          {/* Round Results */}
          <div className="round-results">
            <h3>Round Results</h3>
            <div className="results-grid">
              {roundResults.map((result, i) => (
                <div key={i} className={`result-dot ${result ? 'correct' : 'incorrect'}`}>
                  {result ? '✓' : '✗'}
                </div>
              ))}
            </div>
          </div>
          
          <div className="game-over-buttons">
            <button className="play-again-btn" onClick={playAgain}>
              <span>🔄</span> Play Again
            </button>
            <button className="menu-btn" onClick={() => setGameStarted(false)}>
              <span>📋</span> Main Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page playing">
      {/* Game Header */}
      <div className="game-header">
        <button className="back-to-menu" onClick={() => {
          if (timerRef.current) clearInterval(timerRef.current);
          if (blurIntervalRef.current) clearInterval(blurIntervalRef.current);
          setGameStarted(false);
        }}>
          ← Menu
        </button>
        <h2 className="game-title">{GAME_TYPE_INFO[gameType].name}</h2>
        <div className="difficulty-badge" style={{ '--diff-color': difficulty.color }}>
          {difficulty.icon} {difficulty.name}
        </div>
      </div>
      
      {/* Game HUD */}
      <div className="game-hud">
        {gameType === GAME_TYPES.TIME_ATTACK ? (
          <>
            <div className={`hud-item timer ${timeLeft <= 10 ? 'critical' : ''}`}>
              <span className="hud-label">Time</span>
              <span className="hud-value">{timeLeft}<span className="hud-unit">s</span></span>
            </div>
            <div className="hud-item score">
              <span className="hud-label">Score</span>
              <span className="hud-value">{timeAttackScore}</span>
              <StreakFlames streak={streak} />
            </div>
          </>
        ) : (
          <>
            <div className="hud-item round">
              <span className="hud-label">Round</span>
              <span className="hud-value">{round}<span className="hud-max">/{maxRounds}</span></span>
            </div>
            <div className="hud-item score">
              <span className="hud-label">Score</span>
              <span className="hud-value">{score}</span>
              <StreakFlames streak={streak} />
            </div>
            <div className="hud-item best">
              <span className="hud-label">Best</span>
              <span className="hud-value">{scores.highScore}</span>
            </div>
          </>
        )}
      </div>

      {/* Progress Dots (not for Time Attack) */}
      {gameType !== GAME_TYPES.TIME_ATTACK && (
        <ProgressDots round={round} maxRounds={maxRounds} results={roundResults} />
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="pokeball-loader">
            <div className="pokeball-top"></div>
            <div className="pokeball-bottom"></div>
            <div className="pokeball-center"></div>
          </div>
          <p className="loading-text">Loading Pokémon...</p>
        </div>
      ) : (
        <div className="game-content">
          {/* Pokemon Display - Different for each game type */}
          {gameType === GAME_TYPES.CRY_QUIZ ? (
            // Cry Quiz - No image, just audio
            <div className="cry-quiz-container">
              <div className="cry-display">
                <button 
                  className={`play-cry-btn ${isPlayingCry ? 'playing' : ''}`}
                  onClick={playCry}
                  disabled={revealed}
                >
                  <span className="cry-icon">{isPlayingCry ? '🔊' : '🔈'}</span>
                  <span className="cry-text">{isPlayingCry ? 'Playing...' : 'Play Cry'}</span>
                </button>
                <p className="cry-hint">Listen to the cry and guess the Pokémon!</p>
              </div>
              {revealed && (
                <div className="cry-reveal">
                  <img 
                    src={currentPokemon?.image || currentPokemon?.sprite}
                    alt={currentPokemon?.name}
                    className="revealed-image"
                  />
                </div>
              )}
            </div>
          ) : gameType === GAME_TYPES.BLUR_MODE ? (
            // Blur Mode - Gradually revealing
            <div className={`blur-container ${revealed ? 'revealed' : ''}`}>
              <div className="blur-level-indicator">
                Clarity: {Math.max(0, 100 - Math.round(blurLevel * 3.33))}%
              </div>
              <img 
                src={currentPokemon?.image || currentPokemon?.sprite}
                alt="Mystery Pokémon"
                className="blur-image"
                style={{ filter: revealed ? 'none' : `blur(${blurLevel}px)` }}
              />
            </div>
          ) : (
            // Classic & Time Attack - Silhouette
            <div className={`silhouette-container ${revealed ? 'revealed' : ''}`}>
              <div className="silhouette-bg"></div>
              <img 
                src={currentPokemon?.image || currentPokemon?.sprite}
                alt="Mystery Pokémon"
                className={`silhouette-image ${revealed ? 'revealed' : ''}`}
              />
              {!revealed && (
                <div className="mystery-overlay">
                  <span className="question-mark">?</span>
                </div>
              )}
            </div>
          )}
          
          {/* Hint Display */}
          {showHint && !revealed && currentPokemon && (
            <div className="hint-display">
              💡 Starts with: <strong>{currentPokemon.name.charAt(0).toUpperCase()}</strong>
            </div>
          )}
          
          {/* Result feedback */}
          {revealed && (
            <div className={`result-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="result-icon">
                {isCorrect ? '✅' : '❌'}
              </div>
              <p className="result-text">
                {isCorrect ? 'Correct!' : 'Wrong!'}
              </p>
              <p className="pokemon-reveal">
                It's <span className="pokemon-name">{currentPokemon.name}</span>!
              </p>
              <div className="pokemon-types-container">
                {currentPokemon.types?.map(type => (
                  <span key={type} className={`pokemon-type type-${type}`}>
                    {type}
                  </span>
                ))}
              </div>
              {isCorrect && streak >= 2 && (
                <div className="streak-bonus">
                  🔥 {streak} in a row!
                </div>
              )}
              {gameType === GAME_TYPES.BLUR_MODE && isCorrect && blurLevel > 15 && (
                <div className="blur-bonus">
                  ✨ Speed Bonus! (+1)
                </div>
              )}
              {gameType === GAME_TYPES.TIME_ATTACK && isCorrect && (
                <div className="time-bonus">
                  ⏱️ +3 seconds!
                </div>
              )}
              <button className="next-btn" onClick={nextRound}>
                {gameType === GAME_TYPES.TIME_ATTACK 
                  ? '➡️ Next Pokémon' 
                  : round >= maxRounds 
                    ? '🏁 See Results' 
                    : '➡️ Next Pokémon'}
              </button>
            </div>
          )}
          
          {/* Input Area */}
          {!revealed && (
            <div className="game-input-area">
              {gameMode === GAME_MODES.MULTIPLE_CHOICE ? (
                <div className="options-grid">
                  {options.map((option, index) => (
                    <button
                      key={option.id}
                      className="option-btn"
                      onClick={() => handleGuess(option.name)}
                      style={{ '--animation-delay': `${index * 0.1}s` }}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="option-name">{option.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleTextSubmit} className="text-input-form">
                  <div className="input-wrapper">
                    <PokemonSearchInput
                      value={guess}
                      onChange={setGuess}
                      onSelect={(name) => {
                        setGuess(name);
                        // Auto-submit when a Pokemon is selected
                        setTimeout(() => handleGuess(name), 100);
                      }}
                      onSubmit={handleTextSubmit}
                      placeholder="Enter Pokémon name..."
                      className="game-search-input"
                    />
                  </div>
                  <button type="submit" className="submit-btn" disabled={!guess.trim()}>
                    ✓ Submit
                  </button>
                </form>
              )}
              
              <div className="game-actions">
                {gameMode === GAME_MODES.TEXT_INPUT && !showHint && (
                  <button className="hint-btn" onClick={getHint}>
                    💡 Hint
                  </button>
                )}
                <button className="skip-btn" onClick={handleSkip}>
                  ⏭️ Skip
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { GamePage };
