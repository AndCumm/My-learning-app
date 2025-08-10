export class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, cb) {
    (this.listeners[event] = this.listeners[event] || []).push(cb);
  }

  emit(event, payload) {
    (this.listeners[event] || []).forEach(cb => cb(payload));
  }
}

export const eventBus = new EventBus();
