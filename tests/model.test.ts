import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allCustomers, allProducts, customerBalance, displayCatalogProducts, filterReceiptsByWindow, findProduct, getProductVariants,
  initialState, lineTotal, makeReceipt, migrateShopState, parseMoney, parseQuantity, products,
  quantityWithUnit, receiptProfit, scoreProductVariant, searchCatalog, serviceCategories, stockFor, subtotal, unitText,
  type AccountTransaction, type Customer, type Product, type ShopState,
} from '../src/model.ts'

const saleState: ShopState = {
  ...initialState,
  lines: [{ productId: 'print-pdf-bw', quantity: 20000 }, { productId: 'cv-design', quantity: 1000 }],
}

test('Bangladesh computer shop catalog contains bilingual, unstocked services', () => {
  assert.equal(products.length, 39)
  assert.equal(displayCatalogProducts().length, 39)
  assert.equal(new Set(products.map(p => p.id)).size, products.length)
  assert.equal(new Set(products.map(p => p.code)).size, products.length)
  assert.deepEqual(new Set(products.map(p => p.category)), new Set(serviceCategories))
  assert.ok(products.every(p => p.en && p.bn && p.detail && p.detailBn && p.price > 0 && p.cost !== undefined))
  assert.ok(products.every(p => p.trackStock === false && p.stock === 0 && p.purchased === 0))
  assert.equal(findProduct('print-pdf-bw').unit, 'page')
  assert.equal(findProduct('laminate-a4').unit, 'sheet')
  assert.equal(findProduct('passport-photo').unit, 'set')
  assert.match(findProduct('university-apply').detail, /fee extra/)
  assert.match(findProduct('online-fee-help').detail, /charge only/)
  assert.equal(initialState.version, 4)
  assert.equal(initialState.lines.length, 0)
  assert.equal(allCustomers().length, 0)
})

test('money and quantities keep poisha and scaled units exact', () => {
  assert.equal(parseMoney('135.25'), 13525)
  assert.equal(parseMoney('135.251'), null)
  assert.equal(parseQuantity('2.5', 'pc'), null)
  assert.equal(parseQuantity('2.5', 'job'), null)
  assert.equal(parseQuantity('2.5', 'page'), null)
  assert.equal(parseQuantity('1.5', 'sheet'), null)
  assert.equal(parseQuantity('1.5', 'set'), null)
  assert.equal(parseQuantity('20', 'page'), 20000)
  assert.equal(parseQuantity('2', 'pc'), 2000)
  assert.equal(parseQuantity('0.750', 'kg'), 750)
  assert.equal(parseQuantity('500.25', 'BDT'), 500250)
  assert.equal(quantityWithUnit(500250, 'BDT'), '৳ 500.25')
  assert.equal(quantityWithUnit(20000, 'page', 'bn'), '20 পৃষ্ঠা')
  assert.equal(unitText('job', 'bn'), 'কাজ')
  assert.equal(lineTotal(35000, 2000), 70000)
  assert.equal(subtotal(saleState.lines), 45000)
})

test('cash sale snapshots per-page and per-job fees without reducing stock', () => {
  const receipt = makeReceipt(saleState, 50000, 'cash')
  assert.equal(receipt.total, 45000)
  assert.equal(receipt.paid, 45000)
  assert.equal(receipt.change, 5000)
  assert.equal(receipt.due, 0)
  assert.equal(stockFor(findProduct('print-pdf-bw'), [receipt]), 0)
  assert.notEqual(receipt.lines[0].product, findProduct('print-pdf-bw'))
  assert.equal(receiptProfit(receipt), 35000)
})

test('service work can be billed repeatedly without creating inventory value', () => {
  const service = findProduct('university-apply')
  assert.equal(service.unit, 'job')
  const state: ShopState = { ...initialState, lines: [{ productId: service.id, quantity: 2000 }] }
  const receipt = makeReceipt(state, 40000, 'cash')
  assert.equal(receipt.total, 40000)
  assert.equal(receiptProfit(receipt), 36000)
  assert.equal(stockFor(service, [receipt]), 0)
  assert.equal(lineTotal(service.price, stockFor(service, [receipt])), 0)
})

