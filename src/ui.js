import { eventBus } from './eventBus.js';

const appContainer = document.getElementById('app-container');

function renderPathway({ course, progress }) {
  console.log('Rendering pathway for:', course.title);
  
  const totalTiles = course.pathway.tiles.length;
  const completedCount = progress.completedTiles.size;
  const percentage = totalTiles > 0 ? Math.round((completedCount / totalTiles) * 100) : 0;

  let tilesHtml = course.pathway.tiles.map((tile, index) => {
    // Semplice esempio per simulare il click e il completamento
    return `<div style="padding: 0.5rem; border: 1px solid #ddd; margin-bottom: 0.5rem; border-radius: 4px; cursor: pointer;" onclick="window.completeTile('${course.title}', ${index})">
              ${tile.title} ${progress.completedTiles.has(index) ? '✅' : ''}
            </div>`;
  }).join('');

  appContainer.innerHTML = `
    <h2 class="pathway-title">${course.title}</h2>
    <p>Completamento: <span id="progress-text">${percentage}%</span></p>
    <div class="progress-bar">
      <div id="global-progress" class="progress" style="width: ${percentage}%"></div>
    </div>
    <div>${tilesHtml}</div>
  `;
}

function updateGlobalProgress({ course, progress }) {
  console.log('Updating global progress');

  const totalTiles = course.pathway.tiles.length;
  const completedCount = progress.completedTiles.size;
  const percentage = totalTiles > 0 ? Math.round((completedCount / totalTiles) * 100) : 0;
  
  const progressText = document.getElementById('progress-text');
  const progressBar = document.getElementById('global-progress');

  if (progressText) progressText.textContent = `${percentage}%`;
  if (progressBar) progressBar.style.width = `${percentage}%`;
}

// Ascolta gli eventi per aggiornare la UI
eventBus.on('progressLoaded', ({ course, progress }) => {
  renderPathway({ course, progress });
});

eventBus.on('progressUpdated', ({ course, progress }) => {
  updateGlobalProgress({ course, progress });
  // In un'app completa, potresti voler solo aggiornare i tile invece di ridisegnare tutto
  renderPathway({ course, progress }); 
});
