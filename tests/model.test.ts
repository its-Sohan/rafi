import test from 'node:test'
import assert from 'node:assert/strict'
import { allCustomers, customerBalance, customerLedger, filterReceiptsByWindow, findProduct, initialState, lineTotal, makeReceipt, migrateShopState, parseMoney, parseQuantity, quantityWithUnit, stockFor, subtotal, type AccountTransaction } from '../src/model.ts'

test('quantities use scaled integers and reject fractional pieces', () => {
  assert.equal(parseQuantity('0.750', 'kg'), 750)
  assert.equal(parseQuantity('2.5', 'kg'), 2500)
  assert.equal(parseQuantity('2.5', 'pc'), null)
  for (const value of ['0', '-2', '1e3', '0.0001', 'NaN']) assert.equal(parseQuantity(value, 'kg'), null)
})
test('money and weighted totals round once at the line boundary', () => {
  assert.equal(parseMoney('135.25'), 13525)
  assert.equal(parseMoney('135.251'), null)
  assert.equal(lineTotal(13500, 750), 10125)
  assert.equal(lineTotal(12345, 333), 4111)
  assert.equal(subtotal(initialState.lines), 30600)
})
test('recharge services use a money-denominated quantity instead of pieces', () => {
  const recharge = findProduct('milk')
  const meterTopUp = findProduct('salt')
  assert.equal(recharge.unit, 'BDT')
  assert.equal(meterTopUp.unit, 'BDT')
  assert.equal(parseQuantity('500', recharge.unit), 500000)
  assert.equal(parseQuantity('500.25', recharge.unit), 500250)
  assert.equal(parseQuantity('500.251', recharge.unit), null)
  assert.equal(lineTotal(recharge.price, 500000), 50000)
  assert.equal(quantityWithUnit(500250, recharge.unit), '৳ 500.25')
})
test('legacy fixed-denomination recharge data migrates to monetary balances', () => {
  const migrated = migrateShopState({
    ...initialState,
    version: undefined,
    lines: [{ productId: 'milk', quantity: 2000 }, { productId: 'rice', quantity: 1000 }],
  })
  assert.equal(migrated.version, 2)
  assert.deepEqual(migrated.lines, [
    { productId: 'milk', quantity: 180000 },
    { productId: 'rice', quantity: 1000 },
  ])

  const recharge = findProduct('milk')
  const legacyReceipt = makeReceipt(initialState, 50000, 'cash')
  legacyReceipt.lines = [{
    productId: 'milk',
    quantity: 1000,
    product: { ...recharge, unit: 'pc', price: 9000, cost: 8800 },
  }]
  assert.equal(stockFor(recharge, [legacyReceipt]), recharge.stock - 90000)
})
test('cash sale records change, snapshots prices, and reduces stock', () => {
  const receipt = makeReceipt(initialState, 50000, 'cash')
  assert.equal(receipt.total, 30600)
  assert.equal(receipt.paid, 30600)
  assert.equal(receipt.change, 19400)
  assert.equal(receipt.due, 0)
  assert.equal(stockFor(findProduct('rice'), [receipt]), 123000)
  assert.notEqual(receipt.lines[0].product, findProduct('rice'))
})
test('customer dues require a named customer; electronic payments cannot give change', () => {
  assert.throws(() => makeReceipt(initialState, 10000, 'cash'), /customer/)
  const receipt = makeReceipt({ ...initialState, customerId: 'c1', discount: 600 }, 20000, 'mobile')
  assert.equal(receipt.total, 30000)
  assert.equal(receipt.due, 10000)
  assert.equal(receipt.change, 0)
  assert.throws(() => makeReceipt(initialState, 50000, 'mobile'), /overpayment/)
})
test('empty bills and invalid payment amounts cannot become receipts', () => {
  assert.throws(() => makeReceipt({ ...initialState, lines: [] }, 0, 'cash'), /empty/)
  assert.throws(() => makeReceipt(initialState, -1, 'cash'), /amount/)
})
test('inventory unit cost, margin, and custom provisioned items calculate accurately', () => {
  const rice = findProduct('rice')
  assert.equal(rice.cost, 6200)
  assert.equal(rice.price, 7200)
  assert.equal(rice.price - (rice.cost ?? 0), 1000)
  assert.equal(rice.purchased, 125000)

  // Custom provisioned item
  const customItem = {
    id: 'p-custom-1',
    code: '999',
    en: 'Spices',
    bn: 'মসলা',
    detail: 'Mix pack',
    detailBn: 'মিক্স প্যাক',
    category: 'staples' as const,
    unit: 'pc' as const,
    price: 5000, // 50.00 BDT
    cost: 3500,  // 35.00 BDT (Margin: 15.00 BDT = 30%)
    stock: 20000,
    purchased: 20000,
    art: 'rice' as const,
    color: '#ccc',
  }
  const stateWithCustom = {
    ...initialState,
    lines: [{ productId: 'p-custom-1', quantity: 2000 }],
    customProducts: [customItem],
  }
  const receipt = makeReceipt(stateWithCustom, 10000, 'cash')
  assert.equal(receipt.total, 10000)
  assert.equal(stockFor(customItem, [receipt]), 18000)
})

