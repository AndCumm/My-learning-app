import { eventBus } from './eventBus.js';
import { loadProgress, saveProgress, createEmptyProgress } from './progress-core.js';

let currentCourseTitle = '';
let currentProgress = null;

eventBus.on('courseLoaded', course => {
  currentCourseTitle = course.title;
  const saved = loadProgress(course.title);
  currentProgress = Object.keys(saved).length ? saved : createEmptyProgress();
  eventBus.emit('progressLoaded', { course, progress: currentProgress });
});

// MODIFICA: Ascoltiamo 'orbCompleted' invece di 'updateProgress'
eventBus.on('orbCompleted', ({ tileId, orbIndex }) => {
  if (currentProgress) {
    const orbId = `${tileId}-orb-${orbIndex}`; // Creiamo un ID unico per l'orb
    const wasAlreadyCompleted = currentProgress.completedOrbs.has(orbId);

    if (!wasAlreadyCompleted) {
      currentProgress.completedOrbs.add(orbId);
      saveProgress(currentCourseTitle, currentProgress);
      console.log(`Orb completato: ${orbId}. Totale completati: ${currentProgress.completedOrbs.size}`);
      // Emettiamo un evento generico di aggiornamento
      eventBus.emit('progressUpdated', currentProgress);
    }
  }
});

eventBus.on('resetProgress', () => {
  if (currentCourseTitle) {
    const key = `progress_${currentCourseTitle}`;
    localStorage.removeItem(key);
    currentProgress = createEmptyProgress();
    console.log(`Progresso resettato per: ${currentCourseTitle}`);
    eventBus.emit('progressUpdated', currentProgress);
  }
});
