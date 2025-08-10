import { eventBus } from './eventBus.js';
import { loadProgress, saveProgress, createEmptyProgress } from './progress-core.js';

// All'evento 'courseLoaded', carica o crea il progresso
eventBus.on('courseLoaded', course => {
  const saved = loadProgress(course.title);
  const progress = Object.keys(saved).length ? saved : createEmptyProgress();
  eventBus.emit('progressLoaded', { course, progress });
});

// All'evento 'tileCompleted', aggiorna lo stato e salva
eventBus.on('tileCompleted', ({ course, progress, tileId }) => {
  progress.completedTiles.add(tileId);
  saveProgress(course.title, progress);
  eventBus.emit('progressUpdated', { course, progress });
});