test('filterReceiptsByWindow filters accurately across today, 3 days, 7 days, and month', () => {
  const baseTime = new Date('2026-10-08T14:30:00.000Z')
  const rToday = { ...makeReceipt(initialState, 50000, 'cash'), id: 'r-today', createdAt: '2026-10-08T10:00:00.000Z' }
  const r2DaysAgo = { ...makeReceipt(initialState, 50000, 'cash'), id: 'r-2days', createdAt: '2026-10-06T12:00:00.000Z' }
  const r5DaysAgo = { ...makeReceipt(initialState, 50000, 'cash'), id: 'r-5days', createdAt: '2026-10-03T12:00:00.000Z' }
  const rLastMonth = { ...makeReceipt(initialState, 50000, 'cash'), id: 'r-lastmonth', createdAt: '2026-09-25T12:00:00.000Z' }

  const receipts = [rToday, r2DaysAgo, r5DaysAgo, rLastMonth]

  const todayList = filterReceiptsByWindow(receipts, 'today', baseTime)
  assert.equal(todayList.length, 1)
  assert.equal(todayList[0].id, 'r-today')

  const threeDaysList = filterReceiptsByWindow(receipts, '3days', baseTime)
  assert.equal(threeDaysList.length, 2)
  assert.deepEqual(threeDaysList.map(r => r.id), ['r-today', 'r-2days'])

  const sevenDaysList = filterReceiptsByWindow(receipts, '7days', baseTime)
  assert.equal(sevenDaysList.length, 3)
  assert.deepEqual(sevenDaysList.map(r => r.id), ['r-today', 'r-2days', 'r-5days'])

  const monthList = filterReceiptsByWindow(receipts, 'month', baseTime)
  assert.equal(monthList.length, 3)
  assert.deepEqual(monthList.map(r => r.id), ['r-today', 'r-2days', 'r-5days'])
})

test('customer provisioning, balance calculations, dues, loans, and credit adjustments', () => {
  const newCust = {
    id: 'c-test-1',
    en: 'Rafiqul Islam',
    bn: 'রফিকুল ইসলাম',
    phone: '01811 111222',
    creditLimit: 1000000, // 10,000 BDT
    openingBalance: 20000, // 200 BDT
  }

  const all = allCustomers([newCust])
  assert.equal(all.some(c => c.id === 'c-test-1'), true)

  // Sale with due
  const receiptWithDue = {
    ...makeReceipt({ ...initialState, customerId: newCust.id, customCustomers: [newCust] }, 15000, 'cash'),
    id: 'r-due-1',
    due: 15600, // 156 BDT due
    customer: newCust,
  }

  // Loan and payment transactions
  const txLoan: AccountTransaction = {
    id: 'tx-loan-1',
    customerId: newCust.id,
    type: 'loan',
    amount: 50000, // 500 BDT cash advance
    createdAt: new Date().toISOString(),
  }

  const txPayment: AccountTransaction = {
    id: 'tx-pay-1',
    customerId: newCust.id,
    type: 'payment',
    amount: 40000, // 400 BDT repaid
    createdAt: new Date().toISOString(),
  }

  const ledger = customerLedger(newCust.id, [receiptWithDue], [txLoan, txPayment])
  assert.equal(ledger.length, 3)

  // Balance breakdown:
  // opening: 20000
  // sale_due: 15600
  // loan: 50000
  // payment: -40000
  // totalDue = 20000 + 15600 + 50000 - 40000 = 45600 (456.00 BDT)
  // loan = 50000 (500.00 BDT)
  // availableCredit = 1000000 - 45600 = 954400 (9,544.00 BDT)
  const bal = customerBalance(newCust, [receiptWithDue], [txLoan, txPayment])
  assert.equal(bal.totalDue, 45600)
  assert.equal(bal.loan, 50000)
  assert.equal(bal.totalPaid, 40000)
  assert.equal(bal.availableCredit, 954400)
})
