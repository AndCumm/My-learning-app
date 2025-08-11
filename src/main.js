import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js';
import { renderCourseList } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App Initialized');

  // All'avvio, carica l'indice dei corsi dal file JSON
  try {
    const response = await fetch('courses.json');
    const courses = await response.json();
    renderCourseList(courses);
  } catch (err) {
    console.error('Errore nel caricamento dell\'indice dei corsi:', err);
    // Potresti mostrare un errore nella UI qui
  }
  
  // Ascolta l'evento per caricare un corso specifico dalla lista
  eventBus.on('loadCourse', async (courseFile) => {
    try {
      const response = await fetch(courseFile);
      const xml = await response.text();
      loadXML(xml);
    } catch (err) {
      console.error(`Errore nel caricamento del file del corso ${courseFile}:`, err);
    }
  });

  // Listener per gli errori di parsing (rimane invariato)
  eventBus.on('parserError', msg => {
    alert('Errore nel caricamento del corso: ' + msg);
  });
});
