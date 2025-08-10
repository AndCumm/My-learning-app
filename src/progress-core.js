export function loadProgress(title) {
  const key = `progress_${title}`;
  const saved = JSON.parse(localStorage.getItem(key)) || {};
  if (saved.completedTiles) {
    // Riconverte l'array salvato in un Set
    saved.completedTiles = new Set(saved.completedTiles);
  }
  return saved;
}

export function saveProgress(title, progress) {
  const key = `progress_${title}`;
  // Converte il Set in un Array per la serializzazione JSON
  const toSave = { ...progress, completedTiles: Array.from(progress.completedTiles) };
  localStorage.setItem(key, JSON.stringify(toSave));
}

export function createEmptyProgress() {
  return {
    currentCraneIndex: 0,
    completedTiles: new Set()
  };
}
