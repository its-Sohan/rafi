import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allCustomers, allProducts, customerBalance, displayCatalogProducts, filterReceiptsByWindow, findProduct, getProductVariants,
  initialState, lineTotal, makeReceipt, migrateShopState, parseMoney, parseQuantity, products,
  quantityWithUnit, receiptProfit, scoreProductVariant, searchCatalog, stockFor, subtotal,
  type AccountTransaction, type Customer, type Product, type ShopState,
} from '../src/model.ts'

const saleState: ShopState = {
  ...initialState,
  lines: [{ productId: 'cable-usbc', quantity: 2000 }, { productId: 'charger-25w', quantity: 1000 }],
}

test('Bangladesh shop catalog has unique codes, bilingual names, and separate services', () => {
  assert.equal(products.length, 49)
  assert.equal(displayCatalogProducts().length, 40)
  assert.equal(new Set(products.map(p => p.id)).size, products.length)
  assert.equal(new Set(products.map(p => p.code)).size, products.length)
  assert.deepEqual(new Set(products.map(p => p.category)), new Set(['mobiles', 'computers', 'accessories', 'services']))
  assert.ok(products.every(p => p.en && p.bn && p.detail && p.detailBn && p.price > 0 && p.cost !== undefined))
  assert.ok(products.filter(p => p.category === 'services').every(p => p.trackStock === false && p.stock === 0))
  assert.ok(products.filter(p => p.category !== 'services').every(p => p.trackStock && p.stock > 0))
  assert.equal(initialState.lines.length, 0)
  assert.equal(allCustomers().length, 0)
})

test('money and quantities keep poisha and scaled units exact', () => {
  assert.equal(parseMoney('135.25'), 13525)
  assert.equal(parseMoney('135.251'), null)
  assert.equal(parseQuantity('2.5', 'pc'), null)
  assert.equal(parseQuantity('2.5', 'job'), null)
  assert.equal(parseQuantity('2', 'pc'), 2000)
  assert.equal(parseQuantity('0.750', 'kg'), 750)
  assert.equal(parseQuantity('500.25', 'BDT'), 500250)
  assert.equal(quantityWithUnit(500250, 'BDT'), '৳ 500.25')
  assert.equal(lineTotal(35000, 2000), 70000)
  assert.equal(subtotal(saleState.lines), 195000)
})

test('cash sale snapshots product prices and reduces only matching stocked products', () => {
  const receipt = makeReceipt(saleState, 200000, 'cash')
  assert.equal(receipt.total, 195000)
  assert.equal(receipt.paid, 195000)
  assert.equal(receipt.change, 5000)
  assert.equal(receipt.due, 0)
  assert.equal(stockFor(findProduct('cable-usbc'), [receipt]), 40000)
  assert.equal(stockFor(findProduct('charger-25w'), [receipt]), 23000)
  assert.equal(stockFor(findProduct('mobile-6-128'), [receipt]), 8000)
  assert.notEqual(receipt.lines[0].product, findProduct('cable-usbc'))
  assert.equal(receiptProfit(receipt), 70000)
})

test('repair labour can be billed repeatedly without creating stock or inventory value', () => {
  const service = findProduct('service-cleaning')
  assert.equal(service.unit, 'job')
  const state: ShopState = { ...initialState, lines: [{ productId: service.id, quantity: 2000 }] }
  const receipt = makeReceipt(state, 240000, 'cash')
  assert.equal(receipt.total, 240000)
  assert.equal(receiptProfit(receipt), 160000)
  assert.equal(stockFor(service, [receipt]), 0)
  assert.equal(lineTotal(service.price, stockFor(service, [receipt])), 0)
})

