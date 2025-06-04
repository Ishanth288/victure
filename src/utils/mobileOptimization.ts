
/**
 * Mobile-specific optimization utilities
 */

export function optimizeForMobile() {
  // Prevent zoom on input focus
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // Prevent horizontal scrolling
  document.body.style.overflowX = 'hidden';
  
  // Optimize touch interactions
  document.body.style.touchAction = 'manipulation';
  
  // Add mobile-specific CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent text selection on mobile */
    .mobile-no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Optimize button tap targets */
    .mobile-button {
      min-height: 44px;
      min-width: 44px;
    }
    
    /* Prevent pull-to-refresh on mobile */
    body {
      overscroll-behavior-y: contain;
    }
    
    /* Hide desktop scrollbars on mobile */
    @media (max-width: 768px) {
      ::-webkit-scrollbar {
        display: none;
      }
      * {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    }
    
    /* Ensure proper spacing for mobile bottom navigation */
    @media (max-width: 768px) {
      .mobile-content {
        padding-bottom: 80px;
      }
    }
  `;
  document.head.appendChild(style);
}

export function preventDesktopAccess() {
  // Hide desktop elements on mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .desktop-only {
        display: none !important;
      }
      
      /* Hide desktop sidebar */
      .sidebar {
        display: none !important;
      }
      
      /* Prevent desktop navigation access */
      .desktop-nav {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}
