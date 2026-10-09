import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, PixelMark, ProductArt } from './Icons'
import {
  allProducts,
  allCustomers,
  customers,
  customerBalance,
  customerLedger,
  findProductIn,
  initialState,
  isMoneyUnit,
  lineTotal,
  lineProfit,
  makeReceipt,
  money,
  parseMoney,
  parseQuantity,
  productCost,
  products,
  quantityWithUnit,
  stockFor,
  subtotal,
  receiptProfit,
  filterReceiptsByWindow,
  unitMargin,
  unitMarginPercent,
  unitText,
  getProductVariants,
  displayCatalogProducts,
  searchCatalog,
  scoreProductVariant,
  cleanSearchText,
  type Category,
  type Customer,
  type AccountTransaction,
  type Lang,
  type Line,
  type Product,
  type Receipt,
  type ReportWindow,
  type ShopState,
} from './model'
import { downloadJson, loadState, saveState } from './storage'
import { translator, type CopyKey } from './i18n'
import type { OfflineStatus } from './offline'
import { useLedgerMotion } from './useLedgerMotion'

type View = 'sales' | 'inventory' | 'accounts' | 'reports'
type Dialog = 'payment' | 'customer' | 'discount' | 'shortcuts' | 'settings' | 'clear' | 'receipt' | 'edit' | 'newItem' | 'newCustomer' | 'customerProfile' | 'addTx' | 'itemStats' | null
const receiptNumber = (n: number) => String(n).padStart(4, '0')
const dayKey = (date: string | Date) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })
const rateText = (product: Product) => `৳ ${money(product.price)} / ${isMoneyUnit(product.unit) ? '৳1' : product.unit}`

function FittedQuantity({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    const button = element?.parentElement
    if (!element || !button) return
    const fit = () => {
      element.style.fontSize = ''
      const naturalWidth = element.scrollWidth
      const availableWidth = button.clientWidth
      if (naturalWidth > availableWidth && availableWidth > 0) {
        const fontSize = parseFloat(getComputedStyle(element).fontSize)
        element.style.fontSize = `${fontSize * availableWidth / naturalWidth}px`
      }
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(button)
    return () => observer.disconnect()
  }, [value])
  return <span className="bill-qty-value" ref={ref}>{value}</span>
}

