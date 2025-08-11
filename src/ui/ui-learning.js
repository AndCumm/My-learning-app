import { eventBus } from '../eventBus.js';
import { learningView, showView, pathwayView } from './ui-common.js';

export function renderLearningSession(course, tileId, orbIndex) {
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
            contentHtml = `<div class="content-lesson">...</div>`; // Codice HTML della lezione qui
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
                <div class="learning-progress">Elementi rimasti: ${sessionQueue.length + 1}</div>
            </div>`;

        learningView.querySelector('.back-button').addEventListener('click', () => showView(pathwayView));
        
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
