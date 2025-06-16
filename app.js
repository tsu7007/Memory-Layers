/**
 * Memory Layers App - JavaScript
 * Handles progressive text revelation through three layers:
 * 1. Structure (titles only)
 * 2. Keywords (titles + keywords)
 * 3. Full Text (complete content)
 */

class MemoryLayers {
    constructor() {
        this.currentLayer = 'structure';
        this.buttons = document.querySelectorAll('.btn--layer');
        this.content = document.querySelector('.content');
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setLayer(this.currentLayer);
        
        // Add initial layer class to content
        this.content.classList.add('layer-structure');
        
        console.log('Memory Layers app initialized');
    }

    /**
     * Set up event listeners for layer toggle buttons
     */
    setupEventListeners() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const layer = e.target.getAttribute('data-layer');
                this.setLayer(layer);
            });

            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const layer = e.target.getAttribute('data-layer');
                    this.setLayer(layer);
                }
            });
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only if no input is focused
            if (document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                
                switch(e.key) {
                    case '1':
                        this.setLayer('structure');
                        break;
                    case '2':
                        this.setLayer('keywords');
                        break;
                    case '3':
                        this.setLayer('fulltext');
                        break;
                }
            }
        });
    }

    /**
     * Set the active layer and update the UI
     * @param {string} layer - The layer to activate ('structure', 'keywords', 'fulltext')
     */
    setLayer(layer) {
        if (!['structure', 'keywords', 'fulltext'].includes(layer)) {
            console.error('Invalid layer:', layer);
            return;
        }

        // Update current layer
        this.currentLayer = layer;

        // Update button states
        this.updateButtonStates(layer);

        // Update content visibility
        this.updateContentVisibility(layer);

        // Log for debugging
        console.log('Layer changed to:', layer);
    }

    /**
     * Update the active state of layer toggle buttons
     * @param {string} activeLayer - The currently active layer
     */
    updateButtonStates(activeLayer) {
        this.buttons.forEach(button => {
            const buttonLayer = button.getAttribute('data-layer');
            
            if (buttonLayer === activeLayer) {
                button.classList.add('btn--active');
                button.setAttribute('aria-pressed', 'true');
            } else {
                button.classList.remove('btn--active');
                button.setAttribute('aria-pressed', 'false');
            }
        });
    }

    /**
     * Update content visibility based on the active layer
     * @param {string} layer - The active layer
     */
    updateContentVisibility(layer) {
        // Remove all layer classes
        this.content.classList.remove('layer-structure', 'layer-keywords', 'layer-fulltext');
        
        // Add the appropriate layer class
        this.content.classList.add(`layer-${layer}`);

        // Announce changes for screen readers
        this.announceLayerChange(layer);
    }

    /**
     * Announce layer changes for accessibility
     * @param {string} layer - The active layer
     */
    announceLayerChange(layer) {
        const announcements = {
            'structure': 'Affichage des titres uniquement',
            'keywords': 'Affichage des titres et mots-clés',
            'fulltext': 'Affichage du texte complet'
        };

        // Create or update announcement element
        let announcer = document.getElementById('layer-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'layer-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            document.body.appendChild(announcer);
        }

        announcer.textContent = announcements[layer] || '';
    }

    /**
     * Get the current active layer
     * @returns {string} The current layer
     */
    getCurrentLayer() {
        return this.currentLayer;
    }

    /**
     * Check if a specific layer is active
     * @param {string} layer - The layer to check
     * @returns {boolean} True if the layer is active
     */
    isLayerActive(layer) {
        return this.currentLayer === layer;
    }
}

/**
 * Utility function to add smooth scroll behavior to internal links
 */
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the Memory Layers app
    const app = new MemoryLayers();
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Make app instance available globally for debugging
    window.memoryLayersApp = app;
    
    // Add loading state management
    document.body.classList.add('app-loaded');
    
    console.log('Memory Layers application ready');
});

/**
 * Handle page visibility changes to maintain state
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Page became visible, maintaining current layer state');
    }
});

/**
 * Export for potential module usage
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryLayers;
}