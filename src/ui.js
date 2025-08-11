import { eventBus } from './eventBus.js';

const loaderView = document.getElementById('loader-view');
const pathwayView = document.getElementById('pathway-view');
const learningView = document.getElementById('learning-view');

let currentCourse = null;
let currentProgress = null;
let openTiles = new Set(); // Tiene traccia di quali tile sono aperti

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
        const isOpen = openTiles.has(tile.id);

        // Genera gli orb per questo tile se è aperto
        let orbsHtml = '';
        if (isOpen) {
            orbsHtml = tile.orbs.map((orb, orbIndex) => {
                const lessonCount = orb.contents.filter(c => c.type === 'lesson').length;
                const flashcardCount = orb.contents.filter(c => c.type === 'flashcard').length;
                const totalContent = orb.contents.length;

                let contentIndicators = '';
                if (lessonCount > 0) {
                    contentIndicators += `<span class="content-badge lesson">📖 ${lessonCount}</span>`;
                }
                if (flashcardCount > 0) {
                    contentIndicators += `<span class="content-badge flashcard">🃏 ${flashcardCount}</span>`;
                }

                return `
                    <div class="orb-item" data-tile-id="${tile.id}" data-orb-index="${orbIndex}">
                        <div class="orb-content">
                            <div class="orb-title">${orb.title}</div>
                            <div class="orb-indicators">
                                ${contentIndicators}
                                <span class="total-badge">${totalContent} elementi</span>
                            </div>
                        </div>
                        <div class="orb-arrow">▶</div>
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="tile-container ${isCompleted ? 'completed' : ''}" data-tile-id="${tile.id}">
                <div class="tile-header ${isOpen ? 'open' : ''}">
                    <div class="tile-info">
                        <div class="tile-title">${tile.title}</div>
                        <div class="tile-meta">
                            <span class="orb-count">${tile.orbs.length} moduli</span>
                            ${isCompleted ? '<span class="completion-badge">✅ Completato</span>' : ''}
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
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="action-buttons">
                            {/* NUOVO PULSANTE "CAMBIA CORSO" */}
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

    // Event listeners per i tile headers (toggle dropdown)
    pathwayView.querySelectorAll('.tile-header').forEach(tileHeader => {
        const container = tileHeader.closest('.tile-container');
        const tileId = container.dataset.tileId;

        tileHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTileDropdown(tileId);
        });
    });

    // Event listeners per gli orb
    pathwayView.querySelectorAll('.orb-item').forEach(orbElement => {
        const tileId = orbElement.dataset.tileId;
        const orbIndex = parseInt(orbElement.dataset.orbIndex);

        orbElement.addEventListener('click', (e) => {
            e.stopPropagation();
            eventBus.emit('startLearningSession', { tileId, orbIndex });
        });
    });

    // Event listener per il reset
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

function toggleTileDropdown(tileId) {
    if (openTiles.has(tileId)) {
        openTiles.delete(tileId);
    } else {
        openTiles.add(tileId);
    }

    // Aggiungi questo pezzo per lo scroll automatico
    const container = pathwayView.querySelector(`.tile-container[data-tile-id="${tileId}"]`);
    if (container) {
        // Un piccolo timeout per dare tempo al CSS di iniziare l'animazione
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
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

        // Update classes for animation
        if (isOpen) {
            header.classList.add('open');
            dropdown.classList.add('open');
            chevron.classList.add('rotated');
        } else {
            header.classList.remove('open');
            dropdown.classList.remove('open');
            chevron.classList.remove('rotated');
        }

        // Populate orbs content if opening
        if (isOpen && !dropdown.querySelector('.orb-item')) {
            const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
            const orbsHtml = tile.orbs.map((orb, orbIndex) => {
                const lessonCount = orb.contents.filter(c => c.type === 'lesson').length;
                const flashcardCount = orb.contents.filter(c => c.type === 'flashcard').length;
                const totalContent = orb.contents.length;

                let contentIndicators = '';
                if (lessonCount > 0) {
                    contentIndicators += `<span class="content-badge lesson">📖 ${lessonCount}</span>`;
                }
                if (flashcardCount > 0) {
                    contentIndicators += `<span class="content-badge flashcard">🃏 ${flashcardCount}</span>`;
                }

                return `
                    <div class="orb-item" data-tile-id="${tile.id}" data-orb-index="${orbIndex}">
                        <div class="orb-content">
                            <div class="orb-title">${orb.title}</div>
                            <div class="orb-indicators">
                                ${contentIndicators}
                                <span class="total-badge">${totalContent} elementi</span>
                            </div>
                        </div>
                        <div class="orb-arrow">▶</div>
                    </div>
                `;
            }).join('');

            dropdown.querySelector('.orbs-content').innerHTML = orbsHtml;

            // Add event listeners to new orb items
            dropdown.querySelectorAll('.orb-item').forEach(orbElement => {
                const tileId = orbElement.dataset.tileId;
                const orbIndex = parseInt(orbElement.dataset.orbIndex);

                orbElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    eventBus.emit('startLearningSession', { tileId, orbIndex });
                });
            });
        }
    });
}

function renderLearningSession(tileId, orbIndex = 0) {
    const tile = currentCourse.pathway.tiles.find(t => t.id === tileId);
    if (!tile) {
        console.error(`Tile ${tileId} non trovato`);
        return;
    }

    if (!tile.orbs || tile.orbs.length === 0) {
        eventBus.emit('updateProgress', { tileId });
        renderPathway();
        return;
    }

    let currentOrbIndex = orbIndex;
    let contentIndex = 0;

    const renderCurrentContent = () => {
        if (contentIndex >= tile.orbs[currentOrbIndex].contents.length) {
            contentIndex = 0;
            currentOrbIndex++;
        }

        if (currentOrbIndex >= tile.orbs.length) {
            eventBus.emit('updateProgress', { tileId });
            renderPathway();
            return;
        }

        const currentOrb = tile.orbs[currentOrbIndex];

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
                <div class="content-lesson">
                    <div class="lesson-icon">📖</div>
                    <div class="lesson-content">
                        <p class="lesson-text">${currentContent.text}</p>
                        <button id="next-content-btn" class="next-btn">
                            <span>Ho capito, continua</span>
                            <span class="btn-arrow">→</span>
                        </button>
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
                                <span class="btn-icon">👁️</span>
                            </button>
                            <button id="next-content-btn" class="next-btn hidden">
                                <span>Continua</span>
                                <span class="btn-arrow">→</span>
                            </button>
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
                        <span class="breadcrumb-orb">${currentOrb.title}</span>
                    </div>
                </div>
                <div class="learning-content">
                    ${contentHtml}
                </div>
                <div class="learning-progress">
                    <div class="progress-indicator">
                        ${contentIndex + 1} di ${currentOrb.contents.length} in questo modulo
                    </div>
                </div>
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
                const answerDiv = learningView.querySelector('#flashcard-answer');
                const nextBtn = learningView.querySelector('#next-content-btn');

                answerDiv.classList.remove('hidden');
                showAnswerButton.classList.add('hidden');
                nextBtn.classList.remove('hidden');
            });
        }
    };

    renderCurrentContent();
    showView('learning-view');
}

// --- NUOVA FUNZIONE ESPORTATA ---
export function renderSavedCourse(savedCourse) {
    const container = document.getElementById('saved-courses-view');
    if (!container) return;

    if (savedCourse && savedCourse.title && savedCourse.xml) {
        container.innerHTML = `
            <div class="saved-course-card">
                <h3>Corso Recente</h3>
                <p>Riprendi da dove hai lasciato.</p>
                <button id="load-saved-course-btn" class="saved-course-btn">
                    <span class="course-title">▶ ${savedCourse.title}</span>
                </button>
            </div>
            <hr class="divider">
        `;

        // Aggiungiamo l'evento al pulsante per caricare il corso
        document.getElementById('load-saved-course-btn').addEventListener('click', () => {
            // Emettiamo un evento con il contenuto XML del corso salvato
            eventBus.emit('loadSavedCourse', savedCourse.xml);
        });

    } else {
        // Se non ci sono corsi salvati, non mostriamo nulla
        container.innerHTML = '';
    }
}


// --- GESTIONE EVENTI GLOBALI ---

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
