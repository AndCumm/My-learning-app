// TEST DI BASE - questo dovrebbe mostrare un alert
alert('UI.js caricato!');

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
                <button onclick="alert('Click funziona!')" style="background-color: #059669; font-size: 0.875rem; padding: 0.5rem 1rem; margin-left: 0.5rem;">Test Click</button>
            </div>
            <div id="tiles-container">${tilesHtml}</div>
        </div>
    `;

    // Test diretto senza event listeners complessi
    pathwayView.querySelectorAll('.tile').forEach(tileElement => {
        const tileId = tileElement.dataset.tileId;
        tileElement.addEventListener('click', () => {
            alert(`Cliccato tile: ${tileId}`);
            // Per ora solo un alert per vedere se il click funziona
        });
    });
    
    const resetButton = pathwayView.querySelector('#reset-progress-btn');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('Reset progresso?')) {
                alert('Reset richiesto');
                eventBus.emit('resetProgress');
            }
        });
    }
    
    showView('pathway-view');
}

function renderLearningSession(tileId) {
    alert(`Dovrei aprire learning session per: ${tileId}`);
    // Per ora torniamo subito alla pathway
    renderPathway();
}

// --- GESTIONE EVENTI GLOBALI ---
eventBus.on('progressLoaded', (data) => {
    alert('Progress loaded ricevuto!');
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
});

eventBus.on('startLearningSession', ({ tileId }) => {
    alert(`Start learning session ricevuto per: ${tileId}`);
    renderLearningSession(tileId);
});

eventBus.on('progressUpdated', (newProgress) => {
    alert('Progress updated ricevuto!');
    currentProgress = newProgress;
    if (currentCourse) {
        renderPathway();
    }
});
