import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js'; // Importato per attivare i suoi listener
import { renderSavedCourse } from './ui.js'; // Importa la nuova funzione dalla UI

document.addEventListener('DOMContentLoaded', () => {
  console.log('App Initialized');

  // Variabile per tenere traccia dell'ultimo XML letto da un file
  let lastLoadedXML = '';

  // --- NUOVA LOGICA DI AVVIO ---

  // 1. Controlla se esiste un corso salvato nel localStorage
  const savedCourseXML = localStorage.getItem('lastCourseXML');
  const savedCourseTitle = localStorage.getItem('lastCourseTitle');

  if (savedCourseXML && savedCourseTitle) {
    // Se c'è, chiedi alla UI di mostrarlo
    renderSavedCourse({ title: savedCourseTitle, xml: savedCourseXML });
  }
  
  // 2. Ascolta l'evento per caricare un corso salvato (emesso dalla UI)
  eventBus.on('loadSavedCourse', xml => {
    loadXML(xml);
  });

  // --- FINE NUOVA LOGICA DI AVVIO ---

  // Logica per il caricamento da file
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        const xml = await file.text();
        // Salva temporaneamente l'XML appena letto dal file
        lastLoadedXML = xml; 
        loadXML(xml);
      }
    });
  }

  // Listener per gli errori di parsing
  eventBus.on('parserError', msg => {
    alert('Errore nel caricamento del corso: ' + msg);
  });

  // --- NUOVA LOGICA DI SALVATAGGIO ---

  // 3. Ascolta l'evento 'courseLoaded' per salvare il corso con successo
  eventBus.on('courseLoaded', course => {
    // Salva nel localStorage solo se 'lastLoadedXML' contiene dati (cioè, proviene da un file)
    if (lastLoadedXML) {
      console.log(`Salvataggio del corso "${course.title}" nel localStorage.`);
      localStorage.setItem('lastCourseXML', lastLoadedXML);
      localStorage.setItem('lastCourseTitle', course.title);
      // Pulisci la variabile per non salvare di nuovo per errore
      lastLoadedXML = ''; 
    }
  });
});
