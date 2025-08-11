import { eventBus } from './eventBus.js';
import { loadXML } from './parser.js';
import './progress.js';

import { renderCourseList } from './ui/ui-loader.js';
import { renderPathway } from './ui/ui-pathway.js';
import { renderLearningSession } from './ui/ui-learning.js';

let currentCourse = null;
let currentProgress = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App Initialized');

  try {
    const response = await fetch('courses.json');
    const courses = await response.json();
    renderCourseList(courses);
  } catch (err) {
    console.error("Errore nel caricamento dell'indice dei corsi:", err);
  }
});

eventBus.on('loadCourse', async (courseFile) => {
  try {
    const response = await fetch(courseFile);
    loadXML(await response.text());
  } catch (err) {
    console.error(`Errore nel caricamento del file del corso ${courseFile}:`, err);
  }
});

eventBus.on('progressLoaded', (data) => {
  currentCourse = data.course;
  currentProgress = data.progress;
  renderPathway(currentCourse, currentProgress);
});

eventBus.on('startLearningSession', ({ tileId, orbIndex }) => {
  renderLearningSession(currentCourse, currentProgress, tileId, orbIndex);
});

eventBus.on('progressUpdated', (newProgress) => {
  currentProgress = newProgress;
  if (currentCourse) {
    renderPathway(currentCourse, currentProgress);
  }
});

// --- CORREZIONE QUI ---
// Ho rimosso il listener per 'orbCompleted' da questo file.
// Ora la catena è: orbCompleted -> progress.js -> progressUpdated -> main.js.
// Questo è il flusso corretto e più robusto.

eventBus.on('parserError', msg => {
  alert('Errore nel caricamento del corso: ' + msg);
});
