import { eventBus } from './eventBus.js';

const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
const orbsView = document.getElementById('orbs-view'); // Nuova view per gli orb
const learningView = document.getElementById('learning-view');

let currentCourse = null;
let currentProgress = null;

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function renderPathway() {
    const { course, progress } = { course: currentCourse, progress: currentProgress };
    
    const totalTiles = course.pathway.tiles.length;
    const completedCount = progress.completedTiles.size;
    const percentage = Math.min(100, Math.round((completedCount / totalTiles) * 100 || 0));

    let tilesHtml = course.pathway.tiles.map(tile => {
        const isCompleted = progress.completedTiles.has(tile.id);
        return `<div class="tile ${isCompleted ? 'completed' : ''}" data-tile-id="${tile.id}">
                  ${tile.title} ${isCompleted ? '✅' : ''}
                </div>`;
    }).join('');

    pathwayView.innerHTML = `
        <div class="card">
            <h2>${course.title}</h2>
            <p>Completamento: <span>${percentage}%</span></p>
            <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%"></div>
            </div>
            <div style="margin: 1rem 0;">
                <button id="reset-progress-btn" style="background-color: #dc2626; font-size: 0.875rem; padding: 0.5rem 1rem;">🗑️ Reset Progresso</button>
            </div>
            <div id="tiles-container">${tilesHtml}</div>
        </div>
    `;

    pathwayView.querySelectorAll('.tile').forEach(tileElement => {
        const tileId = tileElement.dataset.tileId;
        tileElement.addEventListener('click', () => {
            eventBus.emit('showTileOrbs', { tileId });
        });
    });
    
    const resetButton = pathwayView.querySelector('#reset-progress-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Sei sicuro di voler resettare tutto il progresso di questo corso? Questa azione non può essere annullata.')) {
                eventBus.emit('resetProgress');
            }
        });
    }
    
    showView('pathway-view');
}

function renderTileOrbs(tileId) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) {
        console.error(`Tile ${tileId} non trovato`);
        return;
    }

    if (!tile.orbs || tile.orbs.length === 0) {
        // Tile vuoto, completa subito
        eventBus.emit('updateProgress', { tileId });
        renderPathway();
        return;
    }

    let orbsHtml = tile.orbs.map((orb, orbIndex) => {
        const lessonCount = orb.contents.filter(c => c.type === 'lesson').length;
        const flashcardCount = orb.contents.filter(c => c.type === 'flashcard').length;
        const totalContent = orb.contents.length;
        
        let contentIndicators = '';
        if (lessonCount > 0) {
            contentIndicators += `<span class="content-indicator lesson">📖 ${lessonCount}</span>`;
        }
        if (flashcardCount > 0) {
            contentIndicators += `<span class="content-indicator flashcard">🃏 ${flashcardCount}</span>`;
        }
        
        return `
            <div class="orb-tile" data-tile-id="${tileId}" data-orb-index="${orbIndex}">
                <h4>${orb.title}</h4>
                <div class="content-indicators">
                    ${contentIndicators}
                    <span class="total-content">(${totalContent} elementi)</span>
                </div>
            </div>
        `;
    }).join('');

    const orbsViewHtml = `
        <div class="card">
            <button class="back-button">← Torna al percorso</button>
            <h2>${tile.title}</h2>
            <p>Seleziona un modulo per iniziare:</p>
            <div id="orbs-container">${orbsHtml}</div>
        </div>
    `;

    // Creiamo la view se non esiste
    let orbsViewElement = document.getElementById('orbs-view');
    if (!orbsViewElement) {
        orbsViewElement = document.createElement('div');
        orbsViewElement.id = 'orbs-view';
        orbsViewElement.className = 'view';
        document.querySelector('.container').appendChild(orbsViewElement);
    }

    orbsViewElement.innerHTML = orbsViewHtml;

    // Aggiungi listener per tornare indietro
    orbsViewElement.querySelector('.back-button').addEventListener('click', renderPathway);

    // Aggiungi listener per gli orb
    orbsViewElement.querySelectorAll('.orb-tile').forEach(orbElement => {
        const tileId = orbElement.dataset.tileId;
        const orbIndex = parseInt(orbElement.dataset.orbIndex);
        
        orbElement.addEventListener('click', () => {
            eventBus.emit('startLearningSession', { tileId, orbIndex });
        });
    });

    showView('orbs-view');
}

