import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js'; // Importato per attivare i suoi listener
import './ui.js';       // Importato per attivare i suoi listener

// Stato globale accessibile per l'interazione
let globalState = {};

document.addEventListener('DOMContentLoaded', () => {
  console.log('App Initialized');

  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const xml = await file.text();
        loadXML(xml);
      }
    });
  }

  eventBus.on('parserError', msg => {
    alert('Errore nel caricamento del corso: ' + msg);
  });

  // Salva i dati di corso e progresso in uno stato globale per l'interazione
  eventBus.on('progressLoaded', data => {
      globalState[data.course.title] = data;
  });

  eventBus.on('progressUpdated', data => {
      globalState[data.course.title] = data;
  });

  // Espone una funzione globale per permettere ai tile di emettere eventi dall'HTML
  window.completeTile = (courseTitle, tileIndex) => {
    const data = globalState[courseTitle];
    if(data && !data.progress.completedTiles.has(tileIndex)) {
        eventBus.emit('tileCompleted', { course: data.course, progress: data.progress, tileId: tileIndex });
    }
  };
});
