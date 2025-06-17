class MemoryLayers {
    constructor() {
        this.originalText = '';
        this.detectedTitles = [];
        this.extractedKeywords = [];
        this.currentLayer = 'titles';
        this.isAnalyzing = false;
        
        // Mots vides français et anglais
        this.stopWords = new Set([
            // Français
            'le', 'de', 'un', 'à', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'il', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'pouvoir', 'son', 'une', 'sur', 'mais', 'comme', 'je', 'leur', 'bien', 'encore', 'sans', 'autre', 'après', 'premier', 'vouloir', 'bon', 'nouveau', 'grand', 'notre', 'faire', 'où', 'plus', 'très', 'moins', 'quand', 'comment', 'aussi', 'donc', 'ainsi', 'alors', 'peut', 'cette', 'ces', 'des', 'du', 'par', 'la', 'les', 'aux', 'ses', 'mes', 'tes', 'nos', 'vos', 'leurs', 'si', 'ou', 'ni', 'car', 'or', 'donc', 'mais', 'cependant', 'néanmoins', 'toutefois', 'pourtant', 'malgré', 'selon', 'vers', 'chez', 'sous', 'entre', 'parmi', 'pendant', 'depuis', 'jusqu', 'avant', 'après', 'devant', 'derrière', 'autour', 'près', 'loin', 'dedans', 'dehors', 'dessus', 'dessous',
            // Anglais
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'out', 'off', 'down', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'against', 'between', 'as', 'if', 'while', 'because', 'until', 'although', 'unless', 'since'
        ]);
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStats();
    }
    
    bindEvents() {
        const textInput = document.getElementById('textInput');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const clearBtn = document.getElementById('clearBtn');
        const layerBtns = document.querySelectorAll('.layer-btn');
        
        textInput.addEventListener('input', () => this.updateStats());
        analyzeBtn.addEventListener('click', () => this.analyzeText());
        clearBtn.addEventListener('click', () => this.clearText());
        
        layerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layer = e.target.dataset.layer;
                this.switchLayer(layer);
            });
        });
    }
    
    updateStats() {
        const textInput = document.getElementById('textInput');
        const text = textInput.value;
        
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        document.getElementById('charCount').textContent = `${charCount} caractères`;
        document.getElementById('wordCount').textContent = `${wordCount} mots`;
    }
    
    async analyzeText() {
        if (this.isAnalyzing) return;
        
        const textInput = document.getElementById('textInput');
        const text = textInput.value.trim();
        
        if (text.length < 50) {
            this.showError('Le texte doit contenir au moins 50 caractères.');
            return;
        }
        
        this.isAnalyzing = true;
        this.showAnalyzing(true);
        this.hideError();
        
        try {
            // Simulation d'un délai de traitement
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.originalText = text;
            this.detectedTitles = this.detectStructure(text);
            this.extractedKeywords = this.extractKeywords(text);
            
            this.showControls();
            this.displayLayer('titles');
            
        } catch (error) {
            this.showError('Erreur lors de l\'analyse du texte.');
            console.error('Analysis error:', error);
        } finally {
            this.isAnalyzing = false;
            this.showAnalyzing(false);
        }
    }
    
    detectStructure(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const titles = [];
        
        lines.forEach((line, index) => {
            let level = 0;
            let isTitle = false;
            
            // Pattern 1: Lignes commençant par des numéros
            if (/^(\d+\.|\d+\)|\d+\s+[A-Z]|[IVX]+\.|\w\.)/.test(line)) {
                isTitle = true;
                level = 1;
            }
            
            // Pattern 2: Lignes courtes (moins de 80 caractères) et suivies d'un saut de ligne
            if (line.length < 80 && index < lines.length - 1) {
                const nextLine = lines[index + 1];
                if (nextLine && nextLine.length > line.length * 1.5) {
                    isTitle = true;
                    level = 2;
                }
            }
            
            // Pattern 3: Lignes en majuscules
            if (line === line.toUpperCase() && line.length > 3 && line.length < 100) {
                isTitle = true;
                level = 1;
            }
            
            // Pattern 4: Lignes commençant par des mots-clés de titre
            const titleKeywords = [
                'chapitre', 'section', 'partie', 'introduction', 'conclusion', 'résumé', 'sommaire',
                'chapter', 'section', 'part', 'introduction', 'conclusion', 'summary', 'overview'
            ];
            
            const firstWord = line.toLowerCase().split(' ')[0];
            if (titleKeywords.includes(firstWord)) {
                isTitle = true;
                level = 1;
            }
            
            // Pattern 5: Lignes se terminant par ":"
            if (line.endsWith(':') && line.length < 100) {
                isTitle = true;
                level = 2;
            }
            
            if (isTitle) {
                titles.push({
                    text: line,
                    level: level,
                    index: index
                });
            }
        });
        
        return titles;
    }
    
    extractKeywords(text) {
        // Nettoyer le texte
        const cleanText = text.toLowerCase()
            .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Tokenisation
        const words = cleanText.split(' ').filter(word => 
            word.length > 2 && 
            !this.stopWords.has(word) &&
            !/^\d+$/.test(word)
        );
        
        // Calcul de la fréquence (TF)
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // Calcul du TF-IDF simplifié
        const totalWords = words.length;
        const keywords = [];
        
        for (const [word, freq] of Object.entries(wordFreq)) {
            if (freq > 1) { // Mots apparaissant au moins 2 fois
                const tf = freq / totalWords;
                const idf = Math.log(totalWords / freq); // IDF simplifié
                const score = tf * idf;
                
                keywords.push({
                    word: word,
                    frequency: freq,
                    score: score
                });
            }
        }
        
        // Trier par score et prendre les 20 premiers
        return keywords
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);
    }
    
    switchLayer(layer) {
        this.currentLayer = layer;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.layer-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-layer="${layer}"]`).classList.add('active');
        
        // Afficher le contenu
        this.displayLayer(layer);
    }
    
    displayLayer(layer) {
        const layerTitle = document.getElementById('layerTitle');
        const layerContent = document.getElementById('layerContent');
        
        layerContent.innerHTML = '';
        layerContent.classList.add('fade-in');
        
        switch (layer) {
            case 'titles':
                layerTitle.textContent = 'Structure du texte - Titres détectés';
                this.displayTitles(layerContent);
                break;
            case 'keywords':
                layerTitle.textContent = 'Mots-clés extraits (TF-IDF)';
                this.displayKeywords(layerContent);
                break;
            case 'fulltext':
                layerTitle.textContent = 'Texte complet formaté';
                this.displayFullText(layerContent);
                break;
        }
        
        // Retirer l'animation après un délai
        setTimeout(() => {
            layerContent.classList.remove('fade-in');
        }, 300);
    }
    
    displayTitles(container) {
        if (this.detectedTitles.length === 0) {
            container.innerHTML = '<p>Aucun titre détecté dans ce texte. Essayez avec un texte plus structuré.</p>';
            return;
        }
        
        const titlesList = document.createElement('ul');
        titlesList.className = 'titles-list';
        
        this.detectedTitles.forEach(title => {
            const li = document.createElement('li');
            li.className = `title-level-${title.level}`;
            li.textContent = title.text;
            titlesList.appendChild(li);
        });
        
        container.appendChild(titlesList);
    }
    
    displayKeywords(container) {
        if (this.extractedKeywords.length === 0) {
            container.innerHTML = '<p>Aucun mot-clé significatif détecté.</p>';
            return;
        }
        
        const keywordsGrid = document.createElement('div');
        keywordsGrid.className = 'keywords-grid';
        
        this.extractedKeywords.forEach(keyword => {
            const keywordDiv = document.createElement('div');
            keywordDiv.className = 'keyword-item';
            
            const wordSpan = document.createElement('span');
            wordSpan.textContent = keyword.word;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'keyword-score';
            scoreSpan.textContent = `${keyword.frequency} occurrences`;
            
            keywordDiv.appendChild(wordSpan);
            keywordDiv.appendChild(scoreSpan);
            keywordsGrid.appendChild(keywordDiv);
        });
        
        container.appendChild(keywordsGrid);
    }
    
    displayFullText(container) {
        const fullTextDiv = document.createElement('div');
        fullTextDiv.className = 'full-text';
        
        const paragraphs = this.originalText.split('\n\n');
        
        paragraphs.forEach(paragraph => {
            const p = document.createElement('p');
            
            // Vérifier si c'est un titre détecté
            const isTitle = this.detectedTitles.some(title => 
                paragraph.trim().includes(title.text)
            );
            
            if (isTitle) {
                p.className = 'highlighted-title';
            }
            
            p.textContent = paragraph.trim();
            if (paragraph.trim()) {
                fullTextDiv.appendChild(p);
            }
        });
        
        container.appendChild(fullTextDiv);
    }
    
    showControls() {
        const controlSection = document.getElementById('controlSection');
        const displaySection = document.getElementById('displaySection');
        
        controlSection.classList.remove('hidden');
        displaySection.classList.remove('hidden');
        
        setTimeout(() => {
            controlSection.classList.add('show');
            displaySection.classList.add('show');
        }, 100);
    }
    
    hideControls() {
        const controlSection = document.getElementById('controlSection');
        const displaySection = document.getElementById('displaySection');
        
        controlSection.classList.remove('show');
        displaySection.classList.remove('show');
        
        setTimeout(() => {
            controlSection.classList.add('hidden');
            displaySection.classList.add('hidden');
        }, 300);
    }
    
    showAnalyzing(show) {
        const analyzeText = document.getElementById('analyzeText');
        const analyzeLoader = document.getElementById('analyzeLoader');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const body = document.body;
        
        if (show) {
            analyzeText.classList.add('hidden');
            analyzeLoader.classList.remove('hidden');
            analyzeBtn.disabled = true;
            body.classList.add('loading');
        } else {
            analyzeText.classList.remove('hidden');
            analyzeLoader.classList.add('hidden');
            analyzeBtn.disabled = false;
            body.classList.remove('loading');
        }
    }
    
    showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }
    
    hideError() {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.classList.add('hidden');
    }
    
    clearText() {
        document.getElementById('textInput').value = '';
        this.originalText = '';
        this.detectedTitles = [];
        this.extractedKeywords = [];
        this.currentLayer = 'titles';
        
        this.hideControls();
        this.hideError();
        this.updateStats();
        
        // S'assurer que le bouton d'analyse est dans l'état normal
        this.showAnalyzing(false);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    new MemoryLayers();
});