/**
 * MobileNavigation React Component
 * Touch-optimized mobile navigation with gesture support,
 * bottom sheet patterns, and enhanced mobile UX
 */

import { useState, useEffect, useRef } from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  badge?: number;
  isActive?: boolean;
  children?: NavigationItem[];
}

interface MobileNavigationProps {
  items: NavigationItem[];
  currentPath?: string;
  onItemClick?: (item: NavigationItem) => void;
  showBottomNav?: boolean;
  showHamburgerMenu?: boolean;
  comparisonCount?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  currentPath = '',
  onItemClick,
  showBottomNav = true,
  showHamburgerMenu = true,
  comparisonCount = 0
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const bottomSheetRef = useRef<HTMLDivElement>(null);
  const menuOverlayRef = useRef<HTMLDivElement>(null);

  // Primary navigation items for bottom nav
  const primaryItems = items.slice(0, 4);
  const moreItems = items.slice(4);

  // Handle menu toggle
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setActiveSubmenu(null);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  // Handle bottom sheet for "More" menu
  const toggleBottomSheet = () => {
    setIsBottomSheetOpen(!isBottomSheetOpen);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  };

  // Handle submenu toggle
  const toggleSubmenu = (itemId: string) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  // Handle item selection
  const handleItemClick = (item: NavigationItem) => {
    if (item.children && item.children.length > 0) {
      toggleSubmenu(item.id);
      return;
    }

    if (onItemClick) {
      onItemClick(item);
    } else {
      window.location.href = item.url;
    }
    
    // Close menus
    setIsMenuOpen(false);
    setIsBottomSheetOpen(false);
    setActiveSubmenu(null);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  };

  // Bottom sheet drag handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !bottomSheetRef.current) return;
    
    const touch = e.touches[0];
    const deltaY = Math.max(0, touch.clientY - touchStartY);
    
    if (deltaY > 10) {
      setDragOffset(deltaY);
      bottomSheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !bottomSheetRef.current) return;
    
    setIsDragging(false);
    
    if (dragOffset > 100) {
      // Close bottom sheet if dragged down enough
      setIsBottomSheetOpen(false);
    }
    
    // Reset transform
    bottomSheetRef.current.style.transform = '';
    setDragOffset(0);
    setTouchStartY(0);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOverlayRef.current && !menuOverlayRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Check if item is active
  const isItemActive = (item: NavigationItem) => {
    return currentPath.includes(item.url) || item.isActive;
  };

