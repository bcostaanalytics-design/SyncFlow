
import { ShortageRequest, User, Product } from './types';

const DB_NAME = 'SyncFlowDB';
const DB_VERSION = 4; // Incrementado para garantir a criação do store de produtos
const STORE_NAME = 'requests';
const USER_STORE = 'users';
const PRODUCT_STORE = 'products';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(USER_STORE)) {
        db.createObjectStore(USER_STORE, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        db.createObjectStore(PRODUCT_STORE, { keyPath: 'code' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveRequest = async (req: ShortageRequest) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(req);
};

export const getAllRequests = async (): Promise<ShortageRequest[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

// User Operations
export const saveUser = async (user: User) => {
  const db = await initDB();
  const tx = db.transaction(USER_STORE, 'readwrite');
  tx.objectStore(USER_STORE).put(user);
};

export const getAllUsers = async (): Promise<User[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(USER_STORE, 'readonly');
    const request = tx.objectStore(USER_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteUser = async (username: string) => {
  const db = await initDB();
  const tx = db.transaction(USER_STORE, 'readwrite');
  tx.objectStore(USER_STORE).delete(username);
};

// Product Operations
export const saveProduct = async (product: Product) => {
  const db = await initDB();
  const tx = db.transaction(PRODUCT_STORE, 'readwrite');
  tx.objectStore(PRODUCT_STORE).put(product);
};

export const getAllProducts = async (): Promise<Product[]> => {
  const db = await initDB();
  return new Promise((resolve) => {
    const tx = db.transaction(PRODUCT_STORE, 'readonly');
    const request = tx.objectStore(PRODUCT_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteProduct = async (code: string) => {
  const db = await initDB();
  const tx = db.transaction(PRODUCT_STORE, 'readwrite');
  tx.objectStore(PRODUCT_STORE).delete(code);
};

export const clearAllProducts = async () => {
  const db = await initDB();
  const tx = db.transaction(PRODUCT_STORE, 'readwrite');
  return new Promise<void>((resolve, reject) => {
    const request = tx.objectStore(PRODUCT_STORE).clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