function Modal({ children, title, closeLabel, onClose, className = '', canClose = true }: { children: ReactNode; title: string; closeLabel: string; onClose: () => void; className?: string; canClose?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current!
    const focusable = () => [...node.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, [tabindex="0"]')]
    const input = node.querySelector<HTMLInputElement>('input:not([type="checkbox"]):not([type="radio"]):not(:disabled)')
    const target = node.querySelector<HTMLElement>('[data-initial-focus]') ?? input ?? focusable()[0]
    target?.focus()
    if (target instanceof HTMLInputElement && target.type !== 'checkbox' && target.type !== 'radio') target.select()
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (canClose) onClose() }
      if (event.key === 'Tab') {
        const elements = focusable()
        const first = elements[0], last = elements[elements.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    node.addEventListener('keydown', handle)
    return () => { node.removeEventListener('keydown', handle); previous?.focus() }
  }, [canClose])
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && canClose) onClose() }}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`modal ${className}`}>
      <h2 id={titleId} className="sr-only">{title}</h2>
      <button className="modal-close icon-button" aria-label={closeLabel} onClick={onClose} disabled={!canClose}><Icon name="close"/></button>
      {children}
    </div>
  </div>
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => { try { return localStorage.getItem('hisab-language') === 'bn' ? 'bn' : 'en' } catch { return 'en' } })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('hisab-theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const t = translator(lang)
  const [view, setView] = useState<View>('sales')
  const [state, setState] = useState<ShopState>(initialState)
  const [ready, setReady] = useState(false)
  const [storageStatus, setStorageStatus] = useState<'saving' | 'saved' | 'error'>('saving')
  const [online, setOnline] = useState(navigator.onLine)
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>(() => document.documentElement.dataset.offline as OfflineStatus ?? 'preparing')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('recent')
  const [selected, setSelected] = useState(0)
  const [quantityProduct, setQuantityProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<Product | null>(null)
  const [qty, setQty] = useState('1')
  const [inputError, setInputError] = useState('')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [paymentMethod, setPaymentMethod] = useState<Receipt['method']>('cash')
  const [received, setReceived] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [modalError, setModalError] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null)
  const [justCompleted, setJustCompleted] = useState(false)
  const [reportWindow, setReportWindow] = useState<ReportWindow>('today')
  const [billSelection, setBillSelection] = useState(0)
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null)
  const [showShortcutToast, setShowShortcutToast] = useState(true)
  const searchRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const billRef = useRef<HTMLDivElement>(null)
  const productRefs = useRef<(HTMLButtonElement | null)[]>([])
  const paymentLock = useRef(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    loadState().then(saved => { if (saved?.lines && saved?.receipts) setState(saved); setReady(true) }).catch(() => { setStorageStatus('error'); setReady(true) })
    const timer = setInterval(() => setNow(new Date()), 30000)
    const onOnline = () => setOnline(navigator.onLine)
    const onOfflineStatus = () => setOfflineStatus(document.documentElement.dataset.offline as OfflineStatus)
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOnline)
    window.addEventListener('hisab-offline-status', onOfflineStatus)
    return () => { clearInterval(timer); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOnline); window.removeEventListener('hisab-offline-status', onOfflineStatus) }
  }, [])
  useEffect(() => {
    if (!ready) return
    let current = true
    setStorageStatus('saving')
    saveState(state).then(() => { if (current) setStorageStatus('saved') }).catch(() => { if (current) setStorageStatus('error') })
    return () => { current = false }
  }, [state, ready])
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem('hisab-language', lang) } catch { /* Language can still change for this session. */ } }, [lang])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('hisab-theme', theme) } catch { /* Theme can still change for this session. */ }
  }, [theme])
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 4500); return () => clearTimeout(timer) } }, [toast])
  useEffect(() => { const timer = setTimeout(() => setShowShortcutToast(false), 10_000); return () => clearTimeout(timer) }, [])
  useEffect(() => { setSelected(0) }, [query, category])
  useEffect(() => { if (quantityProduct) { qtyRef.current?.focus(); qtyRef.current?.select() } }, [quantityProduct])
  useEffect(() => { if (ready) searchRef.current?.focus() }, [ready, view])

  const [customProducts, setCustomProducts] = useState<Product[]>(() => state.customProducts ?? [])
  useEffect(() => {
    if (state.customProducts) setCustomProducts(state.customProducts)
  }, [state.customProducts])

  const catalog = allProducts(state.customProducts ?? customProducts)
  const findItem = (id: string) => findProductIn(id, catalog)
  const setProductArchived = (product: Product, archived: boolean) => {
    const current = state.customProducts ?? customProducts
    const updated = [...current.filter(item => item.id !== product.id), { ...product, archived }]
    setState(s => ({ ...s, customProducts: updated }))
    setToast({ text: archived ? `${product.en} discontinued` : `${product.en} restored to sales` })
  }

  // Provisioning form state
  const [newCode, setNewCode] = useState('')
  const [newNameEn, setNewNameEn] = useState('')
  const [newNameBn, setNewNameBn] = useState('')
  const [newDetail, setNewDetail] = useState('')
  const [newCategory, setNewCategory] = useState<Exclude<Category, 'all' | 'recent'>>('staples')
  const [newUnit, setNewUnit] = useState<Product['unit']>('kg')
  const [newPrice, setNewPrice] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newPurchased, setNewPurchased] = useState('')

  // Multi-variant configuration state
  type VariantRow = {
    id: string
    name: string
    nameBn: string
    code: string
    cost: string
    price: string
    stock: string
  }
  const [hasVariants, setHasVariants] = useState(false)
  const [variantRows, setVariantRows] = useState<VariantRow[]>([])

  const openProvisionDialog = () => {
    const nextCode = String(100 + catalog.length + 1)
    setNewCode(nextCode)
    setNewNameEn('')
    setNewNameBn('')
    setNewDetail('')
    setNewCategory('staples')
    setNewUnit('kg')
    setNewPrice('')
    setNewCost('')
    setNewPurchased('10')
    setHasVariants(false)
    setVariantRows([])
    setModalError('')
    openDialog('newItem')
  }

  const createProduct = () => {
    const codeTrim = newCode.trim()
    const enTrim = newNameEn.trim()
    const bnTrim = newNameBn.trim() || enTrim
    const detailTrim = newDetail.trim() || `${newCategory} · loose`
    if (!codeTrim || !enTrim) {
      setModalError(t('fillRequired'))
      return
    }

    if (hasVariants) {
      if (variantRows.length === 0) {
        setModalError('Add at least one variant to continue.')
        return
      }
      const productsToCreate: Product[] = []
      const groupId = `grp-${Date.now()}-${codeTrim}`

      for (let i = 0; i < variantRows.length; i++) {
        const row = variantRows[i]
        const vNameTrim = row.name.trim()
        if (!vNameTrim) {
          setModalError(t('fillRequired'))
          return
        }
        const vCode = row.code.trim() || `${codeTrim}-${i + 1}`
        const vTotalCost = parseMoney(row.cost)
        const vPrice = parseMoney(row.price)
        const vStock = parseQuantity(row.stock, newUnit)

        if (vTotalCost === null || vTotalCost <= 0 || vPrice === null || vPrice <= 0) {
          setModalError(t('invalidAmount'))
          return
        }
        if (vStock === null || vStock <= 0) {
          setModalError(t('invalidQuantity'))
          return
        }

        const vCost = Math.round(vTotalCost * 1000 / vStock)

        const vProd: Product = {
          id: `p-${Date.now()}-${vCode}`,
          code: vCode,
          en: enTrim,
          bn: bnTrim,
          detail: `${vNameTrim} · ${newUnit}`,
          detailBn: `${row.nameBn.trim() || vNameTrim} · ${newUnit}`,
          category: newCategory,
          unit: newUnit,
          price: vPrice,
          cost: vCost,
          stock: vStock,
          purchased: vStock,
          groupId,
          variantName: vNameTrim,
          variantNameBn: row.nameBn.trim() || vNameTrim,
          art: 'rice',
          color: '#e4e7d8',
        }
        productsToCreate.push(vProd)
      }

      const updatedCustom = [...(state.customProducts ?? []), ...productsToCreate]
      setState(s => ({ ...s, customProducts: updatedCustom }))
      closeDialog()
      setToast({ text: t('itemCreated') })
      return
    }

    const parsedPrice = parseMoney(newPrice)
    if (parsedPrice === null || parsedPrice <= 0) {
      setModalError(t('invalidAmount'))
      return
    }
    const parsedTotalCost = parseMoney(newCost)
    if (parsedTotalCost === null || parsedTotalCost <= 0) {
      setModalError(t('invalidAmount'))
      return
    }
    const parsedPurchased = parseQuantity(newPurchased, newUnit)
    if (parsedPurchased === null || parsedPurchased <= 0) {
      setModalError(t('invalidQuantity'))
      return
    }
    const parsedCost = Math.round(parsedTotalCost * 1000 / parsedPurchased)

    const existing = catalog.find(p => p.code.toLowerCase() === codeTrim.toLowerCase())

    if (existing) {
      // Weighted Average Cost merge
      const currentStock = stockFor(existing, state.receipts)
      const currentUnitCost = productCost(existing)
      const incomingStock = parsedPurchased
      const incomingUnitCost = parsedCost
      const totalStock = currentStock + incomingStock

      const currentCostValue = (currentStock / 1000) * currentUnitCost
      const incomingCostValue = (incomingStock / 1000) * incomingUnitCost
      const blendedUnitCost = totalStock > 0 ? Math.round((currentCostValue + incomingCostValue) / (totalStock / 1000)) : incomingUnitCost

      const mergedProd: Product = {
        ...existing,
        en: enTrim,
        bn: bnTrim,
        detail: detailTrim,
        detailBn: detailTrim,
        category: newCategory,
        unit: newUnit,
        price: parsedPrice,
        cost: blendedUnitCost,
        stock: existing.stock + incomingStock,
        purchased: (existing.purchased ?? existing.stock) + incomingStock,
      }

      const prevCustom = state.customProducts ?? []
      const updatedCustom = prevCustom.some(p => p.id === existing.id)
        ? prevCustom.map(p => p.id === existing.id ? mergedProd : p)
        : [...prevCustom, mergedProd]

      setState(s => ({ ...s, customProducts: updatedCustom }))
      closeDialog()
      setToast({ text: t('itemRestocked') })
      return
    }

    const newProd: Product = {
      id: `p-${Date.now()}-${codeTrim}`,
      code: codeTrim,
      en: enTrim,
      bn: bnTrim,
      detail: detailTrim,
      detailBn: detailTrim,
      category: newCategory,
      unit: newUnit,
      price: parsedPrice,
      cost: parsedCost,
      stock: parsedPurchased,
      purchased: parsedPurchased,
      art: 'rice',
      color: '#e4e7d8',
    }

    const updatedCustom = [...(state.customProducts ?? []), newProd]
    setState(s => ({ ...s, customProducts: updatedCustom }))
    closeDialog()
    setToast({ text: t('itemCreated') })
  }

  // Customer provisioning and profile state
  const customerCatalog = allCustomers(state.customCustomers)
  const matchingCustomers = customerCatalog.filter(c => `${c.en} ${c.bn} ${c.phone}`.toLowerCase().includes(customerQuery.toLowerCase()))
  const [newCustEn, setNewCustEn] = useState('')
  const [newCustBn, setNewCustBn] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('5000')
  const [newCustOpeningDue, setNewCustOpeningDue] = useState('0')
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null)
  const [activeReportProduct, setActiveReportProduct] = useState<Product | null>(null)
  const [reportsSubView, setReportsSubView] = useState<'sales' | 'products'>('sales')

  // Transaction record modal state
  const [txType, setTxType] = useState<AccountTransaction['type']>('payment')
  const [txAmount, setTxAmount] = useState('')
  const [txNote, setTxNote] = useState('')

  const openCustomerProvisionDialog = () => {
    setNewCustEn('')
    setNewCustBn('')
    setNewCustPhone('')
    setNewCustCreditLimit('5000')
    setNewCustOpeningDue('0')
    setModalError('')
    openDialog('newCustomer')
  }

  const createCustomer = () => {
    const enTrim = newCustEn.trim()
    const bnTrim = newCustBn.trim() || enTrim
    const phoneTrim = newCustPhone.trim()
    if (!enTrim || !phoneTrim) {
      setModalError(t('fillRequired'))
      return
    }
    if (customerCatalog.some(c => c.phone.replaceAll(' ', '') === phoneTrim.replaceAll(' ', ''))) {
      setModalError(t('phoneExists'))
      return
    }
    const parsedCreditLimit = parseMoney(newCustCreditLimit) ?? 500000
    const parsedOpeningDue = parseMoney(newCustOpeningDue) ?? 0

    const newCust: Customer = {
      id: `c-${Date.now()}`,
      en: enTrim,
      bn: bnTrim,
      phone: phoneTrim,
      creditLimit: parsedCreditLimit,
      openingBalance: parsedOpeningDue,
    }

    const updated = [...(state.customCustomers ?? []), newCust]
    setState(s => ({ ...s, customCustomers: updated }))
    closeDialog()
    setToast({ text: t('customerCreated') })
  }

  const openCustomerProfile = (c: Customer) => {
    setActiveCustomer(c)
    openDialog('customerProfile')
  }

  const openAddTransaction = (type: AccountTransaction['type']) => {
    setTxType(type)
    setTxAmount('')
    setTxNote('')
    setModalError('')
    openDialog('addTx')
  }

  const recordTransaction = () => {
    if (!activeCustomer) return
    const parsed = parseMoney(txAmount)
    if (parsed === null || parsed <= 0) {
      setModalError(t('invalidAmount'))
      return
    }

    const newTx: AccountTransaction = {
      id: `tx-${Date.now()}`,
      customerId: activeCustomer.id,
      type: txType,
      amount: parsed,
      createdAt: new Date().toISOString(),
      note: txNote.trim() || (txType === 'payment' ? t('txPayment') : txType === 'loan' ? t('txLoan') : t('txAdjustment')),
    }

    const updated = [...(state.transactions ?? []), newTx]
    setState(s => ({ ...s, transactions: updated }))
    closeDialog()
    setToast({ text: txType === 'payment' ? t('paymentReceived') : txType === 'loan' ? t('loanDisbursed') : t('txSaved') })
  }

  // Helper to retrieve all variants for a product
  const getVariants = (p: Product): Product[] => getProductVariants(p, catalog)
  const getSaleVariants = (p: Product): Product[] => getVariants(p).filter(item => !item.archived)

  // Deduplicate products that belong to the same groupId in the sales catalog view
  const displayCatalog = displayCatalogProducts(catalog)

  // Extract last 10 unique sold items from completed receipts (most recently sold first)
  const recentProducts: Product[] = (() => {
    const seen = new Set<string>()
    const list: Product[] = []
    // Iterate from newest receipt to oldest
    for (let i = state.receipts.length - 1; i >= 0; i--) {
      const receipt = state.receipts[i]
      for (let j = receipt.lines.length - 1; j >= 0; j--) {
        const line = receipt.lines[j]
        const found = findItem(line.productId)
        if (found && !found.archived) {
          const groupKey = found.groupId ?? found.id
          if (!seen.has(groupKey)) {
            seen.add(groupKey)
            list.push(found)
            if (list.length >= 10) break
          }
        }
      }
      if (list.length >= 10) break
    }
    // If fewer than 10 have been sold, backfill with default display catalog items up to 10
    if (list.length < 10) {
      for (const p of displayCatalog) {
        const groupKey = p.groupId ?? p.id
        if (!seen.has(groupKey)) {
          seen.add(groupKey)
          list.push(p)
          if (list.length >= 10) break
        }
      }
    }
    return list
  })()

  const filtered = searchCatalog(catalog, query, category, recentProducts)

  const billSubtotal = subtotal(state.lines, catalog)
  const billTotal = Math.max(0, billSubtotal - state.discount)
  const motionRoot = useLedgerMotion({ lines: state.lines, total: billTotal, receipts: state.receipts.length, ready, toast })
  const customer = customerCatalog.find(c => c.id === state.customerId)
  const todayReceipts = state.receipts.filter(r => dayKey(r.createdAt) === dayKey(now))
  const todaySales = todayReceipts.reduce((s, r) => s + r.total, 0)
  const todayPaid = todayReceipts.reduce((s, r) => s + r.paid, 0)
  const windowReceipts = filterReceiptsByWindow(state.receipts, reportWindow, now)
  const windowSales = windowReceipts.reduce((s, r) => s + r.total, 0)
  const windowPaid = windowReceipts.reduce((s, r) => s + r.paid, 0)
  const windowProfit = windowReceipts.reduce((s, r) => s + receiptProfit(r), 0)
  const pendingDue = customerCatalog.reduce((sum, c) => sum + customerBalance(c, state.receipts, state.transactions).totalDue, 0)
  const paidAmount = parseMoney(received) ?? 0
  const goSearch = () => { setQuantityProduct(null); setSelectedVariant(null); setInputError(''); requestAnimationFrame(() => searchRef.current?.focus()) }
  const closeDialog = () => { if (!busy) { setDialog(null); setModalError('') } }
  const openDialog = (next: Dialog) => { setModalError(''); setDialog(next) }
  const openPayment = () => {
    if (!state.lines.length || !ready) return
    setReceived((billTotal / 100).toFixed(2)); setPaymentMethod('cash'); openDialog('payment')
  }
  const notify = (key: CopyKey) => setToast({ text: t(key) })
  const chooseProduct = (product: Product) => {
    setQuantityProduct(product)
    const variants = getSaleVariants(product)
    const qTrim = query.trim()
    const matchingVariant = (qTrim ? variants.map(v => ({ v, score: scoreProductVariant(v, qTrim) })).filter(item => item.score > 0).sort((a, b) => b.score - a.score)[0]?.v : null) ?? variants[0] ?? product
    setSelectedVariant(matchingVariant)
    setQty(isMoneyUnit(matchingVariant.unit) ? '100' : '1')
    setInputError('')
    requestAnimationFrame(() => qtyRef.current?.focus())
  }
  const addProduct = () => {
    const targetProduct = selectedVariant ?? quantityProduct
    if (!targetProduct) return
    const parsed = parseQuantity(qty, targetProduct.unit)
    if (parsed === null) { setInputError(t('invalidQuantity')); return }
    const existing = state.lines.find(l => l.productId === targetProduct.id)?.quantity ?? 0
    if (existing + parsed > stockFor(targetProduct, state.receipts)) { setInputError(t('noStock')); return }
    setState(previous => ({ ...previous, lines: previous.lines.some(l => l.productId === targetProduct.id)
      ? previous.lines.map(l => l.productId === targetProduct.id ? { ...l, quantity: l.quantity + parsed } : l)
      : [...previous.lines, { productId: targetProduct.id, quantity: parsed }] }))
    notify('productAdded'); setQuery(''); goSearch()
  }
  const removeLine = (index: number) => {
    const removed = state.lines[index]
    const previousReceiptCount = state.receipts.length
    const previousDiscount = state.discount
    const lines = state.lines.filter((_, i) => i !== index)
    setState(s => ({ ...s, lines, discount: Math.min(s.discount, Math.max(0, subtotal(lines, catalog) - 1)) }))
    setBillSelection(Math.max(0, index - 1))
    setToast({ text: t('productRemoved'), undo: () => setState(s => {
      if (s.receipts.length !== previousReceiptCount) return s
      const restored = [...s.lines]
      const existing = restored.findIndex(l => l.productId === removed.productId)
      if (existing >= 0) restored[existing] = { ...restored[existing], quantity: restored[existing].quantity + removed.quantity }
      else restored.splice(Math.min(index, restored.length), 0, removed)
      return { ...s, lines: restored, discount: Math.min(Math.max(s.discount, previousDiscount), Math.max(0, subtotal(restored, catalog) - 1)) }
    }) })
  }
  const editLine = (index: number) => { setBillSelection(index); setQty(String(state.lines[index].quantity / 1000)); openDialog('edit') }
  const updateLine = () => {
    const line = state.lines[billSelection]
    if (!line) return
    const product = findItem(line.productId)
    const parsed = parseQuantity(qty, product.unit)
    if (parsed === null) { setModalError(t('invalidQuantity')); return }
    if (parsed > stockFor(product, state.receipts)) { setModalError(t('noStock')); return }
    const lines = state.lines.map((l, i) => i === billSelection ? { ...l, quantity: parsed } : l)
    setState(s => ({ ...s, lines, discount: Math.min(s.discount, Math.max(0, subtotal(lines, catalog) - 1)) }))
    closeDialog()
  }
  const completeSale = async () => {
    if (paymentLock.current) return
    const value = parseMoney(received)
    if (value === null) { setModalError(t('invalidAmount')); return }
    let receipt: Receipt
    try { receipt = makeReceipt(state, value, paymentMethod) }
    catch (error) {
      const key: Record<string, CopyKey> = { customer: 'customerRequired', overpayment: 'overpayment', empty: 'emptyError', amount: 'invalidAmount' }
      setModalError(t(key[(error as Error).message] ?? 'invalidAmount')); return
    }
    const next: ShopState = { ...state, version: 2, lines: [], discount: 0, customerId: null, receipts: [...state.receipts, receipt] }
    paymentLock.current = true; setBusy(true)
    try {
      await saveState(next)
      setState(next); setActiveReceipt(receipt); setJustCompleted(true); setDialog('receipt'); setModalError(''); setQuery(''); setQuantityProduct(null); setToast(null)
      if ('storage' in navigator) navigator.storage.persist?.().catch(() => {})
    } catch { setModalError(t('saveError')); setStorageStatus('error') }
    finally { paymentLock.current = false; setBusy(false) }
  }
  const exportBackup = () => { downloadJson({ version: 1, exportedAt: new Date().toISOString(), products: catalog, customers: customerCatalog, state }, `hisab-backup-${dayKey(now)}.json`); notify('backupExported') }
  const exportCsv = () => {
    const listToExport = windowReceipts
    const rows = [['Receipt', 'Date (UTC)', 'Total (BDT)', 'Profit (BDT)', 'Paid (BDT)', 'Due (BDT)', 'Method'], ...listToExport.map(r => [receiptNumber(r.number), r.createdAt, (r.total / 100).toFixed(2), (receiptProfit(r) / 100).toFixed(2), (r.paid / 100).toFixed(2), (r.due / 100).toFixed(2), r.method])]
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `hisab-sales-${reportWindow}-${dayKey(now)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (dialog) return
      if (event.key === 'F2') { event.preventDefault(); setView('sales'); goSearch(); return }
      if (event.key === '?' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); openDialog('shortcuts'); return }
      if (view !== 'sales') return
      if (event.altKey && event.key.toLowerCase() === 'b') { event.preventDefault(); billRef.current?.focus(); return }
      if (event.key === '+' && !event.ctrlKey && !event.metaKey) { event.preventDefault(); openPayment(); return }
      if (event.key === 'Escape') { event.preventDefault(); setQuery(''); goSearch() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  })

  const renderReceipt = (receipt: Receipt) => <div className="receipt-paper" id="print-receipt">
    <div className="receipt-brand"><PixelMark small/><strong>hisab<span>.</span></strong></div>
    <p className="receipt-shop">{t('shop')}</p>
    <div className="receipt-meta"><span>#{receiptNumber(receipt.number)}</span><span>{new Date(receipt.createdAt).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })}</span></div>
    <p className="receipt-customer">{receipt.customer ? receipt.customer[lang] : t('walkIn')}</p>
    <div className="receipt-items">{receipt.lines.map(l => <div key={l.productId}><span>{l.product[lang]}<small>{quantityWithUnit(l.quantity, l.product.unit)} × {rateText(l.product)}</small></span><strong>{money(lineTotal(l.product.price, l.quantity))}</strong></div>)}</div>
    <div className="receipt-total"><span>{t('subtotal')}</span><span>৳ {money(receipt.subtotal)}</span></div>
    {receipt.discount > 0 && <div className="receipt-total"><span>{t('discount')}</span><span>− {money(receipt.discount)}</span></div>}
    <div className="receipt-total grand"><strong>{t('total')}</strong><strong>৳ {money(receipt.total)}</strong></div>
    <div className="receipt-total"><span>{t('paid')} · {t(receipt.method)}</span><span>{money(receipt.paid)}</span></div>
    {receipt.change > 0 && <div className="receipt-total"><span>{t('change')}</span><span>{money(receipt.change)}</span></div>}
    {receipt.due > 0 && <div className="receipt-total"><span>{t('due')}</span><span>{money(receipt.due)}</span></div>}
    <p className="receipt-thanks">{t('thanks')}</p><p className="receipt-local">{t('localReceipt')}</p>
  </div>

  return <div ref={motionRoot} className={`app-shell lang-${lang}`}>
    <aside className="sidebar" aria-label="Main navigation">
      <button className="brand-mark" aria-label="Hisab sales counter" onClick={() => setView('sales')}><PixelMark/></button>
      <div className="side-nav">{(['sales', 'inventory', 'accounts', 'reports'] as View[]).map((item, index) => <button key={item} className={`nav-button ${view === item ? 'active' : ''}`} onClick={() => setView(item)} aria-label={t(item)} aria-current={view === item ? 'page' : undefined} title={t(item)}><Icon name={item} size={23}/><span>{t(item)}</span><i className="nav-index">0{index + 1}</i></button>)}</div>
      <div className="side-bottom"><button className="nav-button" onClick={() => openDialog('shortcuts')} title={t('shortcuts')} aria-label={t('shortcuts')}><Icon name="keyboard" size={22}/></button><button className="nav-button" onClick={() => openDialog('settings')} title={t('settings')} aria-label={t('settings')}><Icon name="settings" size={22}/></button><div className="avatar" aria-label="Shop owner">S</div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="wordmark">hisab<span>.</span></div>
        <span className="top-divider"/>
        <div className="shop-label"><Icon name="inventory" size={16}/><span>{t('shop')}</span><Icon name="down" size={12}/></div>
        <div className="topbar-right">
          <span className={`connection ${online ? '' : 'offline'}`}><i/>{t(online ? 'online' : 'offline')}</span>
          <button className="language-toggle" onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} aria-label={lang === 'en' ? 'Switch to Bangla' : 'Switch to English'}>
            <span className={lang === 'en' ? 'selected' : ''}>EN</span>
            <span className="toggle-line"/>
            <span className={lang === 'bn' ? 'selected' : ''}>বাং</span>
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(curr => (curr === 'dark' ? 'light' : 'dark'))}
            aria-label={t('toggleTheme')}
            title={`${t('appearance')}: ${theme === 'dark' ? t('dark') : t('light')}`}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="page-heading"><div><div className="eyebrow"><span className="tab-heading-icon"><Icon name={view} size={12}/></span>{t('workspace')}<span className="eyebrow-slash">/</span>0{(['sales', 'inventory', 'accounts', 'reports'] as View[]).indexOf(view) + 1}</div><h1>{t(view)}<span className="heading-dot">.</span></h1><p>{view === 'sales' ? t('welcome') : t(view === 'inventory' ? 'catalogHint' : view === 'accounts' ? 'balanceHint' : 'reportHint')}</p></div><div className="heading-right"><span className="today-summary">{t('today')}<strong>৳ {money(todaySales)}</strong><span> / </span>{todayReceipts.length} {t('receiptsToday').toLowerCase()}</span><div className="heading-date">{now.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' })}<span> / </span>{now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false })}</div></div></section>

        {storageStatus === 'error' && <div className="storage-alert" role="alert">{t('storageError')}<button onClick={exportBackup}>{t('export')} <Icon name="download" size={15}/></button></div>}

        {view === 'sales' ? <div className="checkout-grid">
          <section className="panel catalog-panel" aria-labelledby="products-heading">
            <div className="panel-heading"><div className="section-title"><h2 id="products-heading">{t('products')}</h2><span className="count-badge">{catalog.length}</span></div><span className="panel-heading-meta">{t('available')}</span></div>
            <div className={`search-box ${quantityProduct ? 'subdued' : ''}`}><Icon name="search" size={20}/><input ref={searchRef} aria-label={t('searchLabel')} placeholder={t('search')} value={query} autoComplete="off" spellCheck={false} onChange={e => { setQuery(e.target.value); setQuantityProduct(null); setInputError('') }} onKeyDown={e => {
              if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); const next = Math.max(0, Math.min(filtered.length - 1, selected + (e.key === 'ArrowDown' ? 1 : -1))); setSelected(next); productRefs.current[next]?.scrollIntoView({ block: 'nearest' }) }
              if (e.key === 'Enter') {
                e.preventDefault()
                const qClean = cleanSearchText(query).trim().replace(/[\s\-]/g, '')
                const exact = filtered.find(p => {
                  const base = p.groupId ? cleanSearchText(p.groupId.replace(/^grp-\d+-/, '')).replace(/[\s\-]/g, '') : ''
                  return cleanSearchText(p.code).replace(/[\s\-]/g, '') === qClean || base === qClean || getVariants(p).some(v => cleanSearchText(v.code).replace(/[\s\-]/g, '') === qClean)
                })
                const target = exact ?? filtered[selected]
                if (target) chooseProduct(target)
              }
            }}/><kbd>F2</kbd>{query && <button className="icon-button" aria-label={t('clear')} onClick={() => { setQuery(''); goSearch() }}><Icon name="close" size={14}/></button>}</div>
            <div className="category-tabs" aria-label="Product categories">{(['recent', 'all', 'staples', 'fresh', 'household'] as Category[]).map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'active' : ''} onClick={() => { setCategory(c); setQuery(''); goSearch() }}>{t(c)}<span>{c === 'recent' ? recentProducts.length : c === 'all' ? catalog.length : catalog.filter(product => product.category === c).length}</span></button>)}</div>
            <div className="product-table-head"><span>{t('product')}</span><span>{t('price')}</span></div>
            <div className="product-list" aria-label={t('products')}>
              {filtered.map((p, index) => <button key={p.id} ref={el => { productRefs.current[index] = el }} className={`product-row ${selected === index ? 'selected' : ''} ${quantityProduct?.id === p.id ? 'entering' : ''}`} onClick={() => { setSelected(index); chooseProduct(p) }} onFocus={() => setSelected(index)} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const next = Math.max(0, Math.min(filtered.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1))); productRefs.current[next]?.focus() } }}>
                <ProductArt product={p}/><div className="product-info"><strong>{p[lang]}</strong><span><code>{p.code}</code><i/> {lang === 'en' ? p.detail : p.detailBn}</span></div><div className="product-price"><strong>{money(p.price)}</strong><span>{isMoneyUnit(p.unit) ? t('perTaka') : `৳ / ${p.unit}`}</span></div><span className="row-enter">↵</span>
              </button>)}
              {!filtered.length && <div className="empty-state"><Icon name="search" size={30}/><h3>{t('noResults')}</h3><p>{t('noResultsHint')}</p></div>}
            </div>
            <div className={`quantity-lane ${quantityProduct ? 'active' : ''}`}>
              {quantityProduct ? (() => {
                const variants = getSaleVariants(quantityProduct)
                const currentVariant = selectedVariant ?? variants[0] ?? quantityProduct
                const hasVariants = variants.length > 1

                const handleLaneKeyDown = (e: React.KeyboardEvent) => {
                  if (hasVariants && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
                    e.preventDefault()
                    const currentIndex = variants.findIndex(v => v.id === currentVariant.id)
                    const nextIndex = (e.key === 'ArrowRight' || e.key === 'ArrowDown')
                      ? (currentIndex + 1) % variants.length
                      : (currentIndex - 1 + variants.length) % variants.length
                    setSelectedVariant(variants[nextIndex])
                  }
                }

                return (
                  <form onSubmit={e => { e.preventDefault(); addProduct() }} onKeyDown={handleLaneKeyDown}>
                    <div className="quantity-product-label">
                      <span className="eyebrow">{isMoneyUnit(currentVariant.unit) ? t('topUpAmount') : t('qtyFor')} <code>{currentVariant.code}</code></span>
                      <strong>{quantityProduct[lang]}</strong>
                      {hasVariants && (
                        <div className="variant-chips" style={{ marginTop: 4 }}>
                          {variants.map(v => (
                            <button
                              key={v.id}
                              type="button"
                              className={`variant-chip-btn ${v.id === currentVariant.id ? 'active' : ''}`}
                              onClick={() => { setSelectedVariant(v); qtyRef.current?.focus() }}
                              title={`${v.en}: ৳ ${money(v.price)}`}
                            >
                              <span>{lang === 'bn' ? (v.variantNameBn ?? v.variantName ?? v.detailBn) : (v.variantName ?? v.detail)}</span>
                              <small>৳ {money(v.price)}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {hasVariants && (
                      <div className="variant-nav-hint" title={t('selectVariant')}>
                        <kbd>←</kbd><kbd>→</kbd><span>{t('variants')}</span>
                      </div>
                    )}
                    <label className="quantity-field">
                      <span className="sr-only">{isMoneyUnit(currentVariant.unit) ? t('topUpAmount') : t('quantity')}</span>
                      <input
                        ref={qtyRef}
                        value={qty}
                        onChange={e => { setQty(e.target.value); setInputError('') }}
                        inputMode="decimal"
                        aria-describedby={inputError ? 'qty-error' : undefined}
                        aria-invalid={!!inputError}
                      />
                      <span>{unitText(currentVariant.unit)}</span>
                    </label>
                    <button className="add-button" type="submit" aria-label={t('addItem')}>
                      <Icon name="arrow" size={21}/><kbd>↵</kbd>
                    </button>
                  </form>
                )
              })() : <div className="quantity-placeholder"><Icon name="keyboard" size={18}/><span>{t('itemHint')}</span><kbd>↵</kbd></div>}
              {inputError && <p id="qty-error" className="field-error" role="alert">{inputError}</p>}
            </div>
          </section>

          <section className="panel bill-panel" aria-labelledby="bill-heading">
            <div className="panel-heading"><div className="section-title"><h2 id="bill-heading">{t('currentBill')}</h2><span className="count-badge">{state.lines.length}</span></div><span className="bill-number">#{receiptNumber(state.receipts.length + 1)}</span></div>
            <div className="bill-customer"><button className="customer-select" onClick={() => { setCustomerQuery(''); openDialog('customer') }}><span className="customer-avatar"><Icon name="accounts" size={18}/></span><span>{customer ? customer[lang] : t('walkIn')}<small>{customer ? customer.phone : t('chooseCustomer')}</small></span><Icon name="down" size={14}/></button><button className="clear-button" onClick={() => openDialog('clear')} disabled={!state.lines.length}>{t('clear')}<Icon name="reset" size={14}/></button></div>
            <div className="bill-table-head"><span>{t('product')}</span><span>{t('quantity')}</span><span>{t('amount')}</span><span/></div>
            <div className="bill-list" ref={billRef} tabIndex={0} aria-label={`${t('currentBill')} · Alt+B`} onKeyDown={e => {
              if (e.target !== e.currentTarget) return
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setBillSelection(i => Math.max(0, Math.min(state.lines.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))) }
              if (e.key === 'Enter' && state.lines[billSelection]) { e.preventDefault(); editLine(billSelection) }
              if (e.key === 'Delete' && state.lines[billSelection]) { e.preventDefault(); removeLine(billSelection) }
            }}>
              {state.lines.map((line, index) => { const p = findItem(line.productId); return <div key={line.productId} data-product-id={line.productId} className={`bill-row ${index === billSelection ? 'bill-selected' : ''}`}>
                <div className="bill-product"><span className="bill-line-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{p[lang]}</strong><small>{rateText(p)}<span>·</span>{lang === 'en' ? p.detail : p.detailBn}</small></div></div>
                <button className="bill-qty" aria-label={`${t('editQty')}: ${p[lang]}`} onClick={() => editLine(index)}><FittedQuantity value={quantityWithUnit(line.quantity, p.unit)}/><span>{isMoneyUnit(p.unit) ? t('topUp') : p.unit}</span></button><strong className="bill-amount">{money(lineTotal(p.price, line.quantity))}</strong><button className="remove-line icon-button" aria-label={`${t('remove')}: ${p[lang]}`} onClick={() => removeLine(index)}><Icon name="close" size={14}/></button>
              </div> })}
              {!state.lines.length && <div className="empty-state bill-empty"><div className="empty-pixel"><PixelMark/></div><h3>{t('emptyBill')}</h3><p>{t('emptyBillHint')}</p><button className="text-button" onClick={goSearch}>{t('findItem')} <kbd>F2</kbd></button></div>}
              {state.lines.length > 0 && <div className="bill-end"><span/><Icon name="plus" size={13}/><span/></div>}
            </div>
            <div className="bill-summary"><div className="summary-row"><span>{t('subtotal')}<small>{state.lines.length} {t('items')}</small></span><span>৳ {money(billSubtotal)}</span></div><div className="summary-row"><button className="discount-button" onClick={() => { setDiscountInput(state.discount ? (state.discount / 100).toFixed(2) : ''); openDialog('discount') }} disabled={!state.lines.length}><Icon name="plus" size={13}/>{state.discount ? t('discount') : t('addDiscount')}</button><span>{state.discount ? `− ৳ ${money(state.discount)}` : '—'}</span></div><div className="total-row"><div><span>{t('total')}</span><small>BDT</small></div><strong><span>৳</span>{money(billTotal)}</strong></div><button className="payment-button" onClick={openPayment} disabled={!state.lines.length || !ready}><span>{t('payment')}</span><span className="payment-button-right"><kbd>+</kbd><Icon name="arrow" size={23}/></span></button><div className="payment-caption"><span>{t('paymentHint')} <kbd>+</kbd></span><span className={`save-status ${storageStatus}`}><i/>{t(storageStatus === 'saved' ? 'deviceOnly' : storageStatus === 'saving' ? 'saving' : 'storageError')}</span></div></div>
          </section>
        </div> : <section className="secondary-view" key={view}>
          <div className="metrics-grid">{(view === 'inventory' ? [
            { label: 'variants', value: String(catalog.length), icon: 'inventory' },
            { label: 'stockValue', value: `৳ ${money(catalog.reduce((s, p) => s + lineTotal(p.price, stockFor(p, state.receipts)), 0))}`, icon: 'cash' },
            { label: 'lowStock', value: String(catalog.filter(p => stockFor(p, state.receipts) < 10000).length), icon: 'reports' },
          ] : view === 'accounts' ? [
            { label: 'customersLabel', value: String(customerCatalog.length), icon: 'accounts' },
            { label: 'outstanding', value: `৳ ${money(pendingDue)}`, icon: 'cash' },
            { label: 'totalSales', value: `৳ ${money(state.receipts.reduce((s, r) => s + r.total, 0))}`, icon: 'reports' },
          ] : [
            { label: reportWindow === 'today' ? 'salesToday' : 'salesInWindow', value: `৳ ${money(windowSales)}`, icon: 'reports' },
            { label: reportWindow === 'today' ? 'profitToday' : 'profitInWindow', value: `৳ ${money(windowProfit)}`, icon: 'cash' },
            { label: reportWindow === 'today' ? 'collected' : 'collectedInWindow', value: `৳ ${money(windowPaid)}`, icon: 'cash' },
            { label: reportWindow === 'today' ? 'receiptsToday' : 'receiptsInWindow', value: String(windowReceipts.length), icon: 'sales' },
          ]).map(metric => <div className="metric-card" key={metric.label}><div><span className="eyebrow">{t(metric.label as CopyKey)}</span><Icon name={metric.icon}/></div><strong key={metric.value}>{metric.value}</strong></div>)}</div>
          <div className="panel data-panel">
            <div className="panel-heading">
              <div className="section-title">
                <h2>{t(view === 'inventory' ? 'products' : view === 'accounts' ? 'customerAccounts' : reportsSubView === 'products' ? 'reportsTabsProducts' : 'recentSales')}</h2>
                {view === 'accounts' && <span className="count-badge">{customerCatalog.length}</span>}
                {view === 'reports' && <span className="count-badge">{reportsSubView === 'products' ? displayCatalog.length : windowReceipts.length}</span>}
              </div>
              <div className="inventory-header-actions">
                {view === 'inventory' && <button className="provision-trigger" onClick={openProvisionDialog}><Icon name="plus" size={15}/><span>{t('provisionItem')}</span></button>}
                {view === 'accounts' && <button className="provision-trigger" onClick={openCustomerProvisionDialog}><Icon name="plus" size={15}/><span>{t('provisionCustomer')}</span></button>}
                {view === 'reports' && <>
                  <div className="report-window-container">
                    <label htmlFor="report-window" className="report-window-label"><Icon name="reports" size={13}/><span>{t('reportWindow')}</span></label>
                    <select id="report-window" className="report-window-select" value={reportWindow} onChange={e => setReportWindow(e.target.value as ReportWindow)}>
                      <option value="today">{t('windowToday')}</option>
                      <option value="3days">{t('window3Days')}</option>
                      <option value="7days">{t('window7Days')}</option>
                      <option value="month">{t('windowMonth')}</option>
                    </select>
                  </div>
                  <div className="reports-tab-toggle" role="group" aria-label={t('reports')}>
                    <button type="button" aria-pressed={reportsSubView === 'sales'} className={reportsSubView === 'sales' ? 'active' : ''} onClick={() => setReportsSubView('sales')}>
                      <Icon name="reports" size={13}/><span>{t('reportsTabsSales')}</span>
                    </button>
                    <button type="button" aria-pressed={reportsSubView === 'products'} className={reportsSubView === 'products' ? 'active' : ''} onClick={() => setReportsSubView('products')}>
                      <Icon name="inventory" size={13}/><span>{t('reportsTabsProducts')}</span>
                    </button>
                  </div>
                  <button className="text-button" onClick={exportCsv}><Icon name="download" size={16}/>{t('exportCsv')}</button>
                </>}
              </div>
            </div>
            {view === 'inventory' ? <div className="data-table-wrap"><table className="data-table inventory-table"><thead><tr><th>{t('product')}</th><th>{t('code')}</th><th className="numeric-cell">{t('stock')}</th><th className="numeric-cell">{t('cost')}</th><th className="numeric-cell">{t('price')}</th><th className="numeric-cell">{t('margin')}</th><th className="numeric-cell">{t('purchasedUnits')}</th><th>{t('status')}</th><th/></tr></thead><tbody>{catalog.map(p => {
              const cost = productCost(p)
              const margin = unitMargin(p)
              const marginPct = unitMarginPercent(p)
              const purchased = p.purchased ?? p.stock
              return <tr key={p.id} className={p.archived ? 'product-discontinued' : undefined}>
                <td><div className="inventory-product"><ProductArt product={p}/><span><strong>{p[lang]}</strong><small>{lang === 'en' ? p.detail : p.detailBn}</small></span></div></td>
                <td><code>{p.code}</code></td>
                <td className="numeric-cell">{quantityWithUnit(stockFor(p, state.receipts), p.unit)}</td>
                <td className="numeric-cell">৳ {money(cost)}</td>
                <td className="numeric-cell">৳ {money(p.price)}</td>
                <td className="numeric-cell"><span className="margin-badge">৳ {money(margin)} ({marginPct.toFixed(0)}%)</span></td>
                <td className="numeric-cell">{quantityWithUnit(purchased, p.unit)}</td>
                <td><span className={`product-status ${p.archived ? 'discontinued' : 'active'}`}>{t(p.archived ? 'statusInactive' : 'statusActive')}</span></td>
                <td><button type="button" className="archive-item-button" onClick={() => setProductArchived(p, !p.archived)}>{t(p.archived ? 'actionTurnOn' : 'actionTurnOff')}</button></td>
              </tr>
            })}</tbody></table></div> : view === 'accounts' ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{t('customer')}</th><th>{t('phone')}</th><th className="numeric-cell">{t('totalDue')}</th><th className="numeric-cell">{t('loan')}</th><th className="numeric-cell">{t('availableCredit')}</th><th/></tr></thead><tbody>{customerCatalog.map(c => {
              const b = customerBalance(c, state.receipts, state.transactions)
              return <tr key={c.id}>
                <td><div className="account-name"><span className="initial-avatar">{c.en.split(' ').map(s => s[0]).join('')}</span><strong>{c[lang]}</strong></div></td>
                <td><code>{c.phone}</code></td>
                <td className="numeric-cell">{b.totalDue > 0 ? <strong>৳ {money(b.totalDue)}</strong> : <span className="settled-badge">{t('settled')}</span>}</td>
                <td className="numeric-cell">{b.loan > 0 ? <span className="tx-badge loan">৳ {money(b.loan)}</span> : '—'}</td>
                <td className="numeric-cell"><span className="tx-badge payment">৳ {money(b.availableCredit)}</span></td>
                <td><button className="icon-button" aria-label={`${t('viewProfile')}: ${c[lang]}`} onClick={() => openCustomerProfile(c)}><Icon name="chevron" size={16}/></button></td>
              </tr>
            })}</tbody></table></div> : reportsSubView === 'products' ? (() => {
              // Calculate per-item performance within selected window, aggregating grouped variants
              const productStatsList = displayCatalog.map(parentProduct => {
                const variants = getVariants(parentProduct)
                let units = 0
                let revenue = 0
                let profit = 0
                let orderCount = 0

                for (const r of windowReceipts) {
                  let foundInReceipt = false
                  for (const line of r.lines) {
                    if (variants.some(v => v.id === line.productId)) {
                      foundInReceipt = true
                      units += line.quantity
                      revenue += lineTotal(line.product.price, line.quantity)
                      profit += lineProfit(line.product, line.quantity)
                    }
                  }
                  if (foundInReceipt) orderCount++
                }

                return {
                  product: parentProduct,
                  variants,
                  units,
                  revenue,
                  profit,
                  orderCount,
                }
              }).sort((a, b) => b.revenue - a.revenue)

              return <div className="data-table-wrap" key="product-reports">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>{t('code')}</th>
                      <th className="numeric-cell">{t('unitsSold')}</th>
                      <th className="numeric-cell">{t('itemRevenue')}</th>
                      <th className="numeric-cell">{t('itemProfit')}</th>
                      <th className="numeric-cell">{t('unitProfitLabel')}</th>
                      <th className="numeric-cell">{t('salesOccurrences')}</th>
                      <th/>
                    </tr>
                  </thead>
                  <tbody>
                    {productStatsList.map(({ product: p, variants, units, revenue, profit, orderCount }) => {
                      const m = unitMargin(p)
                      const mPct = unitMarginPercent(p)
                      const hasVariants = variants.length > 1
                      return (
                        <tr key={p.id} className="clickable-row" onClick={() => { setActiveReportProduct(p); openDialog('itemStats') }}>
                          <td>
                            <div className="inventory-product">
                              <ProductArt product={p}/>
                              <span>
                                <strong>{p[lang]}</strong>
                                <small>
                                  {hasVariants
                                    ? `${variants.length} ${t('variants')}`
                                    : (lang === 'en' ? p.detail : p.detailBn)}
                                </small>
                              </span>
                            </div>
                          </td>
                          <td><code>{p.code}</code></td>
                          <td className="numeric-cell"><strong>{quantityWithUnit(units, p.unit)}</strong></td>
                          <td className="numeric-cell">৳ {money(revenue)}</td>
                          <td className="numeric-cell"><span className="profit-text">৳ {money(profit)}</span></td>
                          <td className="numeric-cell">
                            <span className="margin-badge">
                              {hasVariants ? `~${mPct.toFixed(0)}%` : `৳ ${money(m)} (${mPct.toFixed(0)}%)`}
                            </span>
                          </td>
                          <td className="numeric-cell">{orderCount}</td>
                          <td>
                            <button className="icon-button" aria-label={`${t('viewItemStats')}: ${p[lang]}`} onClick={e => { e.stopPropagation(); setActiveReportProduct(p); openDialog('itemStats') }}>
                              <Icon name="chevron" size={16}/>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            })() : windowReceipts.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{t('transaction')}</th><th>{t('customer')}</th><th>{t('time')}</th><th className="numeric-cell">{t('amount')}</th><th>{t('status')}</th><th/></tr></thead><tbody>{[...windowReceipts].reverse().map(r => <tr key={r.id}><td><code>#{receiptNumber(r.number)}</code></td><td>{r.customer ? r.customer[lang] : t('walkIn')}</td><td>{new Date(r.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' })}</td><td className="numeric-cell">৳ {money(r.total)}</td><td><span className="local-badge">{t('saved')}</span></td><td><button className="icon-button" aria-label={`${t('viewReceipt')} #${receiptNumber(r.number)}`} onClick={() => { setActiveReceipt(r); setJustCompleted(false); openDialog('receipt') }}><Icon name="chevron" size={16}/></button></td></tr>)}</tbody></table></div> : <div className="empty-state reports-empty"><Icon name="reports" size={34}/><h3>{t('noSales')}</h3><p>{t('noSalesHint')}</p><button className="text-button" onClick={() => setView('sales')}>{t('sales')}<Icon name="arrow" size={16}/></button></div>}
            <div className="data-footnote">{t(view === 'inventory' ? 'catalogNote' : view === 'accounts' ? 'accountNote' : 'reportNote')}</div>
          </div>{view === 'accounts' && <p className="phase-note">{t('cashbookNote')}</p>}
        </section>}

      </main>

      {view === 'sales' && showShortcutToast && <div className="shortcut-bar shortcut-toast" role="status">
        <div className="shortcut-items">
          <button onClick={() => { setView('sales'); goSearch() }}><kbd>F2</kbd><span>{t('findItem')}</span></button>
          <span className="shortcut-hint"><kbd>↑</kbd><kbd>↓</kbd><span>{t('navigate')}</span></span>
          <span className="shortcut-hint"><kbd>↵</kbd><span>{t('select')}</span></span>
          <button onClick={() => { setView('sales'); openPayment() }}><kbd>+</kbd><span>{t('pay')}</span></button>
          <button onClick={() => { setQuery(''); goSearch() }}><kbd>esc</kbd><span>{t('back')}</span></button>
        </div>
        <button className="help-trigger" onClick={() => openDialog('shortcuts')}>
          <kbd>?</kbd><span>{t('shortcuts')}</span><Icon name="keyboard" size={15}/>
        </button>
      </div>}
    </div>

    {toast && <div className="toast" role="status"><Icon name="check" size={16}/><span>{toast.text}</span>{toast.undo && <button onClick={() => { toast.undo?.(); setToast(null) }}>{t('undo')}</button>}<button className="icon-button" aria-label={t('close')} onClick={() => setToast(null)}><Icon name="close" size={13}/></button></div>}

    {dialog && <Modal title={t(dialog === 'payment' ? 'payment' : dialog === 'customer' ? 'chooseCustomer' : dialog === 'discount' ? 'discountTitle' : dialog === 'shortcuts' ? 'shortcuts' : dialog === 'settings' ? 'settings' : dialog === 'clear' ? 'clearTitle' : dialog === 'edit' ? 'editQty' : dialog === 'newItem' ? 'newItem' : dialog === 'newCustomer' ? 'newCustomer' : dialog === 'customerProfile' ? 'customerProfile' : dialog === 'addTx' ? 'addTransaction' : dialog === 'itemStats' ? 'itemOverview' : 'receipt')} closeLabel={t('close')} onClose={closeDialog} canClose={!busy} className={`dialog-${dialog}`}>
      {dialog === 'payment' && <form onSubmit={e => { e.preventDefault(); completeSale() }}><div className="eyebrow modal-eyebrow">{t('counter')}<span> / </span>#{receiptNumber(state.receipts.length + 1)}</div><h3>{t('payment')}<span className="heading-dot">.</span></h3><div className="payment-total"><span>{t('total')}</span><strong><small>৳</small>{money(billTotal)}</strong><span>{customer ? customer[lang] : t('walkIn')} · {state.lines.length} {t('items')}</span></div><div className="payment-methods" aria-label={t('method')}>{(['cash', 'mobile', 'bank'] as const).map(method => <button key={method} type="button" className={method === paymentMethod ? 'active' : ''} onClick={() => { setPaymentMethod(method); setModalError('') }} aria-pressed={method === paymentMethod}><Icon name={method}/>{t(method)}</button>)}</div><div className="payment-input-label"><label htmlFor="received">{t('received')}</label><button type="button" className="text-button" onClick={() => setReceived((billTotal / 100).toFixed(2))}>{t('exact')}</button></div><div className="money-input"><span>৳</span><input id="received" inputMode="decimal" value={received} onChange={e => { setReceived(e.target.value); setModalError('') }} aria-invalid={!!modalError} aria-describedby={modalError ? 'payment-error' : undefined}/><small>BDT</small></div><div className={`change-row ${paidAmount < billTotal ? 'due' : ''}`}><span>{t(paidAmount < billTotal ? 'due' : 'change')}</span><strong>৳ {money(Math.abs(paidAmount - billTotal))}</strong></div>{modalError && <p className="field-error" id="payment-error" role="alert">{modalError}</p>}<button className="primary-button" type="submit" disabled={busy}><span>{t(busy ? 'completing' : 'complete')}</span><kbd>↵</kbd></button><p className="dialog-note">{t('paymentNote')}</p></form>}

      {dialog === 'customer' && <><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('chooseCustomer')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('customerHint')}</p><div className="search-box"><Icon name="search" size={19}/><input aria-label={t('customerSearch')} placeholder={t('customerSearch')} value={customerQuery} onChange={e => setCustomerQuery(e.target.value)}/></div><div className="customer-options"><button onClick={() => { setState(s => ({ ...s, customerId: null })); closeDialog() }}><span className="initial-avatar"><Icon name="accounts"/></span><span><strong>{t('walkIn')}</strong><small>—</small></span>{!customer && <Icon name="check"/>}</button>{matchingCustomers.map(c => <button key={c.id} onClick={() => { setState(s => ({ ...s, customerId: c.id })); closeDialog() }}><span className="initial-avatar">{c.en.split(' ').map(s => s[0]).join('')}</span><span><strong>{c[lang]}</strong><small>{c.phone}</small></span>{customer?.id === c.id && <Icon name="check"/>}</button>)}{!matchingCustomers.length && <div className="empty-state customer-search-empty"><p>{t('noCustomerFound')}</p></div>}</div></>}

      {dialog === 'discount' && <form onSubmit={e => { e.preventDefault(); const value = parseMoney(discountInput); if (value === null) { setModalError(t('invalidAmount')); return } if (value >= billSubtotal) { setModalError(t('discountInvalid')); return } setState(s => ({ ...s, discount: value })); closeDialog() }}><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('discountTitle')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('discountHint')}</p><label className="field-label" htmlFor="discount">{t('discount')} · BDT</label><div className="money-input"><span>৳</span><input id="discount" value={discountInput} onChange={e => { setDiscountInput(e.target.value); setModalError('') }} inputMode="decimal" placeholder="0.00"/></div>{modalError && <p className="field-error" role="alert">{modalError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" type="submit">{t('apply')}<kbd>↵</kbd></button></div></form>}

      {dialog === 'edit' && state.lines[billSelection] && (() => {
        const editProduct = findItem(state.lines[billSelection].productId)
        return <form onSubmit={e => { e.preventDefault(); updateLine() }}><div className="eyebrow modal-eyebrow">{t('editQty')}</div><h3>{editProduct[lang]}<span className="heading-dot">.</span></h3><label className="field-label" htmlFor="edit-qty">{isMoneyUnit(editProduct.unit) ? t('topUpAmount') : t('quantity')} · {unitText(editProduct.unit)}</label><div className="money-input">{isMoneyUnit(editProduct.unit) && <span>৳</span>}<input id="edit-qty" inputMode="decimal" value={qty} onChange={e => { setQty(e.target.value); setModalError('') }}/></div>{modalError && <p className="field-error" role="alert">{modalError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" type="submit">{t('saveQty')}<kbd>↵</kbd></button></div></form>
      })()}

      {dialog === 'clear' && <><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('clearTitle')}</h3><p className="modal-description">{t('clearHint')}</p><div className="dialog-actions"><button className="secondary-button" data-initial-focus onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" onClick={() => { setState(s => ({ ...s, lines: [], discount: 0, customerId: null })); closeDialog(); goSearch() }}>{t('confirmClear')}</button></div></>}

      {dialog === 'shortcuts' && <><div className="eyebrow modal-eyebrow"><Icon name="keyboard" size={17}/> HISAB / SHORTCUTS</div><h3>{t('shortcutTitle')}</h3><p className="modal-description">{t('shortcutHint')}</p><div className="shortcut-guide">{([['F2', 'focusSearch'], ['↑  ↓', 'navigate'], ['Enter', 'select'], ['+', 'openPayment'], ['Alt + B', 'billFocus'], ['Enter', 'editBill'], ['Delete', 'removeBill'], ['Esc', 'closeDialog'], ['?', 'showHelp']] as [string, CopyKey][]).map(([key, label]) => <div key={label}><span>{t(label)}</span><kbd>{key}</kbd></div>)}</div><p className="dialog-note">{t('shortcutsNote')}</p></>}

      {dialog === 'settings' && <><div className="eyebrow modal-eyebrow">HISAB / SETTINGS</div><h3>{t('settings')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('settingsHint')}</p><div className="setting-row"><span>{t('language')}</span><div className="setting-language"><button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''} aria-pressed={lang === 'en'}>English</button><button onClick={() => setLang('bn')} className={lang === 'bn' ? 'active' : ''} aria-pressed={lang === 'bn'}>বাংলা</button></div></div><div className="setting-row"><span>{t('appearance')}</span><div className="setting-language"><button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'}>{t('light')}</button><button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'}>{t('dark')}</button></div></div><div className="setting-row"><span>{t('offlineAccess')}</span><span className={`offline-status ${offlineStatus}`} role="status">{t(offlineStatus === 'ready' ? 'offlineReady' : offlineStatus === 'preparing' ? 'offlinePreparing' : offlineStatus === 'development' ? 'offlineDevelopment' : 'offlineUnavailable')}</span></div><div className="storage-setting"><h4>{t('storage')}</h4><p>{t('storageHint')}</p><button className="secondary-button" onClick={exportBackup}><Icon name="download" size={16}/>{t('export')}</button></div><p className="dialog-note">{t('version')}</p></>}

      {dialog === 'newItem' && <form onSubmit={e => { e.preventDefault(); createProduct() }}><div className="eyebrow modal-eyebrow">{t('workspace')}<span> / </span>{t('inventory')}</div><h3>{t('newItem')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('newItemHint')}</p>
        <div className="variant-toggle-row">
          <label htmlFor="toggle-has-variants">
            <input
              id="toggle-has-variants"
              type="checkbox"
              checked={hasVariants}
              onChange={e => {
                setHasVariants(e.target.checked)
                setModalError('')
              }}
            />
            <span>{t('hasVariantsShort')}</span>
          </label>
          <small style={{ color: 'var(--muted)', fontSize: 10 }}>{t('hasVariantsToggle')}</small>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="item-code">{hasVariants ? `${t('code')} (${t('product')})` : t('code')} *</label>
            <input id="item-code" className="form-input" value={newCode} onChange={e => {
              const val = e.target.value
              setNewCode(val)
              setModalError('')
              const matched = catalog.find(p => p.code.toLowerCase() === val.trim().toLowerCase())
              if (matched) {
                setNewNameEn(matched.en)
                setNewNameBn(matched.bn)
                setNewDetail(matched.detail)
                setNewCategory(matched.category)
                setNewUnit(matched.unit)
                if (!newCost) setNewCost((productCost(matched) / 100).toFixed(2))
                if (!newPrice) setNewPrice((matched.price / 100).toFixed(2))
              }
            }} placeholder="e.g. 113" data-initial-focus autoFocus required/>
          </div>
          <div className="form-group">
            <label htmlFor="item-category">{t('categoryLabel')}</label>
            <select id="item-category" className="form-input" value={newCategory} onChange={e => setNewCategory(e.target.value as Exclude<Category, 'all' | 'recent'>)}>
              <option value="staples">{t('staples')}</option>
              <option value="fresh">{t('fresh')}</option>
              <option value="household">{t('household')}</option>
            </select>
          </div>
          <div className="form-group span-2">
            <label htmlFor="item-name-en">{t('productNameEn')} *</label>
            <input id="item-name-en" className="form-input" value={newNameEn} onChange={e => { setNewNameEn(e.target.value); setModalError('') }} placeholder="e.g. Eggplant (বেগুন)" required/>
          </div>
          <div className="form-group span-2">
            <label htmlFor="item-name-bn">{t('productNameBn')}</label>
            <input id="item-name-bn" className="form-input" value={newNameBn} onChange={e => setNewNameBn(e.target.value)} placeholder="e.g. বেগুন"/>
          </div>
          {!hasVariants && (
            <div className="form-group span-2">
              <label htmlFor="item-detail">{t('productDetail')}</label>
              <input id="item-detail" className="form-input" value={newDetail} onChange={e => setNewDetail(e.target.value)} placeholder="e.g. Fresh · loose"/>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="item-unit">{t('unitLabel')}</label>
            <select id="item-unit" className="form-input" value={newUnit} onChange={e => setNewUnit(e.target.value as Product['unit'])}>
              <option value="kg">kg (Kilogram)</option>
              <option value="pc">pc (Piece)</option>
              <option value="L">L (Litre)</option>
              <option value="BDT">৳ BDT (Recharge)</option>
            </select>
          </div>
          {!hasVariants && (
            <>
              <div className="form-group">
                <label htmlFor="item-purchased">{isMoneyUnit(newUnit) ? t('openingRechargeBalance') : t('purchasedQty')} ({unitText(newUnit)}) *</label>
                <input id="item-purchased" className="form-input" inputMode="decimal" value={newPurchased} onChange={e => { setNewPurchased(e.target.value); setModalError('') }} placeholder="e.g. 25" required/>
              </div>
              <div className="form-group">
                <label htmlFor="item-cost">{t('purchaseAmount')} (৳) *</label>
                <input id="item-cost" className="form-input" inputMode="decimal" value={newCost} onChange={e => { setNewCost(e.target.value); setModalError('') }} placeholder="e.g. 20.00" required/>
              </div>
              <div className="form-group">
                <label htmlFor="item-price">{isMoneyUnit(newUnit) ? t('chargePerTaka') : t('sellingPrice')} (৳) *</label>
                <input id="item-price" className="form-input" inputMode="decimal" value={newPrice} onChange={e => { setNewPrice(e.target.value); setModalError('') }} placeholder="e.g. 25.00" required/>
              </div>
            </>
          )}
        </div>

        {hasVariants && (
          <div className="variant-builder-wrap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eyebrow">{t('variantBreakdown')} ({variantRows.length})</span>
              <small style={{ color: 'var(--muted)', fontSize: 10 }}>{t('variantHint')}</small>
            </div>
            <div className={`variant-builder-head${variantRows.length > 1 ? ' has-remove' : ''}`} aria-hidden="true">
              <span>{t('variant')}</span><span>{t('code')}</span><span>{t('purchaseAmount')} (৳)</span><span>{t('sellingPrice')} (৳)</span><span>{t('stock')} ({newUnit})</span><span />
            </div>
            {variantRows.map((vRow, idx) => (
              <div key={vRow.id} className={`variant-builder-row${variantRows.length > 1 ? ' has-remove' : ''}`}>
                <input
                  aria-label={`Variant name, row ${idx + 1}`}
                  placeholder="e.g. 500 g, Blue"
                  value={vRow.name}
                  onChange={e => {
                    const next = [...variantRows]
                    next[idx] = { ...next[idx], name: e.target.value }
                    setVariantRows(next)
                  }}
                  required
                />
                <input
                  aria-label={`Variant code, row ${idx + 1} (optional)`}
                  placeholder="Optional"
                  value={vRow.code}
                  onChange={e => {
                    const next = [...variantRows]
                    next[idx] = { ...next[idx], code: e.target.value }
                    setVariantRows(next)
                  }}
                />
                <input
                  aria-label={`Total purchase amount in taka, row ${idx + 1}`}
                  placeholder={lang === 'bn' ? 'ক্রয়মূল্য (৳)' : 'Cost (৳)'}
                  inputMode="decimal"
                  value={vRow.cost}
                  onChange={e => {
                    const next = [...variantRows]
                    next[idx] = { ...next[idx], cost: e.target.value }
                    setVariantRows(next)
                  }}
                  required
                />
                <input
                  aria-label={`Selling price in taka, row ${idx + 1}`}
                  placeholder={lang === 'bn' ? 'বিক্রয়মূল্য (৳)' : 'Price (৳)'}
                  inputMode="decimal"
                  value={vRow.price}
                  onChange={e => {
                    const next = [...variantRows]
                    next[idx] = { ...next[idx], price: e.target.value }
                    setVariantRows(next)
                  }}
                  required
                />
                <input
                  aria-label={`Opening stock in ${newUnit}, row ${idx + 1}`}
                  placeholder={lang === 'bn' ? `মজুত (${newUnit})` : `Stock (${newUnit})`}
                  inputMode="decimal"
                  value={vRow.stock}
                  onChange={e => {
                    const next = [...variantRows]
                    next[idx] = { ...next[idx], stock: e.target.value }
                    setVariantRows(next)
                  }}
                  required
                />
                {variantRows.length > 1 ? (
                  <button
                    type="button"
                    className="remove-variant-btn"
                    onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))}
                    title={t('removeVariantRow')}
                  >
                    <Icon name="close" size={12}/>
                  </button>
                ) : <div/>}
              </div>
            ))}
            <button
              type="button"
              className="add-variant-btn"
              onClick={() => {
                const nextId = String(Date.now())
                setVariantRows([
                  ...variantRows,
                  { id: nextId, name: '', nameBn: '', code: '', cost: '', price: '', stock: '' }
                ])
              }}
            >
              {t('addVariantRow')}
            </button>
          </div>
        )}

        {!hasVariants && (() => {
          const existingItem = catalog.find(p => p.code.toLowerCase() === newCode.trim().toLowerCase())
          const totalCost = parseMoney(newCost)
          const p = parseMoney(newPrice)
          const incomingQty = parseQuantity(newPurchased, newUnit)

          if (existingItem && totalCost !== null && p !== null && incomingQty !== null && incomingQty > 0) {
            const incomingUnitCost = Math.round(totalCost * 1000 / incomingQty)
            const currentStock = stockFor(existingItem, state.receipts)
            const currentUnitCost = productCost(existingItem)
            const totalStock = currentStock + incomingQty
            const currentVal = (currentStock / 1000) * currentUnitCost
            const incomingVal = totalCost
            const blendedCost = totalStock > 0 ? Math.round((currentVal + incomingVal) / (totalStock / 1000)) : incomingUnitCost
            const margin = p - blendedCost
            const pct = p > 0 ? (margin / p) * 100 : 0

            return <div className="restock-box">
              <div className="restock-box-header">
                <span className="restock-box-badge">{t('restockBadge')}</span>
                <span>{existingItem[lang]} (<code>{existingItem.code}</code>)</span>
              </div>
              <p className="restock-box-desc">{t('restockNotice')}</p>
              <div className="restock-grid">
                <div>
                  <small>{t('currentStockLabel')}</small>
                  <strong>{quantityWithUnit(currentStock, existingItem.unit)} @ {rateText({ ...existingItem, price: currentUnitCost })}</strong>
                </div>
                <div>
                  <small>{t('incomingStockLabel')}</small>
                  <strong>+{quantityWithUnit(incomingQty, newUnit)} @ ৳ {money(incomingUnitCost)} / {isMoneyUnit(newUnit) ? '৳1' : newUnit}</strong>
                </div>
                <div>
                  <small>{t('blendedCostLabel')}</small>
                  <strong>৳ {money(blendedCost)} / {isMoneyUnit(newUnit) ? '৳1' : newUnit}</strong>
                </div>
                <div>
                  <small>{t('newStockLabel')}</small>
                  <strong>{quantityWithUnit(totalStock, newUnit)}</strong>
                </div>
              </div>
              <div className="margin-preview" style={{ marginTop: '10px' }}>
                <span>{t('unitMargin')} ({t('blendedCostLabel')}):</span>
                <strong>৳ {money(margin)} ({pct.toFixed(1)}%)</strong>
              </div>
            </div>
          }

          const unitCost = (incomingQty !== null && incomingQty > 0 && totalCost !== null)
            ? Math.round(totalCost * 1000 / incomingQty)
            : totalCost

          if (unitCost !== null && p !== null) {
            const m = p - unitCost
            const pct = p > 0 ? (m / p) * 100 : 0
            return <div className="margin-preview">
              <span>{t('unitMargin')}:</span>
              <strong>৳ {money(m)} ({pct.toFixed(1)}%)</strong>
            </div>
          }
          return null
        })()}

        {modalError && <p className="field-error" role="alert">{modalError}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button>
          <button className="primary-button" type="submit">{t('saveItem')}<kbd>↵</kbd></button>
        </div>
      </form>}

      {dialog === 'newCustomer' && <form onSubmit={e => { e.preventDefault(); createCustomer() }}><div className="eyebrow modal-eyebrow">{t('workspace')}<span> / </span>{t('accounts')}</div><h3>{t('newCustomer')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('newCustomerHint')}</p>
        <div className="form-grid">
          <div className="form-group span-2">
            <label htmlFor="cust-name-en">{t('customerNameEn')} *</label>
            <input id="cust-name-en" className="form-input" value={newCustEn} onChange={e => { setNewCustEn(e.target.value); setModalError('') }} placeholder="e.g. Rafiqul Islam" autoFocus required/>
          </div>
          <div className="form-group span-2">
            <label htmlFor="cust-name-bn">{t('customerNameBn')}</label>
            <input id="cust-name-bn" className="form-input" value={newCustBn} onChange={e => setNewCustBn(e.target.value)} placeholder="e.g. রফিকুল ইসলাম"/>
          </div>
          <div className="form-group span-2">
            <label htmlFor="cust-phone">{t('customerPhone')} *</label>
            <input id="cust-phone" className="form-input" value={newCustPhone} onChange={e => { setNewCustPhone(e.target.value); setModalError('') }} placeholder="01700 000000" required/>
          </div>
          <div className="form-group">
            <label htmlFor="cust-credit">{t('creditLimit')} (৳)</label>
            <input id="cust-credit" className="form-input" inputMode="decimal" value={newCustCreditLimit} onChange={e => setNewCustCreditLimit(e.target.value)} placeholder="5000"/>
          </div>
          <div className="form-group">
            <label htmlFor="cust-opening">{t('openingBalance')} (৳)</label>
            <input id="cust-opening" className="form-input" inputMode="decimal" value={newCustOpeningDue} onChange={e => setNewCustOpeningDue(e.target.value)} placeholder="0.00"/>
          </div>
        </div>
        {modalError && <p className="field-error" role="alert">{modalError}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button>
          <button className="primary-button" type="submit">{t('saveCustomer')}<kbd>↵</kbd></button>
        </div>
      </form>}

      {dialog === 'customerProfile' && activeCustomer && (() => {
        const bal = customerBalance(activeCustomer, state.receipts, state.transactions)
        const ledger = customerLedger(activeCustomer.id, state.receipts, state.transactions)
        return <>
          <div className="eyebrow modal-eyebrow">{t('accounts')}<span> / </span>{t('customerProfile')}</div>
          <div className="customer-profile-header">
            <div className="customer-profile-avatar">{activeCustomer.en.split(' ').map(s => s[0]).join('')}</div>
            <div className="customer-profile-info">
              <h3>{activeCustomer[lang]}<span className="heading-dot">.</span></h3>
              <p>{activeCustomer.phone} {activeCustomer.creditLimit ? `· ${t('creditLimit')}: ৳ ${money(activeCustomer.creditLimit)}` : ''}</p>
            </div>
          </div>

          <div className="customer-stats-grid">
            <div className={`customer-stat-card ${bal.totalDue > 0 ? 'due' : ''}`}>
              <span>{t('totalDue')}</span>
              <strong>৳ {money(bal.totalDue)}</strong>
            </div>
            <div className={`customer-stat-card ${bal.loan > 0 ? 'loan' : ''}`}>
              <span>{t('loan')}</span>
              <strong>৳ {money(bal.loan)}</strong>
            </div>
            <div className="customer-stat-card credit">
              <span>{t('availableCredit')}</span>
              <strong>৳ {money(bal.availableCredit)}</strong>
            </div>
          </div>

          <div className="tx-action-bar">
            <button type="button" onClick={() => openAddTransaction('payment')}><Icon name="cash" size={14}/><span>{t('recordPayment')}</span></button>
            <button type="button" onClick={() => openAddTransaction('loan')}><Icon name="plus" size={14}/><span>{t('recordLoan')}</span></button>
            <button type="button" onClick={() => openAddTransaction('credit_adjust')}><Icon name="reset" size={14}/><span>{t('recordAdjustment')}</span></button>
          </div>

          <div className="panel-heading" style={{ height: 38, padding: '0 4px', borderBottom: 'none' }}>
            <div className="section-title">
              <span className="section-number">TX</span>
              <h2 style={{ fontSize: 13 }}>{t('txHistory')}</h2>
              <span className="count-badge">{ledger.length}</span>
            </div>
          </div>

          <div className="tx-table-wrap">
            {ledger.length ? <table className="tx-table">
              <thead>
                <tr>
                  <th>{t('time')}</th>
                  <th>{t('typeLabel')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('txNoteLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {[...ledger].reverse().map(tx => (
                  <tr key={tx.id}>
                    <td><small>{new Date(tx.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short' })} {new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</small></td>
                    <td><span className={`tx-badge ${tx.type}`}>{tx.type === 'sale_due' ? t('txSaleDue') : tx.type === 'payment' ? t('txPayment') : tx.type === 'loan' ? t('txLoan') : t('txAdjustment')}</span></td>
                    <td><strong>৳ {money(tx.amount)}</strong></td>
                    <td><small>{tx.note ?? '—'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table> : <div className="empty-state" style={{ minHeight: 120, padding: 20 }}><p>{t('noTx')}</p></div>}
          </div>

          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={closeDialog}>{t('close')}</button>
          </div>
        </>
      })()}

      {dialog === 'itemStats' && activeReportProduct && (() => {
        const p = activeReportProduct
        const variants = getVariants(p)
        const hasVariants = variants.length > 1
        const cost = productCost(p)
        const margin = unitMargin(p)
        const marginPct = unitMarginPercent(p)

        // Find all receipts containing any variant of this product in the selected window
        type ItemSaleRecord = {
          receipt: Receipt
          product: Product
          quantity: number
          total: number
          profit: number
          time: string
          customerName: string
        }

        const itemSales: ItemSaleRecord[] = []
        const coPurchaseMap = new Map<string, { product: Product; count: number }>()
        let totalSoldUnits = 0
        let totalRevenue = 0
        let totalProfit = 0

        // Per-variant breakdown map
        const variantStatsMap = new Map<string, { product: Product; units: number; revenue: number; profit: number }>()
        for (const v of variants) {
          variantStatsMap.set(v.id, { product: v, units: 0, revenue: 0, profit: 0 })
        }

        for (const r of windowReceipts) {
          const matchingLines = r.lines.filter(l => variants.some(v => v.id === l.productId))
          if (!matchingLines.length) continue

          for (const line of matchingLines) {
            const lineRev = lineTotal(line.product.price, line.quantity)
            const lineProf = lineProfit(line.product, line.quantity)

            totalSoldUnits += line.quantity
            totalRevenue += lineRev
            totalProfit += lineProf

            const vStats = variantStatsMap.get(line.productId)
            if (vStats) {
              vStats.units += line.quantity
              vStats.revenue += lineRev
              vStats.profit += lineProf
            }

            itemSales.push({
              receipt: r,
              product: line.product,
              quantity: line.quantity,
              total: lineRev,
              profit: lineProf,
              time: r.createdAt,
              customerName: r.customer ? r.customer[lang] : t('walkIn'),
            })
          }

          // Track frequently bought with (exclude any lines from this product's variant family)
          for (const otherLine of r.lines) {
            if (!variants.some(v => v.id === otherLine.productId)) {
              const cur = coPurchaseMap.get(otherLine.productId) ?? { product: otherLine.product, count: 0 }
              cur.count += 1
              coPurchaseMap.set(otherLine.productId, cur)
            }
          }
        }

        const topCoPurchases = Array.from(coPurchaseMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)

        const totalStock = variants.reduce((sum, v) => sum + stockFor(v, state.receipts), 0)

        return <>
          <div className="eyebrow modal-eyebrow">{t('reports')}<span> / </span>{t('itemOverview')}</div>
          <div className="customer-profile-header">
            <div className="item-profile-art"><ProductArt product={p}/></div>
            <div className="customer-profile-info">
              <h3>{p[lang]}<span className="heading-dot">.</span></h3>
              <p>
                <code>{p.code}</code> · {hasVariants ? `${variants.length} ${t('variants')}` : (lang === 'en' ? p.detail : p.detailBn)}
                {!hasVariants && ` · ${rateText(p)}`}
              </p>
            </div>
          </div>

          <div className="customer-stats-grid">
            <div className="customer-stat-card">
              <span>{t('unitsSold')}</span>
              <strong>{quantityWithUnit(totalSoldUnits, p.unit)}</strong>
            </div>
            <div className="customer-stat-card">
              <span>{t('itemRevenue')}</span>
              <strong>৳ {money(totalRevenue)}</strong>
            </div>
            <div className="customer-stat-card credit">
              <span>{t('itemProfit')}</span>
              <strong>৳ {money(totalProfit)}</strong>
            </div>
          </div>

          {!hasVariants ? (
            <div className="item-detail-cards-grid">
              <div className="item-detail-subcard">
                <span className="eyebrow">{t('cost')}</span>
                <strong>৳ {money(cost)} / {isMoneyUnit(p.unit) ? '৳1' : p.unit}</strong>
              </div>
              <div className="item-detail-subcard">
                <span className="eyebrow">{t('sellingPrice')}</span>
                <strong>{rateText(p)}</strong>
              </div>
              <div className="item-detail-subcard">
                <span className="eyebrow">{t('unitMargin')}</span>
                <strong className="profit-text">৳ {money(margin)} ({marginPct.toFixed(0)}%)</strong>
              </div>
              <div className="item-detail-subcard">
                <span className="eyebrow">{t('stock')}</span>
                <strong>{quantityWithUnit(stockFor(p, state.receipts), p.unit)}</strong>
              </div>
            </div>
          ) : (
            <div className="variant-table-wrap">
              <div className="panel-heading" style={{ height: 32, padding: '0 12px', borderBottom: 'none' }}>
                <div className="section-title">
                  <span className="section-number">VAR</span>
                  <h2 style={{ fontSize: 11 }}>{t('variantBreakdown')}</h2>
                </div>
              </div>
              <table className="variant-table">
                <thead>
                  <tr>
                    <th>{t('variant')}</th>
                    <th>{t('cost')}</th>
                    <th>{t('price')}</th>
                    <th>{t('stock')}</th>
                    <th>{t('unitsSold')}</th>
                    <th>{t('itemRevenue')}</th>
                    <th>{t('itemProfit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map(v => {
                    const vStat = variantStatsMap.get(v.id)
                    const vCost = productCost(v)
                    const vMargin = unitMargin(v)
                    const vMarginPct = unitMarginPercent(v)
                    return (
                      <tr key={v.id}>
                        <td>
                          <strong>{lang === 'bn' ? (v.variantNameBn ?? v.variantName ?? v.detailBn) : (v.variantName ?? v.detail)}</strong>
                          <br/><small style={{ color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{v.code}</small>
                        </td>
                        <td>৳ {money(vCost)}</td>
                        <td>৳ {money(v.price)}</td>
                        <td>{quantityWithUnit(stockFor(v, state.receipts), v.unit)}</td>
                        <td><strong>{quantityWithUnit(vStat?.units ?? 0, v.unit)}</strong></td>
                        <td>৳ {money(vStat?.revenue ?? 0)}</td>
                        <td><span className="profit-text">+৳ {money(vStat?.profit ?? 0)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {topCoPurchases.length > 0 && <div className="co-purchase-section">
            <span className="eyebrow" style={{ marginBottom: 8 }}>{t('frequencyBought')}</span>
            <div className="co-purchase-chips">
              {topCoPurchases.map(cp => (
                <span key={cp.product.id} className="co-purchase-chip">
                  <ProductArt product={cp.product}/>
                  <span>{cp.product[lang]}</span>
                  <small>×{cp.count}</small>
                </span>
              ))}
            </div>
          </div>}

          <div className="panel-heading" style={{ height: 38, padding: '0 4px', borderBottom: 'none', marginTop: 14 }}>
            <div className="section-title">
              <span className="section-number">HIST</span>
              <h2 style={{ fontSize: 13 }}>{t('itemHistory')} ({itemSales.length})</h2>
            </div>
          </div>

          <div className="tx-table-wrap">
            {itemSales.length ? <table className="tx-table">
              <thead>
                <tr>
                  <th>{t('transaction')}</th>
                  <th>{t('time')}</th>
                  <th>{t('customer')}</th>
                  {hasVariants && <th>{t('variant')}</th>}
                  <th>{t('quantity')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('margin')}</th>
                </tr>
              </thead>
              <tbody>
                {[...itemSales].reverse().map(sale => (
                  <tr key={`${sale.receipt.id}-${sale.product.id}`}>
                    <td><code>#{receiptNumber(sale.receipt.number)}</code></td>
                    <td><small>{new Date(sale.time).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short' })} {new Date(sale.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</small></td>
                    <td>{sale.customerName}</td>
                    {hasVariants && <td><small>{lang === 'bn' ? (sale.product.variantNameBn ?? sale.product.variantName ?? sale.product.detailBn) : (sale.product.variantName ?? sale.product.detail)}</small></td>}
                    <td><strong>{quantityWithUnit(sale.quantity, sale.product.unit)}</strong></td>
                    <td>৳ {money(sale.total)}</td>
                    <td><span className="profit-text">+ ৳ {money(sale.profit)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table> : <div className="empty-state" style={{ minHeight: 120, padding: 20 }}><p>{t('noItemSales')}</p></div>}
          </div>

          <div className="dialog-actions">
            <button className="secondary-button" type="button" onClick={closeDialog}>{t('close')}</button>
          </div>
        </>
      })()}

      {dialog === 'addTx' && activeCustomer && <form onSubmit={e => { e.preventDefault(); recordTransaction() }}>
        <div className="eyebrow modal-eyebrow">{activeCustomer[lang]}<span> / </span>{t('addTransaction')}</div>
        <h3>{txType === 'payment' ? t('recordPayment') : txType === 'loan' ? t('recordLoan') : t('recordAdjustment')}<span className="heading-dot">.</span></h3>
        <p className="modal-description">{t('balanceHint')}</p>

        <label className="field-label" htmlFor="tx-amount">{t('amount')} (৳) *</label>
        <div className="money-input">
          <span>৳</span>
          <input id="tx-amount" value={txAmount} onChange={e => { setTxAmount(e.target.value); setModalError('') }} inputMode="decimal" placeholder="0.00" autoFocus required/>
          <small>BDT</small>
        </div>

        <div className="form-group" style={{ marginTop: 15 }}>
          <label htmlFor="tx-note">{t('txNoteLabel')}</label>
          <input id="tx-note" className="form-input" value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="e.g. Cash payment / Eid advance"/>
        </div>

        {modalError && <p className="field-error" role="alert">{modalError}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={() => openCustomerProfile(activeCustomer)}>{t('cancel')}</button>
          <button className="primary-button" type="submit">{t('apply')}<kbd>↵</kbd></button>
        </div>
      </form>}

      {dialog === 'receipt' && activeReceipt && <><div className="receipt-dialog-heading">{justCompleted && <span className="success-mark"><Icon name="check" size={22}/></span>}<div className="eyebrow">{t(justCompleted ? 'receiptSaved' : 'receipt')}</div><h3>{t(justCompleted ? 'saleComplete' : 'receipt')}</h3></div>{renderReceipt(activeReceipt)}<div className="dialog-actions"><button className="secondary-button" onClick={() => window.print()}><Icon name="print" size={17}/>{t('printReceipt')}</button><button className="primary-button" data-initial-focus onClick={() => { closeDialog(); if (justCompleted) { setView('sales'); goSearch() } }}>{t(justCompleted ? 'newSale' : 'close')}<Icon name="arrow" size={18}/></button></div></>}
    </Modal>}
  </div>
}
