import test from 'node:test'
import assert from 'node:assert/strict'
import { findProduct, initialState, lineTotal, makeReceipt, parseMoney, parseQuantity, stockFor, subtotal } from '../src/model.ts'

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