test('built-in brand variants search by family and SKU while keeping stock separate', () => {
  const router = findProduct('router-dual')
  const tenda = findProduct('router-tenda')
  const asus = findProduct('router-asus')
  assert.deepEqual(getProductVariants(router).map(p => p.variantName), ['Standard', 'Tenda', 'ASUS'])
  assert.equal(router.id, 'router-dual')
  assert.equal(searchCatalog(products, 'C207')[0].groupId, router.groupId)
  assert.equal(searchCatalog(products, 'C207-T')[0].groupId, router.groupId)
  assert.ok(scoreProductVariant(tenda, 'C207-T') > scoreProductVariant(router, 'C207-T'))
  assert.equal(searchCatalog(products, 'ASUS')[0].groupId, router.groupId)
  assert.equal(searchCatalog(products, 'টেন্ডা')[0].groupId, router.groupId)
  assert.equal(getProductVariants(findProduct('pendrive-32')).map(p => p.variantName).join(','), 'Standard,Samsung,SanDisk')
  assert.equal(searchCatalog(products, 'SanDisk')[0].groupId, findProduct('pendrive-32').groupId)
  assert.equal(searchCatalog(products, 'C208')[0].groupId, findProduct('camera-hikvision').groupId)
  assert.equal(getProductVariants(findProduct('psu-deepcool')).length, 2)
  assert.ok(products.some(p => p.id === 'cctv-dvr-4'))
  assert.ok(products.some(p => p.id === 'headphones-havit'))
  assert.ok(products.some(p => p.id === 'microsd-64'))

  const receipt = makeReceipt({ ...initialState, lines: [{ productId: tenda.id, quantity: 1000 }] }, tenda.price, 'cash')
  assert.equal(stockFor(tenda, [receipt]), tenda.stock - 1000)
  assert.equal(stockFor(router, [receipt]), router.stock)
  assert.equal(stockFor(asus, [receipt]), asus.stock)
})

test('dues require a customer and electronic payments cannot exceed the bill', () => {
  assert.throws(() => makeReceipt(saleState, 100000, 'cash'), /customer/)
  const customer: Customer = { id: 'client-1', en: 'Shop client', bn: 'দোকানের ক্রেতা', phone: '01700 000000', creditLimit: 500000 }
  const receipt = makeReceipt({ ...saleState, customCustomers: [customer], customerId: customer.id, discount: 5000 }, 150000, 'mobile')
  assert.equal(receipt.total, 190000)
  assert.equal(receipt.due, 40000)
  assert.equal(receipt.change, 0)
  assert.throws(() => makeReceipt(saleState, 200000, 'mobile'), /overpayment/)
  assert.throws(() => makeReceipt(initialState, 0, 'cash'), /empty/)
  assert.throws(() => makeReceipt(saleState, -1, 'cash'), /amount/)
})

