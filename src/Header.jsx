import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFavorites } from "./context/FavoritesContext";
import { useTeam } from "./context/TeamContext";
import ThemeSwitcher from "./components/ThemeSwitcher";

export const Header = () => {
  const location = useLocation();
  const { favoritesCount } = useFavorites();
  const { teamSize } = useTeam();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState({ left: 0, width: 0 });
  const navRef = useRef(null);
  const navTrackRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active indicator position
  useEffect(() => {
    const updateIndicator = () => {
      if (navTrackRef.current) {
        const activeLink = navTrackRef.current.querySelector('.nav-link.active');
        if (activeLink) {
          const trackRect = navTrackRef.current.getBoundingClientRect();
          const linkRect = activeLink.getBoundingClientRect();
          setActiveIndicator({
            left: linkRect.left - trackRect.left,
            width: linkRect.width,
          });
        }
      }
    };
    
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [location.pathname]);

  // Primary nav items (always visible on desktop)
  const primaryNavItems = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/pokedex", label: "Pokédex", icon: "📱" },
    { path: "/info", label: "Search", icon: "🔍" },
  ];

  // Secondary nav items (grouped or shown based on space)
  const secondaryNavItems = [
    { path: "/compare", label: "Compare", icon: "⚖️" },
    { path: "/favorites", label: "Favorites", icon: "❤️", badge: favoritesCount > 0 ? favoritesCount : null },
    { path: "/team", label: "Team", icon: "⭐", badge: teamSize > 0 ? `${teamSize}/6` : null },
    { path: "/game", label: "Game", icon: "🎮" },
    { path: "/items", label: "Items", icon: "🎒" },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <header className={`modern-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo-link" aria-label="Home">
          <div className="logo">
            <div className="logo-pokeball">
              <div className="pokeball-top"></div>
              <div className="pokeball-bottom"></div>
              <div className="pokeball-center"></div>
            </div>
            <span className="logo-text">
              <span className="logo-poke">POKÉ</span>
              <span className="logo-dex">DEX</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" ref={navRef}>
          <div className="nav-track" ref={navTrackRef}>
            <div 
              className="nav-indicator-bg" 
              style={{ 
                left: `${activeIndicator.left}px`, 
                width: `${activeIndicator.width}px` 
              }}
            />
            <ul className="nav-list">
              {allNavItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="nav-actions">
            <ThemeSwitcher compact />
          </div>
        </nav>

        {/* Mobile Controls */}
        <div className="mobile-controls">
          <ThemeSwitcher compact />
          <button 
            className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="menu-icon">
              <span className="menu-line"></span>
              <span className="menu-line"></span>
              <span className="menu-line"></span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`mobile-nav-overlay ${isMenuOpen ? 'open' : ''}`} 
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
        <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`} aria-label="Mobile navigation">
          <div className="mobile-nav-header">
            <div className="mobile-nav-logo">
              <div className="logo-pokeball small">
                <div className="pokeball-top"></div>
                <div className="pokeball-bottom"></div>
                <div className="pokeball-center"></div>
              </div>
              <span className="mobile-nav-title">Menu</span>
            </div>
            <button 
              className="close-menu" 
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mobile-nav-content">
            <ul className="mobile-nav-list">
              {allNavItems.map((item, index) => (
                <li 
                  key={item.path} 
                  className="mobile-nav-item"
                  style={{ '--delay': `${index * 0.05}s` }}
                >
                  <Link 
                    to={item.path} 
                    className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span className="mobile-nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="mobile-nav-badge">{item.badge}</span>
                    )}
                    <span className="mobile-nav-arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mobile-nav-footer">
            <p className="mobile-nav-tagline">Gotta catch 'em all! ⚡</p>
          </div>
        </nav>
      </div>
    </header>
  );
};
