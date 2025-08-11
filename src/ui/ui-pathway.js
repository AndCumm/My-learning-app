import { eventBus } from '../eventBus.js';
import { pathwayView, showView, loaderView } from './ui-common.js';

let openTiles = new Set();

function toggleTileDropdown(tileId) {
    if (openTiles.has(tileId)) {
        openTiles.delete(tileId);
    } else {
        openTiles.add(tileId);
    }
    updateTileDropdowns();
}

function updateTileDropdowns() {
    pathwayView.querySelectorAll('.tile-container').forEach(container => {
        const tileId = container.dataset.tileId;
        const isOpen = openTiles.has(tileId);
        container.querySelector('.tile-header').classList.toggle('open', isOpen);
        container.querySelector('.orbs-dropdown').classList.toggle('open', isOpen);
        container.querySelector('.tile-chevron').classList.toggle('rotated', isOpen);
    });
}

export function renderPathway(course, progress) {
    const totalOrbs = course.pathway.tiles.reduce((sum, tile) => sum + tile.orbs.length, 0);
    const completedOrbsCount = progress.completedOrbs.size;
    const percentage = totalOrbs > 0 ? Math.round((completedOrbsCount / totalOrbs) * 100) : 0;
    
    let globalIndex = 0;
    const flatOrbList = [];
    course.pathway.tiles.forEach(tile => {
        tile.orbs.forEach((orb, orbIndex) => {
            flatOrbList.push({ ...orb, globalIndex: globalIndex++, tileId: tile.id, originalOrbIndex: orbIndex });
        });
    });

    const tilesHtml = course.pathway.tiles.map(tile => {
        const orbsInTile = tile.orbs.length;
        const completedOrbsInTile = tile.orbs.filter((orb, i) => progress.completedOrbs.has(`${tile.id}-orb-${i}`)).length;
        const isTileCompleted = orbsInTile > 0 && completedOrbsInTile === orbsInTile;
        const isOpen = openTiles.has(tile.id);
        
        const orbsForThisTile = flatOrbList.filter(orb => orb.tileId === tile.id);
        const orbsHtml = orbsForThisTile.map(orb => {
            const isOrbCompleted = progress.completedOrbs.has(`${orb.tileId}-orb-${orb.originalOrbIndex}`);
            let isOrbLocked = false;
            if (orb.globalIndex > 0) {
                const prevOrb = flatOrbList[orb.globalIndex - 1];
                if (!progress.completedOrbs.has(`${prevOrb.tileId}-orb-${prevOrb.originalOrbIndex}`)) {
                    isOrbLocked = true;
                }
            }
            const lessonCount = orb.contents.filter(c => c.type === 'lesson').length;
            const flashcardCount = orb.contents.filter(c => c.type === 'flashcard').length;
            return `
                <div class="orb-item ${isOrbLocked ? 'locked' : ''}" data-tile-id="${orb.tileId}" data-orb-index="${orb.originalOrbIndex}">
                    <div class="orb-content"><div class="orb-title">${orb.title}</div>
                        <div class="orb-indicators">
                            ${lessonCount > 0 ? `<span class="content-badge lesson">📖 ${lessonCount}</span>` : ''}
                            ${flashcardCount > 0 ? `<span class="content-badge flashcard">🃏 ${flashcardCount}</span>` : ''}
                        </div>
                    </div>
                    <div class="orb-arrow">${isOrbLocked ? '🔒' : (isOrbCompleted ? '✅' : '▶')}</div>
                </div>`;
        }).join('');

        return `
            <div class="tile-container ${isTileCompleted ? 'completed' : ''}" data-tile-id="${tile.id}">
                <div class="tile-header ${isOpen ? 'open' : ''}">
                    <div class="tile-info"><div class="tile-title">${tile.title}</div>
                        <div class="tile-meta">
                            <span class="orb-count">${tile.orbs.length} moduli</span>
                            ${isTileCompleted ? '<span class="completion-badge">✅ Completato</span>' : ''}
                        </div>
                    </div>
                    <div class="tile-chevron ${isOpen ? 'rotated' : ''}">▼</div>
                </div>
                <div class="orbs-dropdown ${isOpen ? 'open' : ''}"><div class="orbs-content">${orbsHtml}</div></div>
            </div>`;
    }).join('');

    pathwayView.innerHTML = `
        <div class="pathway-card">
            <div class="course-header"><h2 class="course-title">${course.title}</h2>
                <div class="course-stats">
                    <div class="progress-section">
                        <div class="progress-text">Completamento: <span class="progress-value">${percentage}%</span></div>
                        <div class="progress-bar-container"><div class="progress-fill" style="width: ${percentage}%"></div></div>
                    </div>
                    <div class="action-buttons">
                        <button id="back-to-loader-btn" class="secondary-btn">↩️ Cambia Corso</button>
                        <button id="reset-progress-btn" class="reset-btn">🗑️ Reset Progresso</button>
                    </div>
                </div>
            </div>
            <div class="tiles-container">${tilesHtml}</div>
        </div>`;

    pathwayView.querySelectorAll('.tile-header').forEach(header => {
        header.addEventListener('click', () => toggleTileDropdown(header.closest('.tile-container').dataset.tileId));
    });

    pathwayView.querySelectorAll('.orb-item:not(.locked)').forEach(item => {
        item.addEventListener('click', () => {
            eventBus.emit('startLearningSession', { tileId: item.dataset.tileId, orbIndex: parseInt(item.dataset.orbIndex) });
        });
    });

    pathwayView.querySelector('#reset-progress-btn').addEventListener('click', () => {
        if (confirm('Sei sicuro di voler resettare tutto il progresso?')) {
            eventBus.emit('resetProgress');
        }
    });

    pathwayView.querySelector('#back-to-loader-btn').addEventListener('click', () => showView(loaderView));
    
    showView(pathwayView);
}
