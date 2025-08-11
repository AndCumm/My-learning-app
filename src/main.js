import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js'; // Importato solo per attivare i suoi listener

// Importiamo le funzioni dai nostri nuovi moduli specializzati
import { renderCourseList } from './ui/ui-loader.js';
import { renderPathway } from './ui/ui-pathway.js';
import { renderLearningSession } from './ui/ui-learning.js';

let currentCourse = null;
let currentProgress = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App Initialized');

  // Carica la lista dei corsi all'avvio
  try {
    const response = await fetch('courses.json');
    const courses = await response.json();
    renderCourseList(courses);
  } catch (err) {
    console.error("Errore nel caricamento dell'indice dei corsi:", err);
  }
});

// Ascolta l'evento per caricare un corso specifico
eventBus.on('loadCourse', async (courseFile) => {
  try {
    const response = await fetch(courseFile);
    loadXML(await response.text());
  } catch (err) {
    console.error(`Errore nel caricamento del file del corso ${courseFile}:`, err);
  }
});

// Una volta che il corso e i progressi sono caricati, mostra il percorso
eventBus.on('progressLoaded', (data) => {
  currentCourse = data.course;
  currentProgress = data.progress;
  renderPathway(currentCourse, currentProgress);
});

// Quando l'utente clicca un orb, avvia la sessione di apprendimento
eventBus.on('startLearningSession', ({ tileId, orbIndex }) => {
  renderLearningSession(currentCourse, tileId, orbIndex);
});

// Quando i progressi vengono aggiornati (es. orb completato), ridisegna il percorso
eventBus.on('progressUpdated', (newProgress) => {
  currentProgress = newProgress;
  if (currentCourse) {
    renderPathway(currentCourse, currentProgress);
  }
});

// Gestisce gli errori di parsing
eventBus.on('parserError', msg => {
  alert('Errore nel caricamento del corso: ' + msg);
});
