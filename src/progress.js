import { eventBus } from './eventBus.js';
import { loadProgress, saveProgress, createEmptyProgress } from './progress-core.js';

let currentCourseTitle = '';
let currentProgress = null;

// All'evento 'courseLoaded', carica o crea il progresso
eventBus.on('courseLoaded', course => {
  currentCourseTitle = course.title;
  const saved = loadProgress(course.title);
  currentProgress = Object.keys(saved).length ? saved : createEmptyProgress();
  eventBus.emit('progressLoaded', { course, progress: currentProgress });
});

// All'evento 'updateProgress', aggiorna lo stato e salva
eventBus.on('updateProgress', ({ tileId }) => {
  if (currentProgress) {
    // FIX: Controlliamo se il tile è già completato prima di procedere
    const wasAlreadyCompleted = currentProgress.completedTiles.has(tileId);
    
    if (!wasAlreadyCompleted) {
      currentProgress.completedTiles.add(tileId);
      saveProgress(currentCourseTitle, currentProgress);
      console.log(`Tile completato: ${tileId}. Totale completati: ${currentProgress.completedTiles.size}`);
      eventBus.emit('progressUpdated', currentProgress);
    } else {
      console.log(`Tile ${tileId} già completato, salto l'aggiornamento.`);
    }
  }
});

// Nuovo: Gestione del reset del progresso
eventBus.on('resetProgress', () => {
  if (currentCourseTitle) {
    // Rimuovi dal localStorage
    const key = `progress_${currentCourseTitle}`;
    localStorage.removeItem(key);
    
    // Reset dello stato in memoria
    currentProgress = createEmptyProgress();
    
    console.log(`Progresso resettato per: ${currentCourseTitle}`);
    eventBus.emit('progressUpdated', currentProgress);
  }
});
