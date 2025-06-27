// Simple polyfills for React Native
import 'react-native-url-polyfill/auto';

// Suppress useInsertionEffect warning for React 19 compatibility
if (typeof global.useInsertionEffect === 'undefined') {
	global.useInsertionEffect = global.useEffect;
}

// EventTarget polyfill for React Native
if (typeof global.EventTarget === 'undefined') {
	global.EventTarget = class EventTarget {
		constructor() {
			this._listeners = new Map();
		}

		addEventListener(type, listener, options = {}) {
			if (!this._listeners.has(type)) {
				this._listeners.set(type, []);
			}
			this._listeners.get(type).push({ listener, options });
		}

		removeEventListener(type, listener, options = {}) {
			if (!this._listeners.has(type)) return;

			const listeners = this._listeners.get(type);
			const index = listeners.findIndex(item => item.listener === listener);
			if (index !== -1) {
				listeners.splice(index, 1);
			}
		}

		dispatchEvent(event) {
			if (!this._listeners.has(event.type)) return true;

			const listeners = this._listeners.get(event.type);
			listeners.forEach(({ listener, options }) => {
				if (options.once) {
					this.removeEventListener(event.type, listener);
				}
				listener.call(this, event);
			});

			return !event.defaultPrevented;
		}
	};
}

// Event polyfill for React Native
if (typeof global.Event === 'undefined') {
	global.Event = class Event {
		constructor(type, options = {}) {
			this.type = type;
			this.bubbles = options.bubbles || false;
			this.cancelable = options.cancelable || false;
			this.defaultPrevented = false;
			this.target = null;
			this.currentTarget = null;
		}

		preventDefault() {
			if (this.cancelable) {
				this.defaultPrevented = true;
			}
		}

		stopPropagation() {
			this.bubbles = false;
		}
	};
}

// CustomEvent polyfill for React Native
if (typeof global.CustomEvent === 'undefined') {
	global.CustomEvent = class CustomEvent extends global.Event {
		constructor(type, options = {}) {
			super(type, options);
			this.detail = options.detail || null;
		}
	};
}

// Crypto polyfill for React Native
if (typeof global.crypto === 'undefined') {
	global.crypto = {
		getRandomValues: arr => {
			for (let i = 0; i < arr.length; i++) {
				arr[i] = Math.floor(Math.random() * 256);
			}
			return arr;
		},
		subtle: {
			// Basic implementation for common crypto operations
			digest: async (algorithm, data) => {
				// Simple hash implementation (not cryptographically secure)
				let hash = 0;
				for (let i = 0; i < data.length; i++) {
					const char = data.charCodeAt(i);
					hash = (hash << 5) - hash + char;
					hash = hash & hash; // Convert to 32-bit integer
				}
				return new Uint8Array([
					hash & 0xff,
					(hash >> 8) & 0xff,
					(hash >> 16) & 0xff,
					(hash >> 24) & 0xff,
				]);
			},
			generateKey: async (algorithm, extractable, keyUsages) => {
				// Mock key generation
				return {
					type: 'secret',
					extractable,
					algorithm,
					usages: keyUsages,
				};
			},
			sign: async (algorithm, key, data) => {
				// Mock signing
				return new Uint8Array(32);
			},
			verify: async (algorithm, key, signature, data) => {
				// Mock verification
				return true;
			},
		},
	};
}

// FormData polyfill for React Native
if (typeof global.FormData === 'undefined') {
	global.FormData = class FormData {
		constructor() {
			this._data = [];
		}

		append(name, value, filename) {
			this._data.push({ name, value, filename });
		}

		get(name) {
			const entry = this._data.find(item => item.name === name);
			return entry ? entry.value : null;
		}

		getAll(name) {
			return this._data
				.filter(item => item.name === name)
				.map(item => item.value);
		}

		has(name) {
			return this._data.some(item => item.name === name);
		}

		delete(name) {
			this._data = this._data.filter(item => item.name !== name);
		}

		set(name, value, filename) {
			this.delete(name);
			this.append(name, value, filename);
		}

		entries() {
			return this._data.map(item => [item.name, item.value]);
		}

		keys() {
			return this._data.map(item => item.name);
		}

		values() {
			return this._data.map(item => item.value);
		}

		forEach(callback) {
			this._data.forEach(item => callback(item.value, item.name, this));
		}

		[Symbol.iterator]() {
			return this.entries()[Symbol.iterator]();
		}
	};
}

// Blob polyfill (basic implementation)
if (typeof global.Blob === 'undefined') {
	global.Blob = class Blob {
		constructor(parts = [], options = {}) {
			this.parts = parts;
			this.type = options.type || '';
			this.size = parts.reduce((size, part) => {
				if (typeof part === 'string') {
					return size + part.length;
				}
				return size + (part.length || 0);
			}, 0);
		}

		slice(start = 0, end = this.size, contentType = '') {
			const sliced = this.parts.slice(start, end);
			return new Blob(sliced, { type: contentType });
		}

		text() {
			return Promise.resolve(this.parts.join(''));
		}

		arrayBuffer() {
			const text = this.parts.join('');
			const buffer = new ArrayBuffer(text.length);
			const view = new Uint8Array(buffer);
			for (let i = 0; i < text.length; i++) {
				view[i] = text.charCodeAt(i);
			}
			return Promise.resolve(buffer);
		}
	};
}

console.log(
	'Polyfills loaded: FormData, Blob, URL, Crypto, EventTarget, Event, CustomEvent, useInsertionEffect'
);
