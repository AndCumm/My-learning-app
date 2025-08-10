import { eventBus } from './eventBus.js';

const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
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

    // FIX: Colleghiamo correttamente i click ai tile
    pathwayView.querySelectorAll('.tile').forEach(tileElement => {
        const tileId = tileElement.dataset.tileId;
        tileElement.addEventListener('click', () => {
            alert(`Cliccato tile: ${tileId} - Emetto evento...`);
            eventBus.emit('startLearningSession', { tileId });
        });
    });
    
    const resetButton = pathwayView.querySelector('#reset-progress-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Reset progresso?')) {
                eventBus.emit('resetProgress');
            }
        });
    }
    
    showView('pathway-view');
}

function renderLearningSession(tileId) {
    alert(`Avvio sessione per tile: ${tileId}`);
    
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) {
        alert(`Errore: tile ${tileId} non trovato!`);
        return;
    }
    
    if (!tile.orbs || tile.orbs.length === 0) {
        alert(`Tile ${tileId} vuoto, lo completo subito`);
        eventBus.emit('updateProgress', { tileId });
        renderPathway();
        return;
    }

    alert(`Tile ha ${tile.orbs.length} orbs, avvio contenuti...`);

    // Indici per navigare la struttura gerarchica
    let orbIndex = 0;
    let contentIndex = 0;

    const renderCurrentContent = () => {
        alert(`DEBUG: orbIndex=${orbIndex}, contentIndex=${contentIndex}`);
        
        // Se abbiamo finito i contenuti dell'orb corrente, passiamo al prossimo orb
        if (contentIndex >= tile.orbs[orbIndex].contents.length) {
            alert(`DEBUG: Finiti contenuti orb ${orbIndex}, passo al prossimo`);
            contentIndex = 0;
            orbIndex++;
        }

        // Se abbiamo finito tutti gli orb, la sessione è finita
        if (orbIndex >= tile.orbs.length) {
            alert(`Completato tile: ${tileId}`);
            eventBus.emit('updateProgress', { tileId });
            renderPathway();
            return;
        }

        const currentOrb = tile.orbs[orbIndex];
        alert(`DEBUG: currentOrb = ${JSON.stringify(currentOrb)}`);
        
        if (!currentOrb.contents || currentOrb.contents.length === 0) {
            alert(`DEBUG: Orb ${orbIndex} non ha contenuti!`);
            orbIndex++; // Salta questo orb vuoto
            renderCurrentContent(); // Riprova con il prossimo
            return;
        }
        
        const currentContent = currentOrb.contents[contentIndex];
        alert(`DEBUG: currentContent = ${JSON.stringify(currentContent)}`);
        
        if (!currentContent) {
            alert(`DEBUG: ERRORE - currentContent è undefined!`);
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

        learningView.querySelector('.back-button').addEventListener('click', renderPathway);
        
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

// --- GESTIONE EVENTI GLOBALI - FIX: Aggiunti tutti i listener necessari ---

eventBus.on('progressLoaded', (data) => {
    alert('Progress loaded ricevuto!');
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

eventBus.on('startLearningSession', ({ tileId }) => {
    alert(`Evento startLearningSession ricevuto per: ${tileId}`);
    renderLearningSession(tileId);
});

eventBus.on('progressUpdated', (newProgress) => {
    alert('Progress updated ricevuto!');
    currentProgress = newProgress;
    if (currentCourse) {
        renderPathway();
    }
});
