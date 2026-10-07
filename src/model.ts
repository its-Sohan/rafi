export type Lang = 'en' | 'bn'
export type Category = 'recent' | 'all' | 'staples' | 'fresh' | 'household'
export type Product = {
  id: string; code: string; en: string; bn: string; detail: string; detailBn: string
  category: Exclude<Category, 'all' | 'recent'>; unit: 'kg' | 'pc' | 'L'; price: number; stock: number
  cost?: number // Wholesale / purchase cost per unit in poisha (minor currency unit: 1 BDT = 100 poisha)
  purchased?: number // Total units purchased / provisioned (scaled integer: 1 unit = 1000)
  groupId?: string // Identifier linking variants of the same product (e.g. 'egg', 'soap')
  variantName?: string // Short variant name for inline picker e.g. 'Brown' / 'White'
  variantNameBn?: string // Bengali variant name e.g. 'লাল' / 'সাদা'
  art: 'rice' | 'oil' | 'egg' | 'milk' | 'sugar' | 'tea' | 'soap' | 'flour' | 'lentil' | 'biscuit' | 'salt' | 'cleaner'
  color: string
}
export type Line = { productId: string; quantity: number }
export type Customer = {
  id: string
  en: string
  bn: string
  phone: string
  creditLimit?: number // Max allowed credit in poisha
  openingBalance?: number // Initial due or loan balance in poisha
  note?: string
}

export type AccountTransaction = {
  id: string
  customerId: string
  type: 'sale_due' | 'payment' | 'loan' | 'credit_adjust'
  amount: number // In minor units (poisha)
  createdAt: string
  note?: string
  receiptId?: string
}

export type Receipt = {
  id: string
  number: number
  createdAt: string
  lines: (Line & { product: Product })[]
  customer: Customer | null
  subtotal: number
  discount: number
  total: number
  paid: number
  tendered: number
  change: number
  due: number
  method: 'cash' | 'mobile' | 'bank'
}

