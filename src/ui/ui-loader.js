import { eventBus } from '../eventBus.js';
import { loaderView } from './ui-common.js';

const courseListContainer = document.getElementById('saved-courses-view');
const fileInputCard = document.querySelector('#loader-view .card > h1').parentNode; // Trova il contenitore originale

export function renderCourseList(courses) {
    if (!courseListContainer || !fileInputCard) return;

    // Nascondiamo la vecchia sezione per caricare i file
    fileInputCard.style.display = 'none';

    const courseButtonsHtml = courses.map(course => `
        <button class="saved-course-btn" data-course-file="${course.file}">
        <strong>${course.title}</strong>
        <br>
        <small>${course.description}</small>
        </button>
    `).join('');

    // Mostriamo la nuova sezione con la lista dei corsi
    loaderView.innerHTML = `
        <div class="card">
            <div class="saved-course-card">
                <h3>I Miei Corsi</h3>
                <p>Seleziona un corso per iniziare.</p>
                <div class="course-list">
                    ${courseButtonsHtml}
                </div>
            </div>
        </div>
    `;

    loaderView.querySelectorAll('.saved-course-btn').forEach(button => {
        button.addEventListener('click', () => {
            const courseFile = button.dataset.courseFile;
            eventBus.emit('loadCourse', courseFile);
        });
    });
}
