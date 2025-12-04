
import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

// This is a bare-bones event emitter.
// We use this to decouple the error source from the error handler.
// This allows us to emit errors from anywhere in the app and handle them in a centralized location.

type AppEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class TypedEventEmitter {
  private emitter = new EventEmitter();

  on<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): void {
    this.emitter.on(event, listener as any);
  }

  off<T extends keyof AppEvents>(event: T, listener: AppEvents[T]): void {
    this.emitter.off(event, listener as any);
  }

  emit<T extends keyof AppEvents>(
    event: T,
    ...args: Parameters<AppEvents[T]>
  ): void {
    this.emitter.emit(event, ...args);
  }
}

export const errorEmitter = new TypedEventEmitter();
