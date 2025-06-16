// Memory Layers Application - Client-side text processing and layer generation

class MemoryLayers {
    constructor() {
        this.processedLayers = null;
        this.currentLayer = 'structure';
        this.stopWords = new Set([
            'le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour',
            'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus',
            'par', 'grand', 'celui', 'me', 'bien', 'autre', 'si', 'leur', 'deux', 'voir',
            'ou', 'comme', 'temps', 'jour', 'lui', 'des', 'du', 'la', 'les', 'ces', 'ses',
            'mais', 'sans', 'très', 'aussi', 'alors', 'donc', 'ainsi', 'même', 'encore',
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'am', 'are',
            'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
        ]);
        
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const textInput = document.getElementById('textInput');
        const layerTabs = document.querySelectorAll('.layer-tab');

        analyzeBtn.addEventListener('click', () => this.analyzeText());
        clearBtn.addEventListener('click', () => this.clearText());
        
        textInput.addEventListener('input', () => {
            const hasText = textInput.value.trim().length > 0;
            analyzeBtn.disabled = !hasText;
            clearBtn.style.display = hasText ? 'block' : 'none';
        });

        layerTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const layer = e.currentTarget.dataset.layer;
                this.switchLayer(layer);
            });
        });
    }

    async analyzeText() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();
        
        if (!text) return;

        this.showLoadingState(true);
        
        try {
            // Simulate processing time for better UX
            await this.delay(500);
            
            // Process the text into layers
            this.processedLayers = {
                structure: this.extractStructure(text),
                keywords: this.extractKeywords(text),
                fulltext: this.formatFullText(text)
            };

            // Show the layer controls and content
            this.showLayerInterface();
            this.displayLayer(this.currentLayer);
            
        } catch (error) {
            console.error('Error analyzing text:', error);
            this.showError('Une erreur est survenue lors de l\'analyse du texte.');
        } finally {
            this.showLoadingState(false);
        }
    }

    extractStructure(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const structure = [];

        lines.forEach((line, index) => {
            let level = 0;
            let isStructural = false;

            // Check for numbered lists (1., 2., I., II., A., B., etc.)
            if (/^(\d+\.|\w\.|[IVX]+\.|[a-z]\)|\*|\-|\+)/.test(line)) {
                level = 1;
                isStructural = true;
            }
            
            // Check for ALL CAPS (potential headings)
            else if (line === line.toUpperCase() && line.length > 2 && line.length < 100) {
                level = 1;
                isStructural = true;
            }
            
            // Check for short lines that could be headings
            else if (line.length < 80 && line.length > 3) {
                const nextLine = lines[index + 1];
                const prevLine = lines[index - 1];
                
                // If followed by empty line or much longer text
                if (!nextLine || nextLine.length > line.length * 2) {
                    level = 2;
                    isStructural = true;
                }
                
                // If preceded by empty line
                if (!prevLine || prevLine.length === 0) {
                    level = Math.min(level + 1, 2);
                    isStructural = true;
                }
            }
            
            // Check for common heading patterns
            else if (/^(chapitre|chapter|section|partie|part|introduction|conclusion|résumé|summary)/i.test(line)) {
                level = 1;
                isStructural = true;
            }

            if (isStructural) {
                structure.push({
                    text: line,
                    level: level,
                    index: index
                });
            }
        });

        return structure.length > 0 ? structure : [{ text: "Aucune structure détectée", level: 1, index: 0 }];
    }

    extractKeywords(text) {
        // Clean and tokenize text
        const cleanText = text.toLowerCase()
            .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        const words = cleanText.split(' ').filter(word => 
            word.length > 2 && !this.stopWords.has(word)
        );

        // Calculate word frequencies
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // Extract noun phrases and compound terms
        const phrases = this.extractPhrases(text);
        phrases.forEach(phrase => {
            const cleanPhrase = phrase.toLowerCase().trim();
            if (cleanPhrase.length > 3 && !this.stopWords.has(cleanPhrase)) {
                wordFreq[cleanPhrase] = (wordFreq[cleanPhrase] || 0) + 2; // Give phrases higher weight
            }
        });

        // Sort by frequency and relevance
        const sortedWords = Object.entries(wordFreq)
            .filter(([word, freq]) => freq > 1 || word.length > 6) // Filter by frequency or length
            .sort(([a, freqA], [b, freqB]) => {
                // Prioritize longer terms and higher frequency
                const scoreA = freqA * (a.length > 6 ? 1.5 : 1);
                const scoreB = freqB * (b.length > 6 ? 1.5 : 1);
                return scoreB - scoreA;
            })
            .slice(0, 20); // Top 20 keywords

        return sortedWords.map(([word, freq]) => ({
            term: word,
            frequency: freq,
            relevance: this.calculateRelevance(word, freq, words.length)
        }));
    }

    extractPhrases(text) {
        const phrases = [];
        
        // Extract phrases in quotes
        const quotedPhrases = text.match(/"([^"]+)"/g) || [];
        phrases.push(...quotedPhrases.map(p => p.replace(/"/g, '')));
        
        // Extract capitalized phrases (potential proper nouns/terms)
        const capitalizedPhrases = text.match(/[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
        phrases.push(...capitalizedPhrases);
        
        // Extract phrases with common academic/technical patterns
        const technicalPhrases = text.match(/\b[a-z]+(?:[-\s][a-z]+){1,3}\b/gi) || [];
        phrases.push(...technicalPhrases.filter(p => p.length > 8));
        
        return phrases;
    }

    calculateRelevance(word, frequency, totalWords) {
        const tf = frequency / totalWords;
        const lengthBonus = Math.min(word.length / 10, 1.5);
        return tf * lengthBonus;
    }

    formatFullText(text) {
        // Enhance the original text with better formatting
        let formatted = text;
        
        // Add paragraph breaks for better readability
        formatted = formatted.replace(/\n\s*\n/g, '\n\n');
        
        // Convert structure elements to headings
        const structureElements = this.processedLayers?.structure || this.extractStructure(text);
        
        structureElements.forEach(element => {
            if (element.level === 1) {
                formatted = formatted.replace(
                    new RegExp(`^${this.escapeRegex(element.text)}$`, 'gm'),
                    `<h2>${element.text}</h2>`
                );
            } else if (element.level === 2) {
                formatted = formatted.replace(
                    new RegExp(`^${this.escapeRegex(element.text)}$`, 'gm'),
                    `<h3>${element.text}</h3>`
                );
            }
        });
        
        // Convert line breaks to paragraphs
        formatted = formatted.split('\n\n').map(paragraph => {
            if (paragraph.trim() && !paragraph.includes('<h')) {
                return `<p>${paragraph.trim()}</p>`;
            }
            return paragraph;
        }).join('\n');
        
        return formatted;
    }

    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    switchLayer(layerName) {
        if (!this.processedLayers) return;
        
        this.currentLayer = layerName;
        
        // Update active tab
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.layer === layerName);
        });
        
        this.displayLayer(layerName);
    }

    displayLayer(layerName) {
        const layerContent = document.getElementById('layerContent');
        const layerTitle = document.getElementById('layerTitle');
        const layerDescription = document.getElementById('layerDescription');
        
        // Add transition effect
        layerContent.style.opacity = '0';
        
        setTimeout(() => {
            switch (layerName) {
                case 'structure':
                    layerTitle.textContent = 'Structure du texte';
                    layerDescription.textContent = 'Éléments structurels et titres principaux';
                    layerContent.innerHTML = this.renderStructure();
                    break;
                    
                case 'keywords':
                    layerTitle.textContent = 'Mots-clés et concepts';
                    layerDescription.textContent = 'Termes importants et concepts clés identifiés';
                    layerContent.innerHTML = this.renderKeywords();
                    break;
                    
                case 'fulltext':
                    layerTitle.textContent = 'Texte complet';
                    layerDescription.textContent = 'Texte original avec formatage amélioré';
                    layerContent.innerHTML = this.renderFullText();
                    break;
            }
            
            layerContent.style.opacity = '1';
        }, 150);
    }

    renderStructure() {
        const structure = this.processedLayers.structure;
        
        if (structure.length === 0 || (structure.length === 1 && structure[0].text === "Aucune structure détectée")) {
            return '<div class="empty-state"><h3>Aucune structure détectée</h3><p>Le texte ne semble pas contenir d\'éléments structurels identifiables.</p></div>';
        }
        
        return `
            <ul class="structure-list">
                ${structure.map(item => `
                    <li class="structure-item level-${item.level}">
                        ${item.text}
                    </li>
                `).join('')}
            </ul>
        `;
    }

    renderKeywords() {
        const keywords = this.processedLayers.keywords;
        
        if (keywords.length === 0) {
            return '<div class="empty-state"><h3>Aucun mot-clé détecté</h3><p>Impossible d\'identifier des mots-clés significatifs dans ce texte.</p></div>';
        }
        
        return `
            <div class="keywords-grid">
                ${keywords.map(keyword => `
                    <div class="keyword-item">
                        <span class="keyword-term">${keyword.term}</span>
                        <span class="keyword-frequency">${keyword.frequency}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderFullText() {
        const fulltext = this.processedLayers.fulltext;
        return `<div class="fulltext-content">${fulltext}</div>`;
    }

    showLayerInterface() {
        const layerControls = document.getElementById('layerControls');
        const contentDisplay = document.getElementById('contentDisplay');
        
        layerControls.classList.remove('hidden');
        contentDisplay.classList.remove('hidden');
        
        // Update progress indicator
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        const progressIndicator = document.getElementById('progressIndicator');
        const steps = progressIndicator.querySelectorAll('.progress-step');
        
        progressIndicator.classList.remove('hidden');
        
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.classList.add('completed');
            }, index * 300);
        });
    }

    showLoadingState(isLoading) {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const btnText = analyzeBtn.querySelector('.btn-text');
        const spinner = analyzeBtn.querySelector('.loading-spinner');
        
        if (isLoading) {
            analyzeBtn.classList.add('btn--loading');
            analyzeBtn.disabled = true;
            btnText.textContent = 'Analyse en cours...';
            spinner.classList.remove('hidden');
        } else {
            analyzeBtn.classList.remove('btn--loading');
            analyzeBtn.disabled = false;
            btnText.textContent = 'Analyser le texte';
            spinner.classList.add('hidden');
        }
    }

    clearText() {
        const textInput = document.getElementById('textInput');
        const layerControls = document.getElementById('layerControls');
        const contentDisplay = document.getElementById('contentDisplay');
        const progressIndicator = document.getElementById('progressIndicator');
        
        textInput.value = '';
        layerControls.classList.add('hidden');
        contentDisplay.classList.add('hidden');
        progressIndicator.classList.add('hidden');
        
        this.processedLayers = null;
        this.currentLayer = 'structure';
        
        // Reset active tab
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.layer === 'structure');
        });
        
        // Reset button states
        document.getElementById('analyzeBtn').disabled = true;
        document.getElementById('clearBtn').style.display = 'none';
    }

    showError(message) {
        const layerContent = document.getElementById('layerContent');
        layerContent.innerHTML = `
            <div class="empty-state">
                <h3>Erreur</h3>
                <p>${message}</p>
            </div>
        `;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MemoryLayers();
});

// Add some sample text for demonstration (optional)
window.addEventListener('load', () => {
    const textInput = document.getElementById('textInput');
    if (!textInput.value) {
        // Keep the placeholder empty by default so users can paste their own content
        document.getElementById('analyzeBtn').disabled = true;
    }
});