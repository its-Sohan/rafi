import { migrateShopState, type ShopState } from './model'

let database: Promise<IDBDatabase> | undefined
function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('hisab-counter', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('workspace')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return database
}
export async function loadState(): Promise<ShopState | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction('workspace').objectStore('workspace').get('state')
    request.onsuccess = () => {
      const saved = request.result as ShopState | undefined
      resolve(saved ? migrateShopState(saved) : undefined)
    }
    request.onerror = () => reject(request.error)
  })
}
let writeQueue = Promise.resolve()
export function saveState(state: ShopState): Promise<void> {
  const write = writeQueue.catch(() => {}).then(() => writeState(state))
  writeQueue = write
  return write
}
async function writeState(state: ShopState): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('workspace', 'readwrite')
    transaction.objectStore('workspace').put(state, 'state')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
