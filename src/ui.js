import { eventBus } from './eventBus.js';

// Riferimenti alle schermate principali
const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
const learningView = document.getElementById('learning-view');

let currentCourse = null;
let currentProgress = null;

// Funzione per cambiare la vista attiva
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

// --- RENDERING DEL PERCORSO ---
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
            // NUOVO EVENTO: iniziamo la sessione invece di completarla
            eventBus.emit('startLearningSession', { tileId });
        });
    });
    
    showView('pathway-view');
}

// --- RENDERING DELLA SESSIONE DI APPRENDIMENTO ---
function renderLearningSession(tileId) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) return;

    let contentIndex = 0;

    const renderCurrentContent = () => {
        if (contentIndex >= tile.contents.length) {
            // Sessione finita, ora emettiamo l'evento di completamento!
            eventBus.emit('tileCompleted', { tileId });
            renderPathway(); // Torna al percorso
            return;
        }

        const content = tile.contents[contentIndex];
        let contentHtml = '';

        if (content.type === 'lesson') {
            contentHtml = `
                <h3>${content.title || 'Lezione'}</h3>
                <p>${content.text}</p>
                <button id="next-content-btn">Ho capito, continua</button>
            `;
        } else if (content.type === 'flashcard') {
            contentHtml = `
                <h3>Flashcard</h3>
                <p><strong>Domanda:</strong> ${content.question}</p>
                <p style="display:none;"><strong>Risposta:</strong> ${content.answer}</p>
                <button id="show-answer-btn">Mostra risposta</button>
                <button id="next-content-btn" style="display:none;">Continua</button>
            `;
        }
        
        learningView.innerHTML = `
            <div class="card">
                <button class="back-button">← Torna al percorso</button>
                <h2>${tile.title}</h2>
                <div id="learning-content">${contentHtml}</div>
            </div>
        `;

        // Aggiungi event listener ai nuovi elementi
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
                learningView.querySelector('p[style*="display:none"]').style.display = 'block';
                showAnswerButton.style.display = 'none';
                nextButton.style.display = 'inline-block';
            });
        }
    };

    renderCurrentContent();
    showView('learning-view');
}


// --- GESTIONE EVENTI GLOBALI ---

// 1. Il corso è stato caricato e i progressi sono pronti
eventBus.on('progressLoaded', (data) => {
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

// 2. L'utente ha cliccato su un tile, apriamo la lezione
eventBus.on('startLearningSession', ({ tileId }) => {
    renderLearningSession(tileId);
});

// 3. La lezione è finita, aggiorniamo lo stato
eventBus.on('tileCompleted', ({ tileId }) => {
    if (currentProgress && !currentProgress.completedTiles.has(tileId)) {
        // Usiamo lo stesso evento di prima per aggiornare i progressi
        // Ma questa volta viene chiamato solo alla fine di una lezione
        eventBus.emit('updateProgress', { tileId });
    }
});

// 4. Lo stato è stato aggiornato nel core, rinfreschiamo la UI del percorso
eventBus.on('progressUpdated', (newProgress) => {
    currentProgress = newProgress;
    // Non facciamo nulla qui, perché torniamo al percorso che si ri-renderizza da solo
});
