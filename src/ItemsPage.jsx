// ItemsPage.jsx - Items & Berries Database
import React, { useState, useEffect, useCallback } from 'react';
import { fetchItem, fetchItemList, fetchBerry, fetchBerryList, fetchItemsByCategory } from './Pokemon';
import { typeColors } from './utils/typeColors';

// Item categories for filtering
const ITEM_CATEGORIES = [
  { id: 'all', name: 'All Items', icon: '📦' },
  { id: 'pokeballs', name: 'Poké Balls', icon: '🔴' },
  { id: 'medicine', name: 'Medicine', icon: '💊' },
  { id: 'held-items', name: 'Held Items', icon: '✋' },
  { id: 'evolution', name: 'Evolution', icon: '✨' },
  { id: 'berries', name: 'Berries', icon: '🍇' },
  { id: 'machines', name: 'TMs & HMs', icon: '💿' },
  { id: 'key-items', name: 'Key Items', icon: '🔑' },
];

// Item card component
const ItemCard = ({ item, onClick }) => {
  return (
    <div className="item-card" onClick={() => onClick(item)}>
      <div className="item-sprite">
        {item.sprite ? (
          <img src={item.sprite} alt={item.name} />
        ) : (
          <span className="no-sprite">📦</span>
        )}
      </div>
      <div className="item-info">
        <h4 className="item-name">{item.name.replace(/-/g, ' ')}</h4>
        <span className="item-category">{item.category?.replace(/-/g, ' ')}</span>
        {item.cost > 0 && (
          <span className="item-cost">₽{item.cost.toLocaleString()}</span>
        )}
      </div>
    </div>
  );
};

// Berry card component
const BerryCard = ({ berry, onClick }) => {
  const typeColor = typeColors[berry.naturalGiftType]?.primary || '#888';
  
  return (
    <div 
      className="berry-card" 
      onClick={() => onClick(berry)}
      style={{ '--berry-color': typeColor }}
    >
      <div className="berry-sprite">
        {berry.item?.sprite ? (
          <img src={berry.item.sprite} alt={berry.name} />
        ) : (
          <span className="no-sprite">🍇</span>
        )}
      </div>
      <div className="berry-info">
        <h4 className="berry-name">{berry.name} Berry</h4>
        <div className="berry-flavors">
          {berry.flavors
            .filter(f => f.potency > 0)
            .slice(0, 2)
            .map(flavor => (
              <span key={flavor.name} className="flavor-tag">
                {flavor.name}
              </span>
            ))}
        </div>
        <span className={`berry-type type-${berry.naturalGiftType}`}>
          {berry.naturalGiftType}
        </span>
      </div>
    </div>
  );
};