  return (
    <>
      {/* Hamburger Menu */}
      {showHamburgerMenu && (
        <div className="mobile-hamburger-container">
          <button
            className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      )}

      {/* Side Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" ref={menuOverlayRef}>
          <div className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-side-menu">
            <div className="side-menu-header">
              <div className="menu-logo">
                <span className="logo-icon">⚡</span>
                <span className="logo-text">ChooseMyPower</span>
              </div>
              <button
                className="close-menu-btn"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            
            <div className="side-menu-content">
              <nav className="side-menu-nav">
                {items.map((item) => (
                  <div key={item.id} className="side-menu-item-container">
                    <button
                      className={`side-menu-item ${isItemActive(item) ? 'active' : ''} ${
                        item.children && item.children.length > 0 ? 'has-children' : ''
                      }`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="menu-item-content">
                        <span className="menu-item-icon">{item.icon}</span>
                        <span className="menu-item-label">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="menu-item-badge">{item.badge}</span>
                        )}
                      </div>
                      {item.children && item.children.length > 0 && (
                        <span className={`submenu-arrow ${activeSubmenu === item.id ? 'expanded' : ''}`}>
                          ▼
                        </span>
                      )}
                    </button>
                    
                    {/* Submenu */}
                    {item.children && activeSubmenu === item.id && (
                      <div className="side-submenu">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            className={`side-submenu-item ${isItemActive(child) ? 'active' : ''}`}
                            onClick={() => handleItemClick(child)}
                          >
                            <span className="submenu-item-icon">{child.icon}</span>
                            <span className="submenu-item-label">{child.label}</span>
                            {child.badge && child.badge > 0 && (
                              <span className="submenu-item-badge">{child.badge}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <div className="mobile-bottom-nav">
          <div className="bottom-nav-container">
            {primaryItems.map((item) => (
              <button
                key={item.id}
                className={`bottom-nav-item ${isItemActive(item) ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
                aria-label={item.label}
              >
                <div className="bottom-nav-icon-container">
                  <span className="bottom-nav-icon">{item.icon}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bottom-nav-badge">{item.badge}</span>
                  )}
                </div>
                <span className="bottom-nav-label">{item.label}</span>
              </button>
            ))}
            
            {/* More Button */}
            {moreItems.length > 0 && (
              <button
                className="bottom-nav-item more-btn"
                onClick={toggleBottomSheet}
                aria-label="More options"
              >
                <div className="bottom-nav-icon-container">
                  <span className="bottom-nav-icon">⋯</span>
                </div>
                <span className="bottom-nav-label">More</span>
              </button>
            )}
            
            {/* Comparison Button */}
            {comparisonCount > 0 && (
              <button
                className="bottom-nav-item comparison-btn active"
                onClick={() => handleItemClick({
                  id: 'comparison',
                  label: 'Compare',
                  icon: '📊',
                  url: '/compare'
                })}
                aria-label={`Compare ${comparisonCount} plans`}
              >
                <div className="bottom-nav-icon-container">
                  <span className="bottom-nav-icon">📊</span>
                  <span className="bottom-nav-badge">{comparisonCount}</span>
                </div>
                <span className="bottom-nav-label">Compare</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet for More Items */}
      {isBottomSheetOpen && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet-backdrop" onClick={() => setIsBottomSheetOpen(false)} />
          <div
            ref={bottomSheetRef}
            className="bottom-sheet"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="bottom-sheet-handle" />
            
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">More Options</h3>
              <button
                className="bottom-sheet-close"
                onClick={() => setIsBottomSheetOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="bottom-sheet-content">
              <div className="bottom-sheet-grid">
                {moreItems.map((item) => (
                  <button
                    key={item.id}
                    className={`bottom-sheet-item ${isItemActive(item) ? 'active' : ''}`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="sheet-item-icon-container">
                      <span className="sheet-item-icon">{item.icon}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="sheet-item-badge">{item.badge}</span>
                      )}
                    </div>
                    <span className="sheet-item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;

// Mobile navigation styles
const styles = `
/* Hamburger Menu Button */
.mobile-hamburger-container {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
}

.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: white;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background: #374151;
  border-radius: 1px;
  transition: all 0.3s ease;
  margin: 2px 0;
}

.hamburger-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* Side Menu Overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
}

.mobile-menu-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.mobile-side-menu {
  position: relative;
  width: 280px;
  max-width: 85vw;
  height: 100vh;
  background: white;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  animation: slideInFromLeft 0.3s ease-out;
}

@keyframes slideInFromLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Side Menu Header */
.side-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #002768, #be0b31);
  color: white;
}

.menu-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
}

.close-menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  font-weight: bold;
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Side Menu Content */
.side-menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.side-menu-nav {
  display: flex;
  flex-direction: column;
}

.side-menu-item-container {
  border-bottom: 1px solid #f9fafb;
}

.side-menu-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.side-menu-item:hover {
  background: #f9fafb;
}

.side-menu-item.active {
  background: linear-gradient(135deg, rgba(0, 39, 104, 0.1), rgba(190, 11, 49, 0.1));
  border-right: 4px solid #002768;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.menu-item-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.menu-item-label {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
}

.menu-item-badge,
.submenu-item-badge,
.sheet-item-badge {
  background: #dc2626;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.submenu-arrow {
  font-size: 12px;
  color: #9ca3af;
  transition: transform 0.3s ease;
}

.submenu-arrow.expanded {
  transform: rotate(180deg);
}

/* Submenu */
.side-submenu {
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  animation: expandDown 0.3s ease-out;
  overflow: hidden;
}

@keyframes expandDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 300px;
    opacity: 1;
  }
}

.side-submenu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px 12px 48px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.side-submenu-item:hover {
  background: #f3f4f6;
}

.side-submenu-item.active {
  background: #e0f2fe;
  color: #0369a1;
}

.submenu-item-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.submenu-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  flex: 1;
}

/* Bottom Navigation */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 998;
  background: white;
  border-top: 1px solid #f3f4f6;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.bottom-nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 16px;
  max-width: 100%;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 12px;
  min-width: 64px;
}

.bottom-nav-item:active {
  transform: scale(0.95);
}

.bottom-nav-item.active {
  background: linear-gradient(135deg, rgba(0, 39, 104, 0.1), rgba(190, 11, 49, 0.1));
}

.bottom-nav-item.comparison-btn.active {
  background: linear-gradient(135deg, #dc2626, #991b1b);
  color: white;
}

.bottom-nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-nav-icon {
  font-size: 22px;
  transition: transform 0.2s;
}

.bottom-nav-item.active .bottom-nav-icon {
  transform: scale(1.1);
}

.bottom-nav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #dc2626;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-nav-item.active .bottom-nav-label {
  color: #002768;
  font-weight: 600;
}

.bottom-nav-item.comparison-btn.active .bottom-nav-label {
  color: white;
}

/* Bottom Sheet */
.bottom-sheet-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1001;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.bottom-sheet {
  position: relative;
  width: 100%;
  max-height: 70vh;
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  animation: slideUpFromBottom 0.3s ease-out;
  touch-action: none;
}

@keyframes slideUpFromBottom {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.bottom-sheet-handle {
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 12px auto 0;
}

.bottom-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.bottom-sheet-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.bottom-sheet-close {
  background: none;
  border: none;
  color: #6b7280;
  font-size: 18px;
  font-weight: bold;
  padding: 4px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.bottom-sheet-close:hover {
  background: #f3f4f6;
}

.bottom-sheet-content {
  padding: 20px;
  overflow-y: auto;
  max-height: 50vh;
}

.bottom-sheet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
}

.bottom-sheet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: none;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.bottom-sheet-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.bottom-sheet-item.active {
  background: linear-gradient(135deg, rgba(0, 39, 104, 0.1), rgba(190, 11, 49, 0.1));
  border-color: #002768;
}

.bottom-sheet-item:active {
  transform: scale(0.96);
}

.sheet-item-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-item-icon {
  font-size: 24px;
}

.sheet-item-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

.sheet-item-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  line-height: 1.3;
}

/* Safe area adjustments for iPhone X+ */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .mobile-bottom-nav {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* Landscape mode adjustments */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-side-menu {
    width: 240px;
  }
  
  .side-menu-header {
    padding: 16px 20px;
  }
  
  .side-menu-item {
    padding: 12px 20px;
  }
  
  .bottom-sheet {
    max-height: 85vh;
  }
}

/* Tablet optimizations */
@media (min-width: 768px) {
  .mobile-hamburger-container {
    top: 20px;
    left: 20px;
  }
  
  .hamburger-btn {
    width: 48px;
    height: 48px;
  }
  
  .mobile-side-menu {
    width: 320px;
  }
  
  .bottom-nav-container {
    padding: 12px 24px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .bottom-nav-item {
    padding: 12px 16px;
    min-width: 80px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .hamburger-btn {
    background: #374151;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .hamburger-line {
    background: #f9fafb;
  }
  
  .mobile-side-menu,
  .mobile-bottom-nav,
  .bottom-sheet {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .side-menu-item {
    color: #f9fafb;
  }
  
  .menu-item-label {
    color: #e5e7eb;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .mobile-side-menu,
  .bottom-sheet,
  .side-submenu {
    animation: none;
  }
  
  .hamburger-line,
  .submenu-arrow {
    transition: none;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('mobile-navigation-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'mobile-navigation-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}