test('a user-added physical item still uses inventory stock', () => {
  const item: Product = { ...findProduct('print-pdf-bw'), id: 'paper-pack', code: 'P900', en: 'Paper pack', bn: 'কাগজের প্যাকেট', category: 'accessories', unit: 'pc', price: 35000, cost: 20000, stock: 5000, purchased: 5000, trackStock: true }
  const receipt = makeReceipt({ ...initialState, customProducts: [item], lines: [{ productId: item.id, quantity: 2000 }] }, 70000, 'cash')
  assert.equal(stockFor(item, [receipt]), 3000)
  assert.equal(stockFor(findProduct('print-pdf-bw'), [receipt]), 0)
})

test('dues require a customer and electronic payments cannot exceed the bill', () => {
  assert.throws(() => makeReceipt(saleState, 30000, 'cash'), /customer/)
  const customer: Customer = { id: 'client-1', en: 'Shop client', bn: 'দোকানের ক্রেতা', phone: '01700 000000', creditLimit: 500000 }
  const receipt = makeReceipt({ ...saleState, customCustomers: [customer], customerId: customer.id, discount: 5000 }, 30000, 'mobile')
  assert.equal(receipt.total, 40000)
  assert.equal(receipt.due, 10000)
  assert.equal(receipt.change, 0)
  assert.throws(() => makeReceipt(saleState, 50000, 'mobile'), /overpayment/)
  assert.throws(() => makeReceipt(initialState, 0, 'cash'), /empty/)
  assert.throws(() => makeReceipt(saleState, -1, 'cash'), /amount/)
})

test('existing demo draft is cleared while old account data remains', () => {
  const migrated = migrateShopState({
    ...initialState,
    version: 2,
    lines: [{ productId: 'rice', quantity: 2000 }, { productId: 'egg', quantity: 6000 }, { productId: 'milk', quantity: 90000 }],
  })
  assert.equal(migrated.version, 4)
  assert.deepEqual(migrated.lines, [])
  assert.deepEqual(migrated.customProducts, [])

  const historicalProduct: Product = { ...findProduct('print-pdf-bw'), id: 'rice', code: '101', en: 'Exercise book', category: 'staples', unit: 'pc', price: 7200, stock: 10000, trackStock: true }
  const historicalState: ShopState = {
    ...initialState,
    version: 2,
    lines: [{ productId: 'oil', quantity: 1000 }],
    customProducts: [historicalProduct],
    customerId: 'c1',
    transactions: [{ id: 'tx-1', customerId: 'c1', type: 'payment', amount: 1000, createdAt: '2026-10-01T12:00:00Z' }],
  }
  const oldReceipt = makeReceipt({ ...historicalState, lines: [{ productId: 'rice', quantity: 1000 }] }, 7200, 'cash')
  historicalState.receipts = [oldReceipt]
  const updated = migrateShopState(historicalState)
  assert.equal(updated.version, 4)
  assert.deepEqual(updated.receipts, [oldReceipt])
  assert.deepEqual(updated.transactions, historicalState.transactions)
  assert.deepEqual(updated.lines, historicalState.lines)
  assert.equal(updated.customProducts?.find(p => p.id === 'oil')?.archived, true)
  assert.equal(updated.customProducts?.find(p => p.id === 'oil')?.price, 1800)
  assert.equal(updated.customProducts?.find(p => p.id === 'rice')?.price, 7200)
  assert.equal(updated.customCustomers?.find(c => c.id === 'c1')?.en, 'Nadia Rahman')
  assert.equal(subtotal(updated.lines, allProducts(updated.customProducts)), 1800)
  assert.equal(migrateShopState(updated), updated)
})

test('version 3 shop data migrates to service catalog without losing drafts or receipts', () => {
  const previousSale = makeReceipt(saleState, 45000, 'cash')
  const oldCable: Product = { ...findProduct('print-pdf-bw'), id: 'cable-usbc', code: 'A302', en: 'USB-C cable · 1 m', bn: 'ইউএসবি-সি কেবল', category: 'accessories', unit: 'pc', price: 35000, cost: 20000, stock: 42000, trackStock: true }
  const oldReceipt = { ...previousSale, lines: [{ productId: oldCable.id, quantity: 1000, product: oldCable }] }
  const oldCharger: Product = { ...oldCable, id: 'charger-25w', code: 'A301', price: 140000, stock: 25000 }
  const userItem: Product = { ...oldCable, id: 'custom-paper', code: 'P901', en: 'Paper pack' }
  const saved: ShopState = {
    ...initialState, version: 3, lines: [{ productId: oldCable.id, quantity: 2000 }],
    receipts: [oldReceipt], customProducts: [oldCharger, userItem],
  }
  const migrated = migrateShopState(saved)
  const catalog = allProducts(migrated.customProducts)
  assert.equal(migrated.version, 4)
  assert.deepEqual(migrated.lines, saved.lines)
  assert.deepEqual(migrated.receipts, saved.receipts)
  assert.equal(catalog.find(p => p.id === oldCable.id)?.price, 35000)
  assert.equal(catalog.find(p => p.id === oldCable.id)?.archived, true)
  assert.equal(catalog.find(p => p.id === oldCharger.id)?.price, 140000)
  assert.equal(catalog.find(p => p.id === oldCharger.id)?.archived, true)
  assert.equal(catalog.find(p => p.id === userItem.id)?.archived, undefined)
  assert.equal(subtotal(migrated.lines, catalog), 70000)
  assert.ok(!displayCatalogProducts(catalog).some(p => p.id === oldCable.id))
  assert.equal(migrateShopState(migrated), migrated)
})

test('old fixed denomination recharge drafts migrate once to a monetary balance', () => {
  const migrated = migrateShopState({
    ...initialState,
    version: undefined,
    lines: [{ productId: 'milk', quantity: 2000 }],
  })
  assert.equal(migrated.version, 4)
  assert.deepEqual(migrated.lines, [{ productId: 'milk', quantity: 180000 }])
  const recharge = migrated.customProducts?.find(p => p.id === 'milk')
  assert.ok(recharge)
  assert.equal(recharge.unit, 'BDT')
  const legacyReceipt = makeReceipt({ ...migrated, lines: [{ productId: 'milk', quantity: 1000 }] }, 100, 'cash')
  legacyReceipt.lines = [{ productId: 'milk', quantity: 1000, product: { ...recharge, unit: 'pc', price: 9000 } }]
  assert.equal(stockFor(recharge, [legacyReceipt]), recharge.stock - 90000)
})

test('service search handles codes, Bengali digits, Bangla, Banglish, and categories', () => {
  const catalog = allProducts()
  assert.equal(searchCatalog(catalog, 'PR103')[0].id, 'photocopy-bw')
  assert.equal(searchCatalog(catalog, 'PR১০৩')[0].id, 'photocopy-bw')
  assert.equal(searchCatalog(catalog, 'ফটোকপি')[0].category, 'printing')
  assert.equal(searchCatalog(catalog, 'photostat')[0].id, 'photocopy-bw')
  assert.equal(searchCatalog(catalog, 'সিভি')[0].id, 'cv-design')
  assert.equal(searchCatalog(catalog, 'university admission')[0].id, 'university-apply')
  assert.equal(searchCatalog(catalog, 'nid correction')[0].id, 'nid-correction')
  assert.equal(searchCatalog(catalog, 'GV404')[0].id, 'epassport-apply')
  assert.equal(searchCatalog(catalog, 'xyz987completelynonexistent').length, 0)
  assert.ok(searchCatalog(catalog, '', 'applications').every(p => p.category === 'applications'))
})

test('user-added variants remain searchable and archived entries stay hidden', () => {
  const groupId = 'grp-12345678-P900'
  const first: Product = { ...findProduct('print-pdf-bw'), id: 'custom-small', code: 'P900-S', en: 'Poster print', bn: 'পোস্টার প্রিন্ট', groupId, variantName: 'Small', variantNameBn: 'ছোট' }
  const second: Product = { ...first, id: 'custom-large', code: 'P900-L', variantName: 'Large', variantNameBn: 'বড়' }
  const catalog = allProducts([first, second])
  assert.equal(displayCatalogProducts(catalog).filter(p => p.groupId === groupId).length, 1)
  assert.equal(getProductVariants(first, catalog).length, 2)
  assert.equal(searchCatalog(catalog, 'P900')[0].groupId, groupId)
  assert.equal(searchCatalog(catalog, 'P900-L')[0].groupId, groupId)
  assert.ok(scoreProductVariant(second, 'P900-L') > scoreProductVariant(first, 'P900-L'))
  assert.equal(searchCatalog(catalog, 'Large')[0].groupId, groupId)
  assert.equal(searchCatalog(allProducts([{ ...first, archived: true }, { ...second, archived: true }]), 'P900').length, 0)
})

test('custom service is found across category tabs and report windows remain accurate', () => {
  const item: Product = { ...findProduct('print-pdf-bw'), id: 'custom-a3', code: 'PR199', en: 'A3 poster print', bn: 'এ৩ পোস্টার প্রিন্ট', category: 'printing' }
  const catalog = allProducts([item])
  assert.equal(searchCatalog(catalog, 'PR199', 'recent', catalog.slice(0, 10))[0].id, item.id)
  assert.equal(searchCatalog(catalog, 'poster', 'documents')[0].id, item.id)
  assert.ok(searchCatalog(catalog, '', 'printing').some(p => p.id === item.id))
  assert.ok(!searchCatalog(catalog, '', 'documents').some(p => p.id === item.id))

  const reference = new Date('2026-10-08T14:30:00.000Z')
  const receipt = makeReceipt(saleState, 45000, 'cash')
  const recent = { ...receipt, id: 'recent', createdAt: '2026-10-08T10:00:00.000Z' }
  const twoDaysAgo = { ...receipt, id: 'two-days', createdAt: '2026-10-06T12:00:00.000Z' }
  const fiveDaysAgo = { ...receipt, id: 'five-days', createdAt: '2026-10-03T12:00:00.000Z' }
  const previousMonth = { ...receipt, id: 'previous-month', createdAt: '2026-09-25T12:00:00.000Z' }
  const receipts = [recent, twoDaysAgo, fiveDaysAgo, previousMonth]
  assert.deepEqual(filterReceiptsByWindow(receipts, 'today', reference).map(r => r.id), ['recent'])
  assert.deepEqual(filterReceiptsByWindow(receipts, '3days', reference).map(r => r.id), ['recent', 'two-days'])
  assert.deepEqual(filterReceiptsByWindow(receipts, '7days', reference).map(r => r.id), ['recent', 'two-days', 'five-days'])
  assert.deepEqual(filterReceiptsByWindow(receipts, 'month', reference).map(r => r.id), ['recent', 'two-days', 'five-days'])
})

test('customer ledger includes old due, sale due, loans, and payments', () => {
  const customer: Customer = { id: 'new-customer', en: 'Rafiqul Islam', bn: 'রফিকুল ইসলাম', phone: '01811 111222', creditLimit: 1000000, openingBalance: 20000 }
  const receipt = makeReceipt({ ...saleState, customCustomers: [customer], customerId: customer.id }, 30000, 'cash')
  const transactions: AccountTransaction[] = [
    { id: 'loan', customerId: customer.id, type: 'loan', amount: 50000, createdAt: new Date().toISOString() },
    { id: 'payment', customerId: customer.id, type: 'payment', amount: 40000, createdAt: new Date().toISOString() },
  ]
  const balance = customerBalance(customer, [receipt], transactions)
  assert.equal(balance.totalDue, 45000)
  assert.equal(balance.loan, 50000)
  assert.equal(balance.totalPaid, 40000)
  assert.equal(balance.availableCredit, 955000)
  assert.equal(allCustomers([customer]).length, 1)
})
