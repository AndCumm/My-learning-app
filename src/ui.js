import { eventBus } from './eventBus.js';

const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
const learningView = document.getElementById('learning-view');

let currentCourse = null;
let currentProgress = null;

// Debug mobile: mostra messaggi nella pagina
function showDebugMessage(message) {
    const debugDiv = document.getElementById('debug-messages') || (() => {
        const div = document.createElement('div');
        div.id = 'debug-messages';
        div.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: rgba(0,0,0,0.8); color: white; font-size: 12px; padding: 10px; z-index: 9999; max-height: 150px; overflow-y: auto;';
        document.body.appendChild(div);
        return div;
    })();
    
    debugDiv.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    debugDiv.scrollTop = debugDiv.scrollHeight;
}

function showView(viewId) {
    showDebugMessage(`Switching to view: ${viewId}`);
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
        showDebugMessage(`Successfully switched to view: ${viewId}`);
    } else {
        showDebugMessage(`ERROR: View not found: ${viewId}`);
    }
}

function renderPathway() {
    showDebugMessage('Rendering pathway...');
    
    if (!currentCourse || !currentProgress) {
        showDebugMessage('ERROR: Missing course or progress data');
        return;
    }
    
    const { course, progress } = { course: currentCourse, progress: currentProgress };
    
    const totalTiles = course.pathway.tiles.length;
    const completedCount = progress.completedTiles.size;
    showDebugMessage(`Total tiles: ${totalTiles}, Completed: ${completedCount}`);
    
    // FIX: Assicuriamoci che la percentuale non superi mai il 100%
    const rawPercentage = totalTiles > 0 ? (completedCount / totalTiles) * 100 : 0;
    const percentage = Math.min(100, Math.round(rawPercentage));
    showDebugMessage(`Percentage: ${percentage}%`);

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
                <button id="clear-debug-btn" style="background-color: #666; font-size: 0.875rem; padding: 0.5rem 1rem; margin-left: 0.5rem;">Clear Debug</button>
            </div>
            <div id="tiles-container">${tilesHtml}</div>
        </div>
    `;

    // Add click listeners with error handling
    const tileElements = pathwayView.querySelectorAll('.tile');
    showDebugMessage(`Found ${tileElements.length} tile elements`);
    
    tileElements.forEach((tileElement, index) => {
        const tileId = tileElement.dataset.tileId;
        
        tileElement.addEventListener('click', (e) => {
            showDebugMessage(`Tile clicked: ${tileId}`);
            try {
                eventBus.emit('startLearningSession', { tileId });
                showDebugMessage(`Event emitted for tile: ${tileId}`);
            } catch (error) {
                showDebugMessage(`ERROR emitting event for tile ${tileId}: ${error.message}`);
            }
        });
    });
    
    // Aggiungi listener per i pulsanti
    const resetButton = pathwayView.querySelector('#reset-progress-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Sei sicuro di voler resettare tutto il progresso di questo corso?')) {
                showDebugMessage('Reset progress requested');
                eventBus.emit('resetProgress');
            }
        });
    }
    
    const clearDebugButton = pathwayView.querySelector('#clear-debug-btn');
    if (clearDebugButton) {
        clearDebugButton.addEventListener('click', () => {
            const debugDiv = document.getElementById('debug-messages');
            if (debugDiv) {
                debugDiv.innerHTML = '';
            }
        });
    }
    
    showView('pathway-view');
}

function renderLearningSession(tileId) {
    showDebugMessage(`Starting learning session for tile: ${tileId}`);
    
    if (!currentCourse) {
        showDebugMessage('ERROR: No current course available');
        return;
    }
    
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    
    if (!tile) {
        showDebugMessage(`ERROR: Tile not found: ${tileId}`);
        return;
    }
    
    if (!tile.orbs || tile.orbs.length === 0) {
        showDebugMessage(`Tile ${tileId} has no orbs, completing immediately`);
        eventBus.emit('updateProgress', { tileId });
        renderPathway();
        return;
    }

    showDebugMessage(`Tile has ${tile.orbs.length} orbs`);

    // Indici per navigare la struttura gerarchica
    let orbIndex = 0;
    let contentIndex = 0;

    const renderCurrentContent = () => {
        showDebugMessage(`Rendering content: orb ${orbIndex}, content ${contentIndex}`);
        
        // Se abbiamo finito i contenuti dell'orb corrente, passiamo al prossimo orb
        if (contentIndex >= tile.orbs[orbIndex].contents.length) {
            contentIndex = 0;
            orbIndex++;
        }

        // Se abbiamo finito tutti gli orb, la sessione è finita
        if (orbIndex >= tile.orbs.length) {
            showDebugMessage(`All orbs completed for tile: ${tileId}`);
            eventBus.emit('updateProgress', { tileId });
            renderPathway();
            return;
        }

        const currentOrb = tile.orbs[orbIndex];
        const currentContent = currentOrb.contents[contentIndex];
        
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
            showDebugMessage('Back button clicked');
            renderPathway();
        });
        
        const nextButton = learningView.querySelector('#next-content-btn');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                showDebugMessage('Next button clicked');
                contentIndex++;
                renderCurrentContent();
            });
        }
        
        const showAnswerButton = learningView.querySelector('#show-answer-btn');
        if (showAnswerButton) {
            showAnswerButton.addEventListener('click', () => {
                showDebugMessage('Show answer button clicked');
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
    showDebugMessage('Progress loaded event received');
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

eventBus.on('startLearningSession', ({ tileId }) => {
    showDebugMessage(`Start learning session event received for: ${tileId}`);
    renderLearningSession(tileId);
});

eventBus.on('progressUpdated', (newProgress) => {
    showDebugMessage('Progress updated event received');
    currentProgress = newProgress;
    if (currentCourse) {
        renderPathway();
    }
});
