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
// NOTA: l'evento è stato rinominato da 'tileCompleted' a 'updateProgress'
eventBus.on('updateProgress', ({ tileId }) => {
  if (currentProgress) {
    currentProgress.completedTiles.add(tileId);
    saveProgress(currentCourseTitle, currentProgress);
    eventBus.emit('progressUpdated', currentProgress);
  }
});