test('existing demo draft is cleared while saved sales and account entries remain', () => {
  const migrated = migrateShopState({
    ...initialState,
    version: 2,
    lines: [{ productId: 'rice', quantity: 2000 }, { productId: 'egg', quantity: 6000 }, { productId: 'milk', quantity: 90000 }],
  })
  assert.equal(migrated.version, 3)
  assert.deepEqual(migrated.lines, [])
  assert.deepEqual(migrated.customProducts, [])

  const historicalProduct: Product = { ...findProduct('cable-usbc'), id: 'rice', code: '101', en: 'Exercise book', category: 'staples', price: 7200 }
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
  assert.equal(updated.version, 3)
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

test('old fixed denomination recharge drafts migrate once to a monetary balance', () => {
  const migrated = migrateShopState({
    ...initialState,
    version: undefined,
    lines: [{ productId: 'milk', quantity: 2000 }],
  })
  assert.equal(migrated.version, 3)
  assert.deepEqual(migrated.lines, [{ productId: 'milk', quantity: 180000 }])
  const recharge = migrated.customProducts?.find(p => p.id === 'milk')
  assert.ok(recharge)
  assert.equal(recharge.unit, 'BDT')
  const legacyReceipt = makeReceipt({ ...migrated, lines: [{ productId: 'milk', quantity: 1000 }] }, 100, 'cash')
  legacyReceipt.lines = [{ productId: 'milk', quantity: 1000, product: { ...recharge, unit: 'pc', price: 9000 } }]
  assert.equal(stockFor(recharge, [legacyReceipt]), recharge.stock - 90000)
})

test('new catalog search handles codes, Bengali digits, Bangla, Banglish, and typos', () => {
  const catalog = allProducts()
  assert.equal(searchCatalog(catalog, 'A302')[0].id, 'cable-usbc')
  assert.equal(searchCatalog(catalog, 'A৩০২')[0].id, 'cable-usbc')
  assert.equal(searchCatalog(catalog, 'ল্যাপটপ')[0].category, 'computers')
  assert.equal(searchCatalog(catalog, 'charjar')[0].id, 'charger-25w')
  assert.equal(searchCatalog(catalog, 'keybord')[0].id, 'keyboard-usb')
  assert.equal(searchCatalog(catalog, 'usb cable')[0].id, 'cable-usbc')
  assert.equal(searchCatalog(catalog, 'S404')[0].id, 'service-cleaning')
  assert.equal(searchCatalog(catalog, 'xyz987completelynonexistent').length, 0)
  assert.ok(searchCatalog(catalog, '', 'services').every(p => p.category === 'services'))
})

test('custom accessories and variants remain searchable and archived items stay hidden', () => {
  const groupId = 'grp-12345678-A500'
  const first: Product = { ...findProduct('cable-usbc'), id: 'custom-black', code: 'A500-B', en: 'Phone case', bn: 'ফোন কভার', groupId, variantName: 'Black', variantNameBn: 'কালো' }
  const second: Product = { ...first, id: 'custom-blue', code: 'A500-U', variantName: 'Blue', variantNameBn: 'নীল' }
  const catalog = allProducts([first, second])
  assert.equal(displayCatalogProducts(catalog).filter(p => p.groupId === groupId).length, 1)
  assert.equal(getProductVariants(first, catalog).length, 2)
  assert.equal(searchCatalog(catalog, 'A500')[0].groupId, groupId)
  assert.equal(searchCatalog(catalog, 'A500-U')[0].groupId, groupId)
  assert.equal(searchCatalog(catalog, 'Blue')[0].groupId, groupId)
  assert.equal(searchCatalog(allProducts([{ ...first, archived: true }, { ...second, archived: true }]), 'A500').length, 0)
})

test('new custom item is found across category tabs and report windows remain accurate', () => {
  const item: Product = { ...findProduct('cable-usbc'), id: 'custom-ssd', code: 'C299', en: 'Portable SSD', bn: 'পোর্টেবল এসএসডি', category: 'computers' }
  const catalog = allProducts([item])
  assert.equal(searchCatalog(catalog, 'C299', 'recent', catalog.slice(0, 10))[0].id, item.id)
  assert.equal(searchCatalog(catalog, 'portable', 'mobiles')[0].id, item.id)
  assert.ok(searchCatalog(catalog, '', 'computers').some(p => p.id === item.id))
  assert.ok(!searchCatalog(catalog, '', 'mobiles').some(p => p.id === item.id))

  const reference = new Date('2026-10-08T14:30:00.000Z')
  const receipt = makeReceipt(saleState, 195000, 'cash')
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
  const receipt = makeReceipt({ ...saleState, customCustomers: [customer], customerId: customer.id }, 100000, 'cash')
  const transactions: AccountTransaction[] = [
    { id: 'loan', customerId: customer.id, type: 'loan', amount: 50000, createdAt: new Date().toISOString() },
    { id: 'payment', customerId: customer.id, type: 'payment', amount: 40000, createdAt: new Date().toISOString() },
  ]
  const balance = customerBalance(customer, [receipt], transactions)
  assert.equal(balance.totalDue, 125000)
  assert.equal(balance.loan, 50000)
  assert.equal(balance.totalPaid, 40000)
  assert.equal(balance.availableCredit, 875000)
  assert.equal(allCustomers([customer]).length, 1)
})
