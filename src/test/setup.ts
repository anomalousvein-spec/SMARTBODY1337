import { indexedDB } from "fake-indexeddb";

// Mock IndexedDB for tests
globalThis.indexedDB = indexedDB;
