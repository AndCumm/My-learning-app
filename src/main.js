import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js'; // Importato per attivare i suoi listener
import './ui.js';       // Importato per attivare i suoi listener

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
});
