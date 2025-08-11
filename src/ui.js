import { eventBus } from './eventBus.js';

const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
const learningView = document.getElementById('learning-view');

let currentCourse = null;
let currentProgress = null;
let openTiles = new Set();

export function renderCourseList(courses) {
    const container = document.getElementById('saved-courses-view');
    // Nascondiamo la vecchia sezione per caricare i file, non più necessaria
    const fileInputCard = document.getElementById('file-input-card');
    if (fileInputCard) {
        fileInputCard.style.display = 'none';
    }

    const courseButtonsHtml = courses.map(course => `
        <button class="saved-course-btn" data-course-file="${course.file}">
        <strong>${course.title}</strong>
        <br>
        <small>${course.description}</small>
        </button>
    `).join('');

    container.innerHTML = `
        <div class="saved-course-card">
        <h3>I Miei Corsi</h3>
        <p>Seleziona un corso per iniziare.</p>
        <div class="course-list">
            ${courseButtonsHtml}
        </div>
        </div>
    `;

    container.querySelectorAll('.saved-course-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseFile = button.dataset.courseFile;
            eventBus.emit('loadCourse', courseFile);
        });
    });
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function renderPathway() {
    const { course, progress } = { course: currentCourse, progress: currentProgress };

    const totalOrbs = course.pathway.tiles.reduce((sum, tile) => sum + tile.orbs.length, 0);
    const completedOrbsCount = progress.completedOrbs.size;
    const percentage = totalOrbs > 0 ? Math.round((completedOrbsCount / totalOrbs) * 100) : 0;
    
    // --- NUOVA LOGICA: INIZIO ---
    // 1. Creiamo una lista "piatta" di tutti gli orb per gestire la progressione sequenziale.
    //    Ogni elemento della lista saprà il suo indice globale, il suo tile e il suo indice originale.
    let globalIndex = 0;
    const flatOrbList = [];
    course.pathway.tiles.forEach(tile => {
        tile.orbs.forEach((orb, orbIndex) => {
            flatOrbList.push({
                ...orb,
                globalIndex: globalIndex++,
                tileId: tile.id,
                originalOrbIndex: orbIndex
            });
        });
    });
    // --- NUOVA LOGICA: FINE ---

    let tilesHtml = course.pathway.tiles.map(tile => {
        // La logica per determinare se un TILE è completo rimane utile per la UI (mostrare il badge ✅)
        const orbsInTile = tile.orbs.length;
        const completedOrbsInTile = tile.orbs.filter((orb, i) => progress.completedOrbs.has(`${tile.id}-orb-${i}`)).length;
        const isTileCompleted = orbsInTile > 0 && completedOrbsInTile === orbsInTile;

        const isOpen = openTiles.has(tile.id);
        
        // Prendiamo solo gli orb che appartengono a questo tile dalla nostra lista piatta
        const orbsForThisTile = flatOrbList.filter(orb => orb.tileId === tile.id);

        const orbsHtml = orbsForThisTile.map(orb => {
            const isOrbCompleted = progress.completedOrbs.has(`${orb.tileId}-orb-${orb.originalOrbIndex}`);
            
            // --- NUOVA LOGICA DI BLOCCO ---
            // 2. Un orb è bloccato se il suo indice globale è maggiore di 0 E l'orb precedente non è completo.
            let isOrbLocked = false;
            if (orb.globalIndex > 0) {
                const prevOrb = flatOrbList[orb.globalIndex - 1];
                const prevOrbId = `${prevOrb.tileId}-orb-${prevOrb.originalOrbIndex}`;
                if (!progress.completedOrbs.has(prevOrbId)) {
                    isOrbLocked = true;
                }
            }
            // --- NUOVA LOGICA DI BLOCCO: FINE ---

            const lessonCount = orb.contents.filter(c => c.type === 'lesson').length;
            const flashcardCount = orb.contents.filter(c => c.type === 'flashcard').length;
            
            return `
                <div class="orb-item ${isOrbLocked ? 'locked' : ''}" data-tile-id="${orb.tileId}" data-orb-index="${orb.originalOrbIndex}">
                    <div class="orb-content">
                        <div class="orb-title">${orb.title}</div>
                        <div class="orb-indicators">
                            ${lessonCount > 0 ? `<span class="content-badge lesson">📖 ${lessonCount}</span>` : ''}
                            ${flashcardCount > 0 ? `<span class="content-badge flashcard">🃏 ${flashcardCount}</span>` : ''}
                        </div>
                    </div>
                    <div class="orb-arrow">${isOrbLocked ? '🔒' : (isOrbCompleted ? '✅' : '▶')}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="tile-container ${isTileCompleted ? 'completed' : ''}" data-tile-id="${tile.id}">
                <div class="tile-header ${isOpen ? 'open' : ''}">
                    <div class="tile-info">
                        <div class="tile-title">${tile.title}</div>
                        <div class="tile-meta">
                            <span class="orb-count">${tile.orbs.length} moduli</span>
                            ${isTileCompleted ? '<span class="completion-badge">✅ Completato</span>' : ''}
                        </div>
                    </div>
                    <div class="tile-chevron ${isOpen ? 'rotated' : ''}">▼</div>
                </div>
                <div class="orbs-dropdown ${isOpen ? 'open' : ''}">
                    <div class="orbs-content">
                        ${orbsHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    pathwayView.innerHTML = `
        <div class="pathway-card">
            <div class="course-header">
                <h2 class="course-title">${course.title}</h2>
                <div class="course-stats">
                    <div class="progress-section">
                        <div class="progress-text">Completamento: <span class="progress-value">${percentage}%</span></div>
                        <div class="progress-bar-container">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button id="back-to-loader-btn" class="secondary-btn">
                            <span class="btn-icon">↩️</span>
                            <span class="btn-text">Cambia Corso</span>
                        </button>
                        <button id="reset-progress-btn" class="reset-btn">
                            <span class="btn-icon">🗑️</span>
                            <span class="btn-text">Reset Progresso</span>
                        </button>
                    </div>
                </div>
            </div>
            <div class="tiles-container">
                ${tilesHtml}
            </div>
        </div>
    `;

    pathwayView.querySelectorAll('.tile-header').forEach(tileHeader => {
        const tileId = tileHeader.closest('.tile-container').dataset.tileId;
        tileHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTileDropdown(tileId);
        });
    });

    pathwayView.querySelectorAll('.orb-item').forEach(orbElement => {
        if (orbElement.classList.contains('locked')) {
            return;
        }
        orbElement.addEventListener('click', (e) => {
            e.stopPropagation();
            const tileId = orbElement.dataset.tileId;
            const orbIndex = parseInt(orbElement.dataset.orbIndex);
            eventBus.emit('startLearningSession', { tileId, orbIndex });
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

    const backButton = pathwayView.querySelector('#back-to-loader-btn');
    if (backButton) {
        backButton.addEventListener('click', () => {
            showView('loader-view');
        });
    }

    showView('pathway-view');
}

// Le funzioni che seguono rimangono identiche alla versione precedente
function toggleTileDropdown(tileId) {
    if (openTiles.has(tileId)) {
        openTiles.delete(tileId);
    } else {
        openTiles.add(tileId);
    }
    updateTileDropdowns();
}

function updateTileDropdowns() {
    const containers = pathwayView.querySelectorAll('.tile-container');
    containers.forEach(container => {
        const tileId = container.dataset.tileId;
        const isOpen = openTiles.has(tileId);
        const header = container.querySelector('.tile-header');
        const dropdown = container.querySelector('.orbs-dropdown');
        const chevron = container.querySelector('.tile-chevron');

        if (isOpen) {
            header.classList.add('open');
            dropdown.classList.add('open');
            chevron.classList.add('rotated');
        } else {
            header.classList.remove('open');
            dropdown.classList.remove('open');
            chevron.classList.remove('rotated');
        }
    });
}

function renderLearningSession(tileId, orbIndex) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) {
        console.error(`Tile ${tileId} non trovato`);
        return;
    }
    
    const initialOrb = tile.orbs[orbIndex];
    if (!initialOrb || !initialOrb.contents || initialOrb.contents.length === 0) {
        eventBus.emit('orbCompleted', { tileId, orbIndex });
        renderPathway();
        return;
    }
    const sessionQueue = structuredClone(initialOrb.contents);

    const renderCurrentContent = () => {
        if (sessionQueue.length === 0) {
            eventBus.emit('orbCompleted', { tileId, orbIndex });
            renderPathway();
            return;
        }

        const currentContent = sessionQueue.shift(); 
        
        let contentHtml = '';

        if (currentContent.type === 'lesson') {
            contentHtml = `
                <div class="content-lesson">
                    <div class="lesson-icon">📖</div>
                    <div class="lesson-content">
                        <p class="lesson-text">${currentContent.text}</p>
                        <div class="flashcard-actions">
                            <button id="next-lesson-btn" class="next-btn">
                                <span>Ho capito, continua</span>
                                <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentContent.type === 'flashcard') {
            contentHtml = `
                <div class="content-flashcard">
                    <div class="flashcard-icon">🃏</div>
                    <div class="flashcard-content">
                        <div class="flashcard-question">
                            <strong>Domanda:</strong> ${currentContent.question}
                        </div>
                        <div id="flashcard-answer" class="flashcard-answer hidden">
                            <strong>Risposta:</strong> ${currentContent.answer}
                        </div>
                        <div class="flashcard-actions">
                            <button id="show-answer-btn" class="show-answer-btn">
                                <span>Mostra risposta</span>
                            </button>
                            <button id="wrong-btn" class="wrong-btn hidden">❌ Sbagliato</button>
                            <button id="correct-btn" class="correct-btn hidden">✅ Giusto</button>
                        </div>
                    </div>
                </div>
            `;
        }

        learningView.innerHTML = `
            <div class="learning-card">
                <div class="learning-header">
                    <button class="back-button">
                        <span class="back-arrow">←</span>
                        <span>Torna al percorso</span>
                    </button>
                    <div class="learning-breadcrumb">
                        <span class="breadcrumb-tile">${tile.title}</span>
                        <span class="breadcrumb-separator">•</span>
                        <span class="breadcrumb-orb">${initialOrb.title}</span>
                    </div>
                </div>
                <div class="learning-content">
                    ${contentHtml}
                </div>
                <div class="learning-progress">
                    <div class="progress-indicator">
                        Elementi rimasti in questa sessione: ${sessionQueue.length + 1}
                    </div>
                </div>
            </div>
        `;

        learningView.querySelector('.back-button').addEventListener('click', renderPathway);
        
        const nextLessonBtn = learningView.querySelector('#next-lesson-btn');
        if (nextLessonBtn) {
            nextLessonBtn.addEventListener('click', renderCurrentContent);
        }
        
        const showAnswerButton = learningView.querySelector('#show-answer-btn');
        if (showAnswerButton) {
            const answerDiv = learningView.querySelector('#flashcard-answer');
            const correctBtn = learningView.querySelector('#correct-btn');
            const wrongBtn = learningView.querySelector('#wrong-btn');

            showAnswerButton.addEventListener('click', () => {
                answerDiv.classList.remove('hidden');
                showAnswerButton.classList.add('hidden');
                correctBtn.classList.remove('hidden');
                wrongBtn.classList.remove('hidden');
            });
            
            correctBtn.addEventListener('click', renderCurrentContent);

            wrongBtn.addEventListener('click', () => {
                sessionQueue.push(currentContent);
                renderCurrentContent();
            });
        }
    };

    renderCurrentContent();
    showView('learning-view');
}

eventBus.on('progressLoaded', (data) => {
    currentCourse = data.course;
    currentProgress = data.progress;
    renderPathway();
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
