import { eventBus } from './eventBus.js';
import { loadProgress, saveProgress, createEmptyProgress } from './progress-core.js';

let currentCourseTitle = '';
let currentProgress = null;

eventBus.on('courseLoaded', course => {
  currentCourseTitle = course.title;
  const saved = loadProgress(course.title);

  // --- MODIFICA CHIAVE: INIZIO ---
  // Invece di controllare solo se 'saved' esiste, controlliamo
  // che abbia la struttura dati corretta (la proprietà 'completedOrbs').
  // Se non ce l'ha, lo consideriamo come un salvataggio non valido e ne creiamo uno nuovo.
  if (saved && saved.completedOrbs) {
    currentProgress = saved;
  } else {
    currentProgress = createEmptyProgress();
  }
  // --- MODIFICA CHIAVE: FINE ---

  eventBus.emit('progressLoaded', { course, progress: currentProgress });
});

eventBus.on('orbCompleted', ({ tileId, orbIndex }) => {
  if (currentProgress) {
    const orbId = `${tileId}-orb-${orbIndex}`;
    const wasAlreadyCompleted = currentProgress.completedOrbs.has(orbId);

    if (!wasAlreadyCompleted) {
      currentProgress.completedOrbs.add(orbId);
      saveProgress(currentCourseTitle, currentProgress);
      console.log(`Orb completato: ${orbId}. Totale completati: ${currentProgress.completedOrbs.size}`);
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