// Item detail modal
const ItemDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <div className="modal-sprite">
            {item.sprite ? (
              <img src={item.sprite} alt={item.name} />
            ) : (
              <span className="no-sprite-large">📦</span>
            )}
          </div>
          <div className="modal-title">
            <h2>{item.name.replace(/-/g, ' ')}</h2>
            <span className="modal-category">{item.category?.replace(/-/g, ' ')}</span>
          </div>
        </div>

        <div className="modal-content">
          {item.flavorText && (
            <div className="modal-section">
              <h4>Description</h4>
              <p className="flavor-text">{item.flavorText}</p>
            </div>
          )}

          {item.effect && (
            <div className="modal-section">
              <h4>Effect</h4>
              <p className="effect-text">{item.effect}</p>
            </div>
          )}

          <div className="modal-stats">
            {item.cost > 0 && (
              <div className="modal-stat">
                <span className="stat-label">💰 Cost</span>
                <span className="stat-value">₽{item.cost.toLocaleString()}</span>
              </div>
            )}
            {item.flingPower && (
              <div className="modal-stat">
                <span className="stat-label">💥 Fling Power</span>
                <span className="stat-value">{item.flingPower}</span>
              </div>
            )}
          </div>

          {item.attributes && item.attributes.length > 0 && (
            <div className="modal-section">
              <h4>Attributes</h4>
              <div className="attributes-list">
                {item.attributes.map(attr => (
                  <span key={attr} className="attribute-tag">
                    {attr.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Berry detail modal
const BerryDetailModal = ({ berry, onClose }) => {
  if (!berry) return null;

  const typeColor = typeColors[berry.naturalGiftType]?.primary || '#888';

  return (
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="berry-modal" onClick={e => e.stopPropagation()} style={{ '--berry-accent': typeColor }}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <div className="modal-sprite berry-sprite-large">
            {berry.item?.sprite ? (
              <img src={berry.item.sprite} alt={berry.name} />
            ) : (
              <span className="no-sprite-large">🍇</span>
            )}
          </div>
          <div className="modal-title">
            <h2>{berry.name} Berry</h2>
            <span className={`berry-type-badge type-${berry.naturalGiftType}`}>
              {berry.naturalGiftType} type
            </span>
          </div>
        </div>

        <div className="modal-content">
          {berry.item?.flavorText && (
            <div className="modal-section">
              <h4>Description</h4>
              <p className="flavor-text">{berry.item.flavorText}</p>
            </div>
          )}

          <div className="berry-stats-grid">
            <div className="berry-stat">
              <span className="stat-icon">⏱️</span>
              <span className="stat-label">Growth Time</span>
              <span className="stat-value">{berry.growthTime} hours</span>
            </div>
            <div className="berry-stat">
              <span className="stat-icon">🌾</span>
              <span className="stat-label">Max Harvest</span>
              <span className="stat-value">{berry.maxHarvest}</span>
            </div>
            <div className="berry-stat">
              <span className="stat-icon">📏</span>
              <span className="stat-label">Size</span>
              <span className="stat-value">{berry.size}mm</span>
            </div>
            <div className="berry-stat">
              <span className="stat-icon">✨</span>
              <span className="stat-label">Smoothness</span>
              <span className="stat-value">{berry.smoothness}</span>
            </div>
            <div className="berry-stat">
              <span className="stat-icon">💪</span>
              <span className="stat-label">Firmness</span>
              <span className="stat-value">{berry.firmness}</span>
            </div>
            <div className="berry-stat">
              <span className="stat-icon">⚡</span>
              <span className="stat-label">Natural Gift Power</span>
              <span className="stat-value">{berry.naturalGiftPower}</span>
            </div>
          </div>

          <div className="modal-section">
            <h4>Flavor Profile</h4>
            <div className="flavor-bars">
              {berry.flavors.map(flavor => (
                <div key={flavor.name} className="flavor-bar-row">
                  <span className="flavor-name">{flavor.name}</span>
                  <div className="flavor-bar-container">
                    <div 
                      className="flavor-bar-fill"
                      style={{ width: `${(flavor.potency / 40) * 100}%` }}
                    ></div>
                  </div>
                  <span className="flavor-value">{flavor.potency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ItemsPage = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState([]);
  const [berries, setBerries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBerry, setSelectedBerry] = useState(null);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 30;

  // Load items
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchItemList(ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
      const itemDetails = await Promise.all(
        response.results.map(async (item) => {
          try {
            return await fetchItem(item.name);
          } catch {
            return null;
          }
        })
      );
      setItems(prev => page === 0 ? itemDetails.filter(Boolean) : [...prev, ...itemDetails.filter(Boolean)]);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Load berries
  const loadBerries = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchBerryList(64, 0);
      const berryDetails = await Promise.all(
        response.results.map(async (berry) => {
          try {
            return await fetchBerry(berry.name);
          } catch {
            return null;
          }
        })
      );
      setBerries(berryDetails.filter(Boolean));
    } catch (error) {
      console.error('Error loading berries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'items') {
      loadItems();
    } else {
      loadBerries();
    }
  }, [activeTab, loadItems, loadBerries]);

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || 
      item.category?.includes(activeCategory) ||
      (activeCategory === 'evolution' && item.category?.includes('evolution')) ||
      (activeCategory === 'pokeballs' && item.category?.includes('ball')) ||
      (activeCategory === 'medicine' && (item.category?.includes('healing') || item.category?.includes('medicine'))) ||
      (activeCategory === 'machines' && item.category?.includes('machine'));
    return matchesSearch && matchesCategory;
  });

  // Filter berries
  const filteredBerries = berries.filter(berry =>
    berry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="items-page">
      {/* Header */}
      <div className="items-header">
        <h1 className="page-title">
          <span className="title-icon">🎒</span>
          Items & Berries
        </h1>
        <p className="page-subtitle">Browse the complete database of items, berries, and evolution stones</p>
      </div>

      {/* Tab switcher */}
      <div className="items-tabs">
        <button
          className={`tab-btn ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => { setActiveTab('items'); setSearchQuery(''); }}
        >
          <span className="tab-icon">📦</span>
          <span className="tab-label">Items</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'berries' ? 'active' : ''}`}
          onClick={() => { setActiveTab('berries'); setSearchQuery(''); }}
        >
          <span className="tab-icon">🍇</span>
          <span className="tab-label">Berries</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="items-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="search-input"
          />
        </div>

        {activeTab === 'items' && (
          <div className="category-filters">
            {ITEM_CATEGORIES.slice(0, 6).map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-name">{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="items-content">
        {loading && items.length === 0 && berries.length === 0 ? (
          <div className="items-loading">
            <div className="loading-spinner"></div>
            <p>Loading {activeTab}...</p>
          </div>
        ) : activeTab === 'items' ? (
          <>
            <div className="items-grid">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onClick={setSelectedItem}
                />
              ))}
            </div>
            
            {!loading && filteredItems.length === 0 && (
              <div className="no-results">
                <span className="no-results-icon">🔍</span>
                <p>No items found</p>
              </div>
            )}

            {items.length > 0 && items.length < 500 && (
              <button
                className="load-more-btn"
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Items'}
              </button>
            )}
          </>
        ) : (
          <>
            <div className="berries-grid">
              {filteredBerries.map(berry => (
                <BerryCard
                  key={berry.id}
                  berry={berry}
                  onClick={setSelectedBerry}
                />
              ))}
            </div>
            
            {!loading && filteredBerries.length === 0 && (
              <div className="no-results">
                <span className="no-results-icon">🔍</span>
                <p>No berries found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
      
      {selectedBerry && (
        <BerryDetailModal
          berry={selectedBerry}
          onClose={() => setSelectedBerry(null)}
        />
      )}
    </div>
  );
};

export default ItemsPage;