function renderLearningSession(tileId, orbIndex = 0) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) {
        console.error(`Tile ${tileId} non trovato`);
        return;
    }
    
    if (!tile.orbs || tile.orbs.length === 0) {
        // Tile vuoto, completa subito
        eventBus.emit('updateProgress', { tileId });
        renderPathway();
        return;
    }

    // Indici per navigare la struttura gerarchica - iniziamo dall'orb selezionato
    let currentOrbIndex = orbIndex;
    let contentIndex = 0;

    const renderCurrentContent = () => {
        // Se abbiamo finito i contenuti dell'orb corrente, passiamo al prossimo orb
        if (contentIndex >= tile.orbs[currentOrbIndex].contents.length) {
            contentIndex = 0;
            currentOrbIndex++;
        }

        // Se abbiamo finito tutti gli orb, la sessione è finita
        if (currentOrbIndex >= tile.orbs.length) {
            eventBus.emit('updateProgress', { tileId });
            renderPathway();
            return;
        }

        const currentOrb = tile.orbs[currentOrbIndex];
        
        // Se l'orb corrente non ha contenuti, passa al prossimo
        if (!currentOrb.contents || currentOrb.contents.length === 0) {
            currentOrbIndex++;
            renderCurrentContent();
            return;
        }
        
        const currentContent = currentOrb.contents[contentIndex];
        
        if (!currentContent) {
            console.error('Contenuto non trovato');
            return;
        }
        
        let contentHtml = '';

        if (currentContent.type === 'lesson') {
            contentHtml = `
                <p>${currentContent.text}</p>
                <button id="next-content-btn">Ho capito, continua</button>
            `;
        } else if (currentContent.type === 'flashcard') {
            contentHtml = `
                <p><strong>Domanda:</strong> ${currentContent.question}</p>
                <p id="flashcard-answer" style="display:none;"><strong>Risposta:</strong> ${currentContent.answer}</p>
                <button id="show-answer-btn">Mostra risposta</button>
                <button id="next-content-btn" style="display:none;">Continua</button>
            `;
        }
        
        learningView.innerHTML = `
            <div class="card">
                <button class="back-button">← Torna al percorso</button>
                <h2>${tile.title}</h2>
                <h3 style="font-weight: 600; color: #3b82f6;">${currentOrb.title}</h3>
                <div id="learning-content">${contentHtml}</div>
            </div>
        `;

        learningView.querySelector('.back-button').addEventListener('click', () => {
            renderTileOrbs(tileId); // Torna alla view degli orb, non alla pathway
        });
        
        const nextButton = learningView.querySelector('#next-content-btn');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                contentIndex++;
                renderCurrentContent();
            });
        }
        
        const showAnswerButton = learningView.querySelector('#show-answer-btn');
        if (showAnswerButton) {
            showAnswerButton.addEventListener('click', () => {
                learningView.querySelector('#flashcard-answer').style.display = 'block';
                showAnswerButton.style.display = 'none';
                nextButton.style.display = 'inline-block';
            });
        }
    };

    renderCurrentContent();
    showView('learning-view');
}

// --- GESTIONE EVENTI GLOBALI ---

eventBus.on('progressLoaded', (data) => {
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

eventBus.on('showTileOrbs', ({ tileId }) => {
    renderTileOrbs(tileId);
});

eventBus.on('startLearningSession', ({ tileId, orbIndex }) => {
    renderLearningSession(tileId, orbIndex);
});

eventBus.on('progressUpdated', (newProgress) => {
    currentProgress = newProgress;
    if (currentCourse) {
        renderPathway();
    }
});