export function loadProgress(title) {
  const key = `progress_${title}`;
  const saved = JSON.parse(localStorage.getItem(key)) || {};
  // MODIFICA: cerchiamo e convertiamo completedOrbs, non più completedTiles
  if (saved.completedOrbs) {
    saved.completedOrbs = new Set(saved.completedOrbs);
  }
  return saved;
}

export function saveProgress(title, progress) {
  const key = `progress_${title}`;
  // MODIFICA: salviamo completedOrbs
  const toSave = { ...progress, completedOrbs: Array.from(progress.completedOrbs) };
  localStorage.setItem(key, JSON.stringify(toSave));
}

export function createEmptyProgress() {
  // MODIFICA: la nostra struttura ora si basa su completedOrbs
  return {
    completedOrbs: new Set()
  };
}
