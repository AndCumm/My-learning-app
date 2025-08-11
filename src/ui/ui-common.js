export const loaderView = document.getElementById('loader-view');
export const pathwayView = document.getElementById('pathway-view');
export const learningView = document.getElementById('learning-view');

/**
 * Mostra una vista specifica e nasconde le altre.
 * @param {HTMLElement} viewToShow L'elemento della vista da mostrare.
 */
export function showView(viewToShow) {
    [loaderView, pathwayView, learningView].forEach(v => v.classList.remove('active'));
    viewToShow.classList.add('active');
}
