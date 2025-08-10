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
    const percentage = totalTiles > 0 ? Math.round((completedCount / totalTiles) * 100) : 0;

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
            <div id="tiles-container">${tilesHtml}</div>
        </div>
    `;

    pathwayView.querySelectorAll('.tile').forEach(tileElement => {
        tileElement.addEventListener('click', () => {
            const tileId = tileElement.dataset.tileId;
            eventBus.emit('startLearningSession', { tileId });
        });
    });
    
    showView('pathway-view');
}

function renderLearningSession(tileId) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile || !tile.orbs || tile.orbs.length === 0) {
        // Se il tile non ha orb, lo consideriamo vuoto e lo completiamo subito.
        eventBus.emit('tileCompleted', { tileId });
        renderPathway();
        return;
    }

    // Indici per navigare la struttura gerarchica
    let orbIndex = 0;
    let contentIndex = 0;

    const renderCurrentContent = () => {
        // Se abbiamo finito i contenuti dell'orb corrente, passiamo al prossimo orb
        if (contentIndex >= tile.orbs[orbIndex].contents.length) {
            contentIndex = 0;
            orbIndex++;
        }

        // Se abbiamo finito tutti gli orb, la sessione è finita
        if (orbIndex >= tile.orbs.length) {
            eventBus.emit('tileCompleted', { tileId });
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

        learningView.querySelector('.back-button').addEventListener('click', renderPathway);
        
        const nextButton = learningView.querySelector('#next-content-btn');
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                contentIndex++; // Andiamo al prossimo contenuto
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

// --- GESTIONE EVENTI GLOBALI (INVARIATA) ---

eventBus.on('progressLoaded', (data) => {
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

eventBus.on('startLearningSession', ({ tileId }) => {
    renderLearningSession(tileId);
});

eventBus.on('tileCompleted', ({ tileId }) => {
    if (currentProgress && !currentProgress.completedTiles.has(tileId)) {
        eventBus.emit('updateProgress', { tileId });
    }
});

eventBus.on('progressUpdated', (newProgress) => {
    currentProgress = newProgress;
    // Quando i progressi vengono aggiornati, non facciamo nulla attivamente
    // perché la UI si aggiorna solo quando torniamo al percorso.
});