export type ShopState = {
  lines: Line[]
  discount: number
  customerId: string | null
  receipts: Receipt[]
  customProducts?: Product[]
  customCustomers?: Customer[]
  transactions?: AccountTransaction[]
}
export const products: Product[] = [
  { id: 'rice', code: '101', en: 'Miniket rice', bn: 'মিনিকেট চাল', detail: 'Premium · loose', detailBn: 'প্রিমিয়াম · খোলা', category: 'staples', unit: 'kg', price: 7200, cost: 6200, stock: 125000, purchased: 125000, art: 'rice', color: '#e8e4d8' },
  { id: 'oil', code: '102', en: 'Soybean oil', bn: 'সয়াবিন তেল', detail: 'Fresh · 1 litre', detailBn: 'ফ্রেশ · ১ লিটার', category: 'staples', unit: 'pc', price: 18000, cost: 16200, stock: 48000, purchased: 48000, art: 'oil', color: '#f4e8b9' },
  { id: 'egg', code: '103', en: 'Farm eggs', bn: 'ফার্মের ডিম', detail: 'Brown · regular', detailBn: 'লাল · সাধারণ', category: 'fresh', unit: 'pc', price: 1200, cost: 1000, stock: 180000, purchased: 180000, groupId: 'egg', variantName: 'Brown', variantNameBn: 'লাল ডিম', art: 'egg', color: '#f2dfce' },
  { id: 'egg-white', code: '103W', en: 'Farm eggs', bn: 'ফার্মের ডিম', detail: 'White · regular', detailBn: 'সাদা · সাধারণ', category: 'fresh', unit: 'pc', price: 1100, cost: 950, stock: 120000, purchased: 120000, groupId: 'egg', variantName: 'White', variantNameBn: 'সাদা ডিম', art: 'egg', color: '#fffdfa' },
  { id: 'milk', code: '104', en: 'Full cream milk', bn: 'ফুল ক্রিম দুধ', detail: 'Milk Vita · 1 litre', detailBn: 'মিল্ক ভিটা · ১ লিটার', category: 'fresh', unit: 'pc', price: 9000, cost: 8000, stock: 24000, purchased: 24000, art: 'milk', color: '#e0e8f0' },
  { id: 'sugar', code: '105', en: 'White sugar', bn: 'সাদা চিনি', detail: 'Refined · loose', detailBn: 'পরিশোধিত · খোলা', category: 'staples', unit: 'kg', price: 13500, cost: 12000, stock: 65000, purchased: 65000, art: 'sugar', color: '#e6e5ee' },
  { id: 'tea', code: '106', en: 'Black tea', bn: 'কালো চা', detail: 'Ispahani · 200 g', detailBn: 'ইস্পাহানি · ২০০ গ্রাম', category: 'staples', unit: 'pc', price: 11000, cost: 9500, stock: 32000, purchased: 32000, art: 'tea', color: '#dee9d8' },
  { id: 'soap', code: '107', en: 'Bath soap', bn: 'গোসলের সাবান', detail: 'Lemon · 100 g', detailBn: 'লেবু · ১০০ গ্রাম', category: 'household', unit: 'pc', price: 4500, cost: 3800, stock: 56000, purchased: 56000, art: 'soap', color: '#e5ebc9' },
  { id: 'soap-rose', code: '108', en: 'Bath soap', bn: 'গোসলের সাবান', detail: 'Rose · 100 g', detailBn: 'গোলাপ · ১০০ গ্রাম', category: 'household', unit: 'pc', price: 4500, cost: 3800, stock: 38000, purchased: 38000, art: 'soap', color: '#f0dce1' },
  { id: 'flour', code: '109', en: 'Whole wheat flour', bn: 'লাল আটা', detail: 'Freshly milled · loose', detailBn: 'তাজা · খোলা', category: 'staples', unit: 'kg', price: 6000, cost: 5100, stock: 44000, purchased: 44000, art: 'flour', color: '#eae0cf' },
  { id: 'lentil', code: '110', en: 'Red lentils', bn: 'মসুর ডাল', detail: 'Fine grain · loose', detailBn: 'ছোট দানা · খোলা', category: 'staples', unit: 'kg', price: 12000, cost: 10500, stock: 38000, purchased: 38000, art: 'lentil', color: '#f0d7c6' },
  { id: 'biscuit', code: '111', en: 'Butter biscuits', bn: 'বাটার বিস্কুট', detail: 'Olympic · 100 g', detailBn: 'অলিম্পিক · ১০০ গ্রাম', category: 'staples', unit: 'pc', price: 3000, cost: 2500, stock: 18000, purchased: 18000, art: 'biscuit', color: '#eaddba' },
  { id: 'salt', code: '112', en: 'Iodized salt', bn: 'আয়োডিনযুক্ত লবণ', detail: 'ACI Pure · 1 kg', detailBn: 'এসিআই পিওর · ১ কেজি', category: 'staples', unit: 'pc', price: 4200, cost: 3500, stock: 40000, purchased: 40000, art: 'salt', color: '#d8e8ed' },
]
export const customers: Customer[] = [
  { id: 'c1', en: 'Nadia Rahman', bn: 'নাদিয়া রহমান', phone: '01700 000101', creditLimit: 500000 },
  { id: 'c2', en: 'Karim Ahmed', bn: 'করিম আহমেদ', phone: '01700 000102', creditLimit: 300000 },
  { id: 'c3', en: 'Shila Begum', bn: 'শীলা বেগম', phone: '01700 000103', creditLimit: 200000 },
]
export const initialState: ShopState = {
  lines: [{ productId: 'rice', quantity: 2000 }, { productId: 'egg', quantity: 6000 }, { productId: 'milk', quantity: 1000 }],
  discount: 0, customerId: null, receipts: [], customCustomers: [], transactions: [],
}
export const allProducts = (custom?: Product[]) => {
  if (!custom || !custom.length) return products
  const customMap = new Map(custom.map(p => [p.id, p]))
  const baseUpdated = products.map(p => customMap.get(p.id) ?? p)
  const newlyAdded = custom.filter(p => !products.some(bp => bp.id === p.id))
  return [...baseUpdated, ...newlyAdded]
}
export const allCustomers = (custom?: Customer[]) => custom && custom.length ? [...customers, ...custom] : customers
export const findCustomerIn = (id: string, list: Customer[]) => list.find(c => c.id === id) ?? customers.find(c => c.id === id)
export const findProductIn = (id: string, list: Product[]) => list.find(p => p.id === id) ?? products.find(p => p.id === id)!
export const findProduct = (id: string) => products.find(p => p.id === id)!

