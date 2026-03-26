/**
 * CDL Accessibility Utilities
 * Helper functions for testing and improving accessibility
 */

/**
 * Check if an element is accessible to screen readers
 */
export function isAccessibleToScreenReader(element: HTMLElement): boolean {
  // Check if element is hidden from screen readers
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // Check if element or parent has display:none or visibility:hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  return true;
}

/**
 * Get accessible name for an element
 */
export function getAccessibleName(element: HTMLElement): string {
  // Priority: aria-labelledby > aria-label > title > placeholder
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    if (labelElement) {
      return labelElement.textContent || '';
    }
  }
  
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }
  
  const title = element.getAttribute('title');
  if (title) {
    return title;
  }
  
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const placeholder = element.placeholder;
    if (placeholder) {
      return placeholder;
    }
  }
  
  return element.textContent || '';
}

/**
 * Validate chart accessibility
 * Run this in browser console to check accessibility issues
 */
export function validateChartAccessibility(chartContainer: HTMLElement): {
  passed: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check if container has appropriate role
  const role = chartContainer.getAttribute('role');
  if (!role) {
    issues.push('Chart container is missing role attribute (should be "img" or "region")');
  }
  
  // Check if container has accessible name
  const accessibleName = getAccessibleName(chartContainer);
  if (!accessibleName) {
    issues.push('Chart container is missing accessible name (aria-label or aria-labelledby)');
  }
  
  // Check for focusable elements
  const focusableElements = chartContainer.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  focusableElements.forEach((el) => {
    const element = el as HTMLElement;
    const name = getAccessibleName(element);
    
    if (!name) {
      warnings.push(`Focusable element is missing accessible name: ${el.tagName}`);
    }
    
    // Check for visible focus indicator
    const style = window.getComputedStyle(element);
    if (style.outlineStyle === 'none' && !element.classList.contains('focus-visible')) {
      warnings.push(`Element may not have visible focus indicator: ${el.tagName}`);
    }
  });
  
  // Check for live regions
  const liveRegions = chartContainer.querySelectorAll('[aria-live]');
  if (liveRegions.length === 0) {
    warnings.push('No aria-live regions found for dynamic content announcements');
  }
  
  return {
    passed: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Keyboard navigation helper
 * Returns information about keyboard navigation capabilities
 */
export function analyzeKeyboardNavigation(container: HTMLElement): {
  tabbableElements: Element[];
  focusTraps: string[];
  recommendations: string[];
} {
  const tabbableElements = Array.from(
    container.querySelectorAll(
      'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  
  const recommendations: string[] = [];
  
  // Check for skip links
  const skipLink = document.querySelector('.skip-link');
  if (!skipLink) {
    recommendations.push('Consider adding a skip link for keyboard users');
  }
  
  // Check focus order
  if (tabbableElements.length > 10) {
    recommendations.push('Many tabbable elements - consider grouping or providing shortcuts');
  }
  
  // Check for focus indicators
  tabbableElements.forEach((el) => {
    const element = el as HTMLElement;
    const style = window.getComputedStyle(element);
    if (style.outlineStyle === 'none') {
      const hasFocusStyle = element.matches(':focus-visible') || 
        element.classList.contains('focus-visible') ||
        element.style.outline !== '';
      
      if (!hasFocusStyle) {
        recommendations.push(`Add focus indicator for: ${el.tagName}`);
      }
    }
  });
  
  return {
    tabbableElements,
    focusTraps: [],
    recommendations,
  };
}

/**
 * Announce message to screen readers
 * This is the same function used internally by CDLChart
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', priority);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  `;
  
  document.body.appendChild(liveRegion);
  
  // Trigger announcement
  liveRegion.textContent = message;
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
}

/**
 * Focus trap for modals/dialogs
 */
export function createFocusTrap(container: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  let previouslyFocusedElement: Element | null = null;
  
  const getTabbableElements = () => {
    return Array.from(
      container.querySelectorAll(
        'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[];
  };
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    
    const tabbableElements = getTabbableElements();
    if (tabbableElements.length === 0) return;
    
    const firstElement = tabbableElements[0];
    const lastElement = tabbableElements[tabbableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };
  
  return {
    activate: () => {
      previouslyFocusedElement = document.activeElement;
      container.addEventListener('keydown', handleKeyDown);
      
      // Focus first tabbable element
      const tabbableElements = getTabbableElements();
      if (tabbableElements.length > 0) {
        tabbableElements[0].focus();
      }
    },
    deactivate: () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus
      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    },
  };
}

/**
 * High contrast mode detection
 */
export function isHighContrastMode(): boolean {
  // Check Windows high contrast mode
  const mediaQuery = window.matchMedia('(-ms-high-contrast: active), (prefers-contrast: high)');
  return mediaQuery.matches;
}

/**
 * Reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

// Default export
export default {
  isAccessibleToScreenReader,
  getAccessibleName,
  validateChartAccessibility,
  analyzeKeyboardNavigation,
  announceToScreenReader,
  createFocusTrap,
  isHighContrastMode,
  prefersReducedMotion,
};
