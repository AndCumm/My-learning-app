import { eventBus } from '../eventBus.js';
import { learningView, showView } from './ui-common.js';
import { renderPathway } from './ui-pathway.js'; // Importiamo renderPathway per il tasto back

export function renderLearningSession(course, progress, tileId, orbIndex) {
    const tile = course.pathway.tiles.find(t => t.id === tileId);
    if (!tile) return;
    
    const initialOrb = tile.orbs[orbIndex];
    if (!initialOrb || !initialOrb.contents || initialOrb.contents.length === 0) {
        eventBus.emit('orbCompleted', { tileId, orbIndex });
        return;
    }
    const sessionQueue = structuredClone(initialOrb.contents);

    const renderCurrentContent = () => {
        if (sessionQueue.length === 0) {
            eventBus.emit('orbCompleted', { tileId, orbIndex });
            return;
        }
        const currentContent = sessionQueue.shift(); 
        
        let contentHtml = '';
        if (currentContent.type === 'lesson') {
            // --- CORREZIONE QUI ---
            // Ho inserito il codice HTML corretto per visualizzare la lezione.
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
                </div>`;
        } else if (currentContent.type === 'flashcard') {
            contentHtml = `
                <div class="content-flashcard">
                    <div class="flashcard-icon">🃏</div>
                    <div class="flashcard-content">
                        <div class="flashcard-question"><strong>Domanda:</strong> ${currentContent.question}</div>
                        <div id="flashcard-answer" class="flashcard-answer hidden"><strong>Risposta:</strong> ${currentContent.answer}</div>
                        <div class="flashcard-actions">
                            <button id="show-answer-btn" class="show-answer-btn">Mostra risposta</button>
                            <button id="wrong-btn" class="wrong-btn hidden">❌ Sbagliato</button>
                            <button id="correct-btn" class="correct-btn hidden">✅ Giusto</button>
                        </div>
                    </div>
                </div>`;
        }

        learningView.innerHTML = `
            <div class="learning-card">
                <div class="learning-header">
                    <button class="back-button">← Torna al percorso</button>
                    <div class="learning-breadcrumb">
                        <span class="breadcrumb-tile">${tile.title}</span> <span class="breadcrumb-separator">•</span> <span class="breadcrumb-orb">${initialOrb.title}</span>
                    </div>
                </div>
                <div class="learning-content">${contentHtml}</div>
                <div class="learning-progress">
                    <div class="progress-indicator">Elementi rimasti in questa sessione: ${sessionQueue.length + 1}</div>
                </div>
            </div>`;
        
        // Ho spostato qui la logica del tasto back-button per renderla più chiara
        learningView.querySelector('.back-button').addEventListener('click', () => renderPathway(course, progress));
        
        const nextLessonBtn = learningView.querySelector('#next-lesson-btn');
        if (nextLessonBtn) {
            nextLessonBtn.addEventListener('click', renderCurrentContent);
        }

        const showAnswerBtn = learningView.querySelector('#show-answer-btn');
        if (showAnswerBtn) {
            const answerDiv = learningView.querySelector('#flashcard-answer');
            const correctBtn = learningView.querySelector('#correct-btn');
            const wrongBtn = learningView.querySelector('#wrong-btn');
            showAnswerBtn.addEventListener('click', () => {
                answerDiv.classList.remove('hidden');
                showAnswerBtn.classList.add('hidden');
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
    showView(learningView);
}
