export type Lang = 'en' | 'bn'
export type Category = 'recent' | 'all' | 'staples' | 'fresh' | 'household'
export type ProductUnit = 'kg' | 'pc' | 'L' | 'BDT'
export type Product = {
  id: string; code: string; en: string; bn: string; detail: string; detailBn: string
  category: Exclude<Category, 'all' | 'recent'>; unit: ProductUnit; price: number; stock: number
  cost?: number // Wholesale / purchase cost per unit in poisha (minor currency unit: 1 BDT = 100 poisha)
  purchased?: number // Total units purchased / provisioned (scaled integer: 1 unit = 1000)
  groupId?: string // Identifier linking variants of the same product (e.g. 'egg', 'soap')
  variantName?: string // Short variant name for inline picker e.g. 'Brown' / 'White'
  variantNameBn?: string // Bengali variant name e.g. 'লাল' / 'সাদা'
  archived?: boolean // Discontinued and hidden from the sales catalog
  art: 'rice' | 'oil' | 'egg' | 'milk' | 'sugar' | 'tea' | 'soap' | 'flour' | 'lentil' | 'biscuit' | 'salt' | 'cleaner' | 'pencil' | 'book' | 'notebook' | 'pen' | 'recharge' | 'snack' | 'daily'
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
  version?: 2
  lines: Line[]
  discount: number
  customerId: string | null
  receipts: Receipt[]
  customProducts?: Product[]
  customCustomers?: Customer[]
  transactions?: AccountTransaction[]
}
export const products: Product[] = [
  { id: 'rice', code: '101', en: 'Exercise book', bn: 'এক্সারসাইজ খাতা', detail: '80 pages · ruled', detailBn: '৮০ পৃষ্ঠা · দাগ টানা', category: 'staples', unit: 'pc', price: 7200, cost: 6200, stock: 125000, purchased: 125000, art: 'book', color: '#e8e4d8' },
  { id: 'oil', code: '102', en: 'Blue ball pen', bn: 'নীল বলপেন', detail: 'Smooth writing · each', detailBn: 'মসৃণ লেখা · প্রতি পিস', category: 'staples', unit: 'pc', price: 1800, cost: 1200, stock: 48000, purchased: 48000, art: 'pen', color: '#e4eaff' },
  { id: 'egg', code: '103', en: 'HB pencil', bn: 'এইচবি পেন্সিল', detail: 'Wooden · each', detailBn: 'কাঠের · প্রতি পিস', category: 'staples', unit: 'pc', price: 1200, cost: 800, stock: 180000, purchased: 180000, art: 'pencil', color: '#f2dfce' },
  { id: 'egg-white', code: '103W', en: 'Black ball pen', bn: 'কালো বলপেন', detail: 'Fine tip · each', detailBn: 'সরু নিব · প্রতি পিস', category: 'staples', unit: 'pc', price: 1000, cost: 700, stock: 120000, purchased: 120000, art: 'pen', color: '#fffdfa' },
  { id: 'milk', code: '104', en: 'Mobile recharge', bn: 'মোবাইল রিচার্জ', detail: 'All operators · enter amount', detailBn: 'সব অপারেটর · টাকার পরিমাণ দিন', category: 'fresh', unit: 'BDT', price: 100, cost: 98, stock: 24000000, purchased: 24000000, art: 'recharge', color: '#e0e8f0' },
  { id: 'sugar', code: '105', en: 'Class notebook', bn: 'ক্লাসের খাতা', detail: '120 pages · ruled', detailBn: '১২০ পৃষ্ঠা · দাগ টানা', category: 'staples', unit: 'pc', price: 13500, cost: 11500, stock: 65000, purchased: 65000, art: 'notebook', color: '#e6e5ee' },
  { id: 'tea', code: '106', en: 'Drawing book', bn: 'ড্রয়িং খাতা', detail: 'A4 · 40 sheets', detailBn: 'এ ফোর · ৪০ পাতা', category: 'staples', unit: 'pc', price: 11000, cost: 9000, stock: 32000, purchased: 32000, art: 'book', color: '#dee9d8' },
  { id: 'soap', code: '107', en: 'Eraser', bn: 'রাবার', detail: 'Soft · each', detailBn: 'নরম · প্রতি পিস', category: 'staples', unit: 'pc', price: 4500, cost: 3000, stock: 56000, purchased: 56000, art: 'daily', color: '#e5ebc9' },
  { id: 'soap-rose', code: '108', en: 'Pencil sharpener', bn: 'পেন্সিল কাটার', detail: 'Metal blade · each', detailBn: 'ধাতব ব্লেড · প্রতি পিস', category: 'staples', unit: 'pc', price: 4500, cost: 3000, stock: 38000, purchased: 38000, art: 'daily', color: '#f0dce1' },
  { id: 'flour', code: '109', en: '30 cm ruler', bn: '৩০ সেমি স্কেল', detail: 'Clear plastic · each', detailBn: 'স্বচ্ছ প্লাস্টিক · প্রতি পিস', category: 'staples', unit: 'pc', price: 6000, cost: 4000, stock: 44000, purchased: 44000, art: 'daily', color: '#eae0cf' },
  { id: 'lentil', code: '110', en: 'Glue stick', bn: 'গ্লু স্টিক', detail: 'Small · each', detailBn: 'ছোট · প্রতি পিস', category: 'staples', unit: 'pc', price: 12000, cost: 9000, stock: 38000, purchased: 38000, art: 'daily', color: '#f0d7c6' },
  { id: 'biscuit', code: '111', en: 'Potato chips', bn: 'আলুর চিপস', detail: 'Small packet · each', detailBn: 'ছোট প্যাকেট · প্রতি পিস', category: 'household', unit: 'pc', price: 3000, cost: 2200, stock: 18000, purchased: 18000, art: 'snack', color: '#eaddba' },
  { id: 'salt', code: '112', en: 'Electricity meter top-up', bn: 'বিদ্যুৎ মিটার টপ-আপ', detail: 'Prepaid meter · enter amount', detailBn: 'প্রিপেইড মিটার · টাকার পরিমাণ দিন', category: 'fresh', unit: 'BDT', price: 100, cost: 99, stock: 40000000, purchased: 40000000, art: 'recharge', color: '#d8e8ed' },
  { id: 'recharge-20', code: '113', en: 'Internet recharge', bn: 'ইন্টারনেট রিচার্জ', detail: 'Broadband or data · enter amount', detailBn: 'ব্রডব্যান্ড বা ডাটা · টাকার পরিমাণ দিন', category: 'fresh', unit: 'BDT', price: 100, cost: 97, stock: 50000000, purchased: 50000000, art: 'recharge', color: '#e0e8f0' },
  { id: 'recharge-100', code: '114', en: 'TV recharge', bn: 'টিভি রিচার্জ', detail: 'DTH or cable · enter amount', detailBn: 'ডিটিএইচ বা কেবল · টাকার পরিমাণ দিন', category: 'fresh', unit: 'BDT', price: 100, cost: 98, stock: 20000000, purchased: 20000000, art: 'recharge', color: '#e0e8f0' },
  { id: 'khata-small', code: '115', en: 'Pocket notebook', bn: 'পকেট নোটবুক', detail: '40 pages · each', detailBn: '৪০ পৃষ্ঠা · প্রতি পিস', category: 'staples', unit: 'pc', price: 2500, cost: 1700, stock: 30000, purchased: 30000, art: 'notebook', color: '#f1e4ca' },
  { id: 'biscuit-water', code: '116', en: 'Bottled water · 500 ml', bn: 'বোতলজাত পানি · ৫০০ মি.লি.', detail: 'Sealed bottle · each', detailBn: 'সিল করা বোতল · প্রতি পিস', category: 'household', unit: 'pc', price: 2000, cost: 1200, stock: 24000, purchased: 24000, art: 'daily', color: '#d8e8ed' },
]
export const customers: Customer[] = [
  { id: 'c1', en: 'Nadia Rahman', bn: 'নাদিয়া রহমান', phone: '01700 000101', creditLimit: 500000 },
  { id: 'c2', en: 'Karim Ahmed', bn: 'করিম আহমেদ', phone: '01700 000102', creditLimit: 300000 },
  { id: 'c3', en: 'Shila Begum', bn: 'শীলা বেগম', phone: '01700 000103', creditLimit: 200000 },
]
export const initialState: ShopState = {
  version: 2,
  lines: [{ productId: 'rice', quantity: 2000 }, { productId: 'egg', quantity: 6000 }, { productId: 'milk', quantity: 90000 }],
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
export const isMoneyUnit = (unit: ProductUnit) => unit === 'BDT'
export const unitText = (unit: ProductUnit) => isMoneyUnit(unit) ? '৳' : unit
export const quantityWithUnit = (scaled: number, unit: ProductUnit) => isMoneyUnit(unit)
  ? `৳ ${money(Math.round(scaled / 10))}`
  : `${quantityText(scaled)} ${unit}`
const legacyRechargeValues: Record<string, number> = { milk: 90, salt: 50, 'recharge-20': 20, 'recharge-100': 100 }
export function migrateShopState(state: ShopState): ShopState {
  if (state.version === 2) return state
  return {
    ...state,
    version: 2,
    lines: state.lines.map(line => legacyRechargeValues[line.productId]
      ? { ...line, quantity: line.quantity * legacyRechargeValues[line.productId] }
      : line),
  }
}
export function parseQuantity(value: string, unit: Product['unit']): number | null {
  const pattern = isMoneyUnit(unit) ? /^\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,3})?$/
  if (!pattern.test(value.trim())) return null
  const scaled = Math.round(Number(value) * 1000)
  const maximum = isMoneyUnit(unit) ? 1000000000 : 10000000
  if (scaled <= 0 || scaled > maximum || (unit === 'pc' && scaled % 1000 !== 0)) return null
  return scaled
}
export function parseMoney(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const amount = Math.round(Number(value) * 100)
  return Number.isSafeInteger(amount) && amount <= 100000000 ? amount : null
}
export function stockFor(product: Product, receipts: Receipt[]) {
  return product.stock - receipts.reduce((sum, receipt) => sum + receipt.lines.filter(l => l.productId === product.id).reduce((quantity, line) => {
    // Receipts snapshot their original product. Convert legacy fixed-denomination
    // recharge pieces to their monetary value when reading the new BDT balance.
    if (isMoneyUnit(product.unit) && !isMoneyUnit(line.product.unit)) {
      return quantity + lineTotal(line.product.price, line.quantity) * 10
    }
    return quantity + line.quantity
  }, 0), 0)
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
