import { eventBus } from './eventBus.js';
import { parseXML } from './parser-core.js';

export function loadXML(xmlString) {
  try {
    const course = parseXML(xmlString);
    eventBus.emit('courseLoaded', course);
  } catch (err) {
    eventBus.emit('parserError', err.message);
  }
}