export function customerLedger(customerId: string, receipts: Receipt[], transactions: AccountTransaction[] = []): AccountTransaction[] {
  const list: AccountTransaction[] = []
  
  // 1. Transactions from sales receipts where due > 0
  for (const r of receipts) {
    if (r.customer?.id === customerId && r.due > 0) {
      list.push({
        id: `tx-sale-${r.id}`,
        customerId,
        type: 'sale_due',
        amount: r.due,
        createdAt: r.createdAt,
        receiptId: r.id,
        note: `Receipt #${String(r.number).padStart(4, '0')}`,
      })
    }
  }

  // 2. Direct ledger transactions (payments, loans, credit adjustments)
  for (const tx of transactions) {
    if (tx.customerId === customerId) {
      list.push(tx)
    }
  }

  // Sort chronological
  return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function customerBalance(customer: Customer, receipts: Receipt[], transactions: AccountTransaction[] = []): {
  totalDue: number // Positive means customer owes shop
  totalPaid: number
  loan: number
  availableCredit: number
} {
  const ledger = customerLedger(customer.id, receipts, transactions)
  let due = customer.openingBalance ?? 0
  let totalPaid = 0
  let loan = 0

  for (const tx of ledger) {
    if (tx.type === 'sale_due') {
      due += tx.amount
    } else if (tx.type === 'loan') {
      due += tx.amount
      loan += tx.amount
    } else if (tx.type === 'payment') {
      due -= tx.amount
      totalPaid += tx.amount
    } else if (tx.type === 'credit_adjust') {
      due += tx.amount
    }
  }

  const creditLimit = customer.creditLimit ?? 500000 // Default 5000 BDT
  const availableCredit = Math.max(0, creditLimit - Math.max(0, due))

  return {
    totalDue: Math.max(0, due),
    totalPaid,
    loan,
    availableCredit,
  }
}

export const productCost = (product: Product) => product.cost ?? Math.round(product.price * 0.85)
export const unitMargin = (product: Product) => product.price - productCost(product)
export const unitMarginPercent = (product: Product) => product.price > 0 ? (unitMargin(product) / product.price) * 100 : 0
export const lineTotal = (price: number, quantity: number) => Math.round(price * quantity / 1000)
export const lineCost = (cost: number, quantity: number) => Math.round(cost * quantity / 1000)
export const lineProfit = (product: Product, quantity: number) => lineTotal(product.price, quantity) - lineCost(productCost(product), quantity)
export function receiptProfit(receipt: Receipt): number {
  const marginSum = receipt.lines.reduce((sum, line) => {
    return sum + lineProfit(line.product, line.quantity)
  }, 0)
  return Math.max(0, marginSum - (receipt.discount || 0))
}

export const subtotal = (lines: Line[], catalog: Product[] = products) => lines.reduce((sum, line) => sum + lineTotal(findProductIn(line.productId, catalog).price, line.quantity), 0)
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
  const catalog = allProducts(state.customProducts)
  const custCatalog = allCustomers(state.customCustomers)
  const sub = subtotal(state.lines, catalog)
  const total = Math.max(0, sub - state.discount)
  const customer = custCatalog.find(c => c.id === state.customerId) ?? null
  if (!state.lines.length || total <= 0) throw new Error('empty')
  if (!Number.isSafeInteger(tendered) || tendered < 0 || tendered > 100000000) throw new Error('amount')
  if (tendered < total && !customer) throw new Error('customer')
  if (method !== 'cash' && tendered > total) throw new Error('overpayment')
  return {
    id: crypto.randomUUID(), number: state.receipts.length + 1, createdAt: new Date().toISOString(),
    lines: state.lines.map(line => ({ ...line, product: { ...findProductIn(line.productId, catalog) } })),
    customer, subtotal: sub, discount: state.discount, total, paid: Math.min(total, tendered), tendered,
    change: Math.max(0, tendered - total), due: Math.max(0, total - tendered), method,
  }
}

export type ReportWindow = 'today' | '3days' | '7days' | 'month'

export function filterReceiptsByWindow(receipts: Receipt[], window: ReportWindow, referenceDate: Date = new Date()): Receipt[] {
  const ref = new Date(referenceDate)
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const d = ref.getDate()
  
  if (window === 'today') {
    const startOfToday = new Date(y, m, d, 0, 0, 0, 0).getTime()
    const endOfToday = new Date(y, m, d, 23, 59, 59, 999).getTime()
    return receipts.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= startOfToday && t <= endOfToday
    })
  }

  if (window === '3days') {
    const start = new Date(y, m, d - 2, 0, 0, 0, 0).getTime()
    const end = new Date(y, m, d, 23, 59, 59, 999).getTime()
    return receipts.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= start && t <= end
    })
  }

  if (window === '7days') {
    const start = new Date(y, m, d - 6, 0, 0, 0, 0).getTime()
    const end = new Date(y, m, d, 23, 59, 59, 999).getTime()
    return receipts.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= start && t <= end
    })
  }

  if (window === 'month') {
    const start = new Date(y, m, 1, 0, 0, 0, 0).getTime()
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime()
    return receipts.filter(r => {
      const t = new Date(r.createdAt).getTime()
      return t >= start && t <= end
    })
  }

  return receipts
}
