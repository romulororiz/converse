// Simple polyfills for React Native
import 'react-native-url-polyfill/auto';

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

console.log('Polyfills loaded: FormData, Blob, URL');
