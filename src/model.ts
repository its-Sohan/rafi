export type Lang = 'en' | 'bn'
export type Category = 'all' | 'staples' | 'fresh' | 'household'
export type Product = {
  id: string; code: string; en: string; bn: string; detail: string; detailBn: string
  category: Exclude<Category, 'all'>; unit: 'kg' | 'pc' | 'L'; price: number; stock: number
  art: 'rice' | 'oil' | 'egg' | 'milk' | 'sugar' | 'tea' | 'soap' | 'flour' | 'lentil' | 'biscuit' | 'salt' | 'cleaner'
  color: string
}
export type Line = { productId: string; quantity: number }
export type Customer = { id: string; en: string; bn: string; phone: string }
export type Receipt = {
  id: string; number: number; createdAt: string; lines: (Line & { product: Product })[]
  customer: Customer | null; subtotal: number; discount: number; total: number
  paid: number; tendered: number; change: number; due: number; method: 'cash' | 'mobile' | 'bank'
}
export type ShopState = { lines: Line[]; discount: number; customerId: string | null; receipts: Receipt[] }
export const products: Product[] = [
  { id: 'rice', code: '101', en: 'Miniket rice', bn: 'মিনিকেট চাল', detail: 'Premium · loose', detailBn: 'প্রিমিয়াম · খোলা', category: 'staples', unit: 'kg', price: 7200, stock: 125000, art: 'rice', color: '#e8e4d8' },
  { id: 'oil', code: '102', en: 'Soybean oil', bn: 'সয়াবিন তেল', detail: 'Fresh · 1 litre', detailBn: 'ফ্রেশ · ১ লিটার', category: 'staples', unit: 'pc', price: 18000, stock: 48000, art: 'oil', color: '#f4e8b9' },
  { id: 'egg', code: '103', en: 'Farm eggs', bn: 'ফার্মের ডিম', detail: 'Brown · regular', detailBn: 'লাল · সাধারণ', category: 'fresh', unit: 'pc', price: 1200, stock: 180000, art: 'egg', color: '#f2dfce' },
  { id: 'milk', code: '104', en: 'Full cream milk', bn: 'ফুল ক্রিম দুধ', detail: 'Milk Vita · 1 litre', detailBn: 'মিল্ক ভিটা · ১ লিটার', category: 'fresh', unit: 'pc', price: 9000, stock: 24000, art: 'milk', color: '#e0e8f0' },
  { id: 'sugar', code: '105', en: 'White sugar', bn: 'সাদা চিনি', detail: 'Refined · loose', detailBn: 'পরিশোধিত · খোলা', category: 'staples', unit: 'kg', price: 13500, stock: 65000, art: 'sugar', color: '#e6e5ee' },
  { id: 'tea', code: '106', en: 'Black tea', bn: 'কালো চা', detail: 'Ispahani · 200 g', detailBn: 'ইস্পাহানি · ২০০ গ্রাম', category: 'staples', unit: 'pc', price: 11000, stock: 32000, art: 'tea', color: '#dee9d8' },
  { id: 'soap', code: '107', en: 'Bath soap', bn: 'গোসলের সাবান', detail: 'Lemon · 100 g', detailBn: 'লেবু · ১০০ গ্রাম', category: 'household', unit: 'pc', price: 4500, stock: 56000, art: 'soap', color: '#e5ebc9' },
  { id: 'soap-rose', code: '108', en: 'Bath soap', bn: 'গোসলের সাবান', detail: 'Rose · 100 g', detailBn: 'গোলাপ · ১০০ গ্রাম', category: 'household', unit: 'pc', price: 4500, stock: 38000, art: 'soap', color: '#f0dce1' },
  { id: 'flour', code: '109', en: 'Whole wheat flour', bn: 'লাল আটা', detail: 'Freshly milled · loose', detailBn: 'তাজা · খোলা', category: 'staples', unit: 'kg', price: 6000, stock: 44000, art: 'flour', color: '#eae0cf' },
  { id: 'lentil', code: '110', en: 'Red lentils', bn: 'মসুর ডাল', detail: 'Fine grain · loose', detailBn: 'ছোট দানা · খোলা', category: 'staples', unit: 'kg', price: 12000, stock: 38000, art: 'lentil', color: '#f0d7c6' },
  { id: 'biscuit', code: '111', en: 'Butter biscuits', bn: 'বাটার বিস্কুট', detail: 'Olympic · 100 g', detailBn: 'অলিম্পিক · ১০০ গ্রাম', category: 'staples', unit: 'pc', price: 3000, stock: 18000, art: 'biscuit', color: '#eaddba' },
  { id: 'salt', code: '112', en: 'Iodized salt', bn: 'আয়োডিনযুক্ত লবণ', detail: 'ACI Pure · 1 kg', detailBn: 'এসিআই পিওর · ১ কেজি', category: 'staples', unit: 'pc', price: 4200, stock: 40000, art: 'salt', color: '#d8e8ed' },
]
export const customers: Customer[] = [
  { id: 'c1', en: 'Nadia Rahman', bn: 'নাদিয়া রহমান', phone: '01700 000101' },
  { id: 'c2', en: 'Karim Ahmed', bn: 'করিম আহমেদ', phone: '01700 000102' },
  { id: 'c3', en: 'Shila Begum', bn: 'শীলা বেগম', phone: '01700 000103' },
]
export const initialState: ShopState = {
  lines: [{ productId: 'rice', quantity: 2000 }, { productId: 'egg', quantity: 6000 }, { productId: 'milk', quantity: 1000 }],
  discount: 0, customerId: null, receipts: [],
}
export const findProduct = (id: string) => products.find(p => p.id === id)!
export const lineTotal = (price: number, quantity: number) => Math.round(price * quantity / 1000)
export const subtotal = (lines: Line[]) => lines.reduce((sum, line) => sum + lineTotal(findProduct(line.productId).price, line.quantity), 0)
export const money = (minor: number) => (minor / 100).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const quantityText = (scaled: number) => (scaled / 1000).toLocaleString('en-US', { maximumFractionDigits: 3 })
export function parseQuantity(value: string, unit: Product['unit']): number | null {
  if (!/^\d+(\.\d{1,3})?$/.test(value.trim())) return null
  const scaled = Math.round(Number(value) * 1000)
  if (scaled <= 0 || scaled > 10000000 || (unit === 'pc' && scaled % 1000 !== 0)) return null
  return scaled
}
export function parseMoney(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const amount = Math.round(Number(value) * 100)
  return Number.isSafeInteger(amount) && amount <= 100000000 ? amount : null
}
export function stockFor(product: Product, receipts: Receipt[]) {
  return product.stock - receipts.reduce((sum, receipt) => sum + receipt.lines.filter(l => l.productId === product.id).reduce((q, l) => q + l.quantity, 0), 0)
}
export function makeReceipt(state: ShopState, tendered: number, method: Receipt['method']): Receipt {
  const sub = subtotal(state.lines)
  const total = Math.max(0, sub - state.discount)
  const customer = customers.find(c => c.id === state.customerId) ?? null
  if (!state.lines.length || total <= 0) throw new Error('empty')
  if (!Number.isSafeInteger(tendered) || tendered < 0 || tendered > 100000000) throw new Error('amount')
  if (tendered < total && !customer) throw new Error('customer')
  if (method !== 'cash' && tendered > total) throw new Error('overpayment')
  return {
    id: crypto.randomUUID(), number: state.receipts.length + 1, createdAt: new Date().toISOString(),
    lines: state.lines.map(line => ({ ...line, product: { ...findProduct(line.productId) } })),
    customer, subtotal: sub, discount: state.discount, total, paid: Math.min(total, tendered), tendered,
    change: Math.max(0, tendered - total), due: Math.max(0, total - tendered), method,
  }
}
