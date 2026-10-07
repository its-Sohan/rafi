import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icon, PixelMark, ProductArt } from './Icons'
import { customers, findProduct, initialState, lineTotal, makeReceipt, money, parseMoney, parseQuantity, products, quantityText, stockFor, subtotal, type Category, type Lang, type Line, type Product, type Receipt, type ShopState } from './model'
import { downloadJson, loadState, saveState } from './storage'
import { translator, type CopyKey } from './i18n'
import type { OfflineStatus } from './offline'

type View = 'sales' | 'inventory' | 'accounts' | 'reports'
type Dialog = 'payment' | 'customer' | 'discount' | 'shortcuts' | 'settings' | 'clear' | 'receipt' | 'edit' | null
const receiptNumber = (n: number) => String(n).padStart(4, '0')
const dayKey = (date: string | Date) => new Date(date).toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' })

function Modal({ children, title, onClose, className = '', canClose = true }: { children: ReactNode; title: string; onClose: () => void; className?: string; canClose?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current!
    const focusable = () => [...node.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, [tabindex="0"]')]
    const input = node.querySelector<HTMLInputElement>('input')
    const target = input ?? node.querySelector<HTMLElement>('[data-initial-focus]') ?? focusable()[0]
    target?.focus()
    input?.select()
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
      <button className="modal-close icon-button" aria-label="Close / বন্ধ করুন" onClick={onClose} disabled={!canClose}><Icon name="close"/></button>
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
  const [category, setCategory] = useState<Category>('all')
  const [selected, setSelected] = useState(0)
  const [quantityProduct, setQuantityProduct] = useState<Product | null>(null)
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
  const [billSelection, setBillSelection] = useState(0)
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null)
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
  useEffect(() => { setSelected(0) }, [query, category])
  useEffect(() => { if (quantityProduct) { qtyRef.current?.focus(); qtyRef.current?.select() } }, [quantityProduct])
  useEffect(() => { if (ready) searchRef.current?.focus() }, [ready, view])

  const filtered = products.filter(p => (category === 'all' || p.category === category) && `${p.code} ${p.en} ${p.bn} ${p.detail} ${p.detailBn}`.toLowerCase().includes(query.toLowerCase().trim()))
  const billSubtotal = subtotal(state.lines)
  const billTotal = Math.max(0, billSubtotal - state.discount)
  const customer = customers.find(c => c.id === state.customerId)
  const todayReceipts = state.receipts.filter(r => dayKey(r.createdAt) === dayKey(now))
  const todaySales = todayReceipts.reduce((s, r) => s + r.total, 0)
  const todayPaid = todayReceipts.reduce((s, r) => s + r.paid, 0)
  const pendingDue = state.receipts.reduce((s, r) => s + r.due, 0)
  const paidAmount = parseMoney(received) ?? 0
  const goSearch = () => { setQuantityProduct(null); setInputError(''); requestAnimationFrame(() => searchRef.current?.focus()) }
  const closeDialog = () => { if (!busy) { setDialog(null); setModalError('') } }
  const openDialog = (next: Dialog) => { setModalError(''); setDialog(next) }
  const openPayment = () => {
    if (!state.lines.length || !ready) return
    setReceived((billTotal / 100).toFixed(2)); setPaymentMethod('cash'); openDialog('payment')
  }
  const notify = (key: CopyKey) => setToast({ text: t(key) })
  const chooseProduct = (product: Product) => { setQuantityProduct(product); setQty('1'); setInputError('') }
  const addProduct = () => {
    if (!quantityProduct) return
    const parsed = parseQuantity(qty, quantityProduct.unit)
    if (parsed === null) { setInputError(t('invalidQuantity')); return }
    const existing = state.lines.find(l => l.productId === quantityProduct.id)?.quantity ?? 0
    if (existing + parsed > stockFor(quantityProduct, state.receipts)) { setInputError(t('noStock')); return }
    setState(previous => ({ ...previous, lines: previous.lines.some(l => l.productId === quantityProduct.id)
      ? previous.lines.map(l => l.productId === quantityProduct.id ? { ...l, quantity: l.quantity + parsed } : l)
      : [...previous.lines, { productId: quantityProduct.id, quantity: parsed }] }))
    notify('productAdded'); setQuery(''); goSearch()
  }
  const removeLine = (index: number) => {
    const removed = state.lines[index]
    const previousReceiptCount = state.receipts.length
    const previousDiscount = state.discount
    const lines = state.lines.filter((_, i) => i !== index)
    setState(s => ({ ...s, lines, discount: Math.min(s.discount, Math.max(0, subtotal(lines) - 1)) }))
    setBillSelection(Math.max(0, index - 1))
    setToast({ text: t('productRemoved'), undo: () => setState(s => {
      if (s.receipts.length !== previousReceiptCount) return s
      const restored = [...s.lines]
      const existing = restored.findIndex(l => l.productId === removed.productId)
      if (existing >= 0) restored[existing] = { ...restored[existing], quantity: restored[existing].quantity + removed.quantity }
      else restored.splice(Math.min(index, restored.length), 0, removed)
      return { ...s, lines: restored, discount: Math.min(Math.max(s.discount, previousDiscount), Math.max(0, subtotal(restored) - 1)) }
    }) })
  }
  const editLine = (index: number) => { setBillSelection(index); setQty(String(state.lines[index].quantity / 1000)); openDialog('edit') }
  const updateLine = () => {
    const line = state.lines[billSelection]
    if (!line) return
    const product = findProduct(line.productId)
    const parsed = parseQuantity(qty, product.unit)
    if (parsed === null) { setModalError(t('invalidQuantity')); return }
    if (parsed > stockFor(product, state.receipts)) { setModalError(t('noStock')); return }
    const lines = state.lines.map((l, i) => i === billSelection ? { ...l, quantity: parsed } : l)
    setState(s => ({ ...s, lines, discount: Math.min(s.discount, Math.max(0, subtotal(lines) - 1)) }))
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
    const next: ShopState = { lines: [], discount: 0, customerId: null, receipts: [...state.receipts, receipt] }
    paymentLock.current = true; setBusy(true)
    try {
      await saveState(next)
      setState(next); setActiveReceipt(receipt); setJustCompleted(true); setDialog('receipt'); setModalError(''); setQuery(''); setQuantityProduct(null); setToast(null)
      if ('storage' in navigator) navigator.storage.persist?.().catch(() => {})
    } catch { setModalError(t('saveError')); setStorageStatus('error') }
    finally { paymentLock.current = false; setBusy(false) }
  }
  const exportBackup = () => { downloadJson({ version: 1, exportedAt: new Date().toISOString(), products, customers, state }, `hisab-backup-${dayKey(now)}.json`); notify('backupExported') }
  const exportCsv = () => {
    const rows = [['Receipt', 'Date (UTC)', 'Total (BDT)', 'Paid (BDT)', 'Due (BDT)', 'Method'], ...state.receipts.map(r => [receiptNumber(r.number), r.createdAt, (r.total / 100).toFixed(2), (r.paid / 100).toFixed(2), (r.due / 100).toFixed(2), r.method])]
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `hisab-sales-${dayKey(now)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
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
    <div className="receipt-items">{receipt.lines.map(l => <div key={l.productId}><span>{l.product[lang]}<small>{quantityText(l.quantity)} {l.product.unit} × {money(l.product.price)}</small></span><strong>{money(lineTotal(l.product.price, l.quantity))}</strong></div>)}</div>
    <div className="receipt-total"><span>{t('subtotal')}</span><span>৳ {money(receipt.subtotal)}</span></div>
    {receipt.discount > 0 && <div className="receipt-total"><span>{t('discount')}</span><span>− {money(receipt.discount)}</span></div>}
    <div className="receipt-total grand"><strong>{t('total')}</strong><strong>৳ {money(receipt.total)}</strong></div>
    <div className="receipt-total"><span>{t('paid')} · {t(receipt.method)}</span><span>{money(receipt.paid)}</span></div>
    {receipt.change > 0 && <div className="receipt-total"><span>{t('change')}</span><span>{money(receipt.change)}</span></div>}
    {receipt.due > 0 && <div className="receipt-total"><span>{t('due')}</span><span>{money(receipt.due)}</span></div>}
    <p className="receipt-thanks">{t('thanks')}</p><p className="receipt-local">{t('localReceipt')}</p>
  </div>

  return <div className={`app-shell lang-${lang}`}>
    <aside className="sidebar" aria-label="Main navigation">
      <button className="brand-mark" aria-label="Hisab sales counter" onClick={() => setView('sales')}><PixelMark/></button>
      <div className="side-nav">{(['sales', 'inventory', 'accounts', 'reports'] as View[]).map((item, index) => <button key={item} className={`nav-button ${view === item ? 'active' : ''}`} onClick={() => setView(item)} aria-label={t(item)} aria-current={view === item ? 'page' : undefined} title={t(item)}><Icon name={item} size={23}/><span>{lang === 'en' && item === 'sales' ? 'Counter' : t(item)}</span><i className="nav-index">0{index + 1}</i></button>)}</div>
      <div className="side-bottom"><button className="nav-button" onClick={() => openDialog('shortcuts')} title={t('shortcuts')} aria-label={t('shortcuts')}><Icon name="keyboard" size={22}/></button><button className="nav-button" onClick={() => openDialog('settings')} title={t('settings')} aria-label={t('settings')}><Icon name="settings" size={22}/></button><div className="avatar" aria-label="Shop owner">S</div></div>
    </aside>

    <div className="main-shell">
      <header className="topbar">
        <div className="wordmark">hisab<span>.</span></div>
        <span className="top-divider"/>
        <div className="shop-label"><Icon name="inventory" size={16}/><span>{t('shop')}</span><Icon name="down" size={12}/></div>
        <span className="prototype-label">{t('localDemo')}</span>
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
        <section className="page-heading"><div><div className="eyebrow"><span className="tiny-cross"/>{t('workspace')}<span className="eyebrow-slash">/</span>0{(['sales', 'inventory', 'accounts', 'reports'] as View[]).indexOf(view) + 1}</div><h1>{t(view)}<span className="heading-dot">.</span></h1><p>{view === 'sales' ? t('welcome') : t(view === 'inventory' ? 'catalogHint' : view === 'accounts' ? 'balanceHint' : 'reportHint')}</p></div><div className="heading-right"><div className="counter-tag"><span className="pixel-dot"/>{t('counter')}<span className="open-tag">{t('open')}</span></div><div className="heading-date">{now.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' })}<span> / </span>{now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', hour12: false })}</div></div></section>

        {storageStatus === 'error' && <div className="storage-alert" role="alert">{t('storageError')}<button onClick={exportBackup}>{t('export')} <Icon name="download" size={15}/></button></div>}

        {view === 'sales' ? <div className="checkout-grid">
          <section className="panel catalog-panel" aria-labelledby="products-heading">
            <div className="panel-heading"><div className="section-title"><span className="section-number">01</span><h2 id="products-heading">{t('products')}</h2><span className="count-badge">{products.length}</span></div><span className="panel-heading-meta">{t('available')}</span></div>
            <div className={`search-box ${quantityProduct ? 'subdued' : ''}`}><Icon name="search" size={20}/><input ref={searchRef} aria-label={t('searchLabel')} placeholder={t('search')} value={query} autoComplete="off" spellCheck={false} onChange={e => { setQuery(e.target.value); setQuantityProduct(null); setInputError('') }} onKeyDown={e => {
              if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); const next = Math.max(0, Math.min(filtered.length - 1, selected + (e.key === 'ArrowDown' ? 1 : -1))); setSelected(next); productRefs.current[next]?.scrollIntoView({ block: 'nearest' }) }
              if (e.key === 'Enter') { e.preventDefault(); const exact = filtered.find(p => p.code === query.trim()); if (exact ?? filtered[selected]) chooseProduct((exact ?? filtered[selected])!) }
            }}/><kbd>F2</kbd>{query && <button className="icon-button" aria-label={t('clear')} onClick={() => { setQuery(''); goSearch() }}><Icon name="close" size={14}/></button>}</div>
            <div className="category-tabs" aria-label="Product categories">{(['all', 'staples', 'fresh', 'household'] as Category[]).map(c => <button key={c} aria-pressed={category === c} className={category === c ? 'active' : ''} onClick={() => { setCategory(c); setQuery(''); goSearch() }}>{t(c)}{c === 'all' && <span>{products.length}</span>}</button>)}</div>
            <div className="product-table-head"><span>{t('product')}</span><span>{t('price')}</span></div>
            <div className="product-list" aria-label={t('products')}>
              {filtered.map((p, index) => <button key={p.id} ref={el => { productRefs.current[index] = el }} className={`product-row ${selected === index ? 'selected' : ''} ${quantityProduct?.id === p.id ? 'entering' : ''}`} onClick={() => { setSelected(index); chooseProduct(p) }} onFocus={() => setSelected(index)} onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const next = Math.max(0, Math.min(filtered.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1))); productRefs.current[next]?.focus() } }}>
                <ProductArt product={p}/><div className="product-info"><strong>{p[lang]}</strong><span><code>{p.code}</code><i/> {lang === 'en' ? p.detail : p.detailBn}</span></div><div className="product-price"><strong>{money(p.price)}</strong><span>৳ / {p.unit}</span></div><span className="row-enter">↵</span>
              </button>)}
              {!filtered.length && <div className="empty-state"><Icon name="search" size={30}/><h3>{t('noResults')}</h3><p>{t('noResultsHint')}</p></div>}
            </div>
            <div className={`quantity-lane ${quantityProduct ? 'active' : ''}`}>
              {quantityProduct ? <form onSubmit={e => { e.preventDefault(); addProduct() }}><div className="quantity-product-label"><span className="eyebrow">{t('qtyFor')} <code>{quantityProduct.code}</code></span><strong>{quantityProduct[lang]}</strong></div><label className="quantity-field"><span className="sr-only">{t('quantity')}</span><input ref={qtyRef} value={qty} onChange={e => { setQty(e.target.value); setInputError('') }} inputMode="decimal" aria-describedby={inputError ? 'qty-error' : undefined} aria-invalid={!!inputError}/><span>{quantityProduct.unit}</span></label><button className="add-button" type="submit" aria-label={t('addItem')}><Icon name="arrow" size={21}/><kbd>↵</kbd></button></form> : <div className="quantity-placeholder"><Icon name="keyboard" size={18}/><span>{t('itemHint')}</span><kbd>↵</kbd></div>}
              {inputError && <p id="qty-error" className="field-error" role="alert">{inputError}</p>}
            </div>
            <div className="catalog-footnote"><span className="pixel-dot"/>{t('noBackend')}</div>
          </section>

          <section className="panel bill-panel" aria-labelledby="bill-heading">
            <div className="panel-heading"><div className="section-title"><span className="section-number">02</span><h2 id="bill-heading">{t('currentBill')}</h2><span className="count-badge">{state.lines.length}</span></div><span className="bill-number">#{receiptNumber(state.receipts.length + 1)}</span></div>
            <div className="bill-customer"><button className="customer-select" onClick={() => { setCustomerQuery(''); openDialog('customer') }}><span className="customer-avatar"><Icon name="accounts" size={18}/></span><span>{customer ? customer[lang] : t('walkIn')}<small>{customer ? customer.phone : t('chooseCustomer')}</small></span><Icon name="down" size={14}/></button><button className="clear-button" onClick={() => openDialog('clear')} disabled={!state.lines.length}>{t('clear')}<Icon name="reset" size={14}/></button></div>
            <div className="bill-table-head"><span>{t('product')}</span><span>{t('quantity')}</span><span>{t('amount')}</span><span/></div>
            <div className="bill-list" ref={billRef} tabIndex={0} aria-label={`${t('currentBill')} · Alt+B`} onKeyDown={e => {
              if (e.target !== e.currentTarget) return
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setBillSelection(i => Math.max(0, Math.min(state.lines.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))) }
              if (e.key === 'Enter' && state.lines[billSelection]) { e.preventDefault(); editLine(billSelection) }
              if (e.key === 'Delete' && state.lines[billSelection]) { e.preventDefault(); removeLine(billSelection) }
            }}>
              {state.lines.map((line, index) => { const p = findProduct(line.productId); return <div key={line.productId} className={`bill-row ${index === billSelection ? 'bill-selected' : ''}`}>
                <div className="bill-product"><span className="bill-line-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{p[lang]}</strong><small>{money(p.price)} / {p.unit}<span>·</span>{lang === 'en' ? p.detail : p.detailBn}</small></div></div>
                <button className="bill-qty" aria-label={`${t('editQty')}: ${p[lang]}`} onClick={() => editLine(index)}>{quantityText(line.quantity)}<span>{p.unit}</span></button><strong className="bill-amount">{money(lineTotal(p.price, line.quantity))}</strong><button className="remove-line icon-button" aria-label={`${t('remove')}: ${p[lang]}`} onClick={() => removeLine(index)}><Icon name="close" size={14}/></button>
              </div> })}
              {!state.lines.length && <div className="empty-state bill-empty"><div className="empty-pixel"><PixelMark/></div><h3>{t('emptyBill')}</h3><p>{t('emptyBillHint')}</p><button className="text-button" onClick={goSearch}>{t('findItem')} <kbd>F2</kbd></button></div>}
              {state.lines.length > 0 && <div className="bill-end"><span/><Icon name="plus" size={13}/><span/></div>}
            </div>
            <div className="bill-summary"><div className="summary-row"><span>{t('subtotal')}<small>{state.lines.length} {t('items')}</small></span><span>৳ {money(billSubtotal)}</span></div><div className="summary-row"><button className="discount-button" onClick={() => { setDiscountInput(state.discount ? (state.discount / 100).toFixed(2) : ''); openDialog('discount') }} disabled={!state.lines.length}><Icon name="plus" size={13}/>{state.discount ? t('discount') : t('addDiscount')}</button><span>{state.discount ? `− ৳ ${money(state.discount)}` : '—'}</span></div><div className="total-row"><div><span>{t('total')}</span><small>BDT</small></div><strong><span>৳</span>{money(billTotal)}</strong></div><button className="payment-button" onClick={openPayment} disabled={!state.lines.length || !ready}><span>{t('payment')}</span><span className="payment-button-right"><kbd>+</kbd><Icon name="arrow" size={23}/></span></button><div className="payment-caption"><span>{t('paymentHint')} <kbd>+</kbd></span><span className={`save-status ${storageStatus}`}><i/>{t(storageStatus === 'saved' ? 'deviceOnly' : storageStatus === 'saving' ? 'saving' : 'storageError')}</span></div></div>
          </section>
        </div> : <section className="secondary-view">
          <div className="metrics-grid">{(view === 'inventory' ? [
            { label: 'variants', value: String(products.length), icon: 'inventory' },
            { label: 'stockValue', value: `৳ ${money(products.reduce((s, p) => s + lineTotal(p.price, stockFor(p, state.receipts)), 0))}`, icon: 'cash' },
            { label: 'lowStock', value: String(products.filter(p => stockFor(p, state.receipts) < 10000).length), icon: 'reports' },
          ] : view === 'accounts' ? [
            { label: 'customersLabel', value: String(customers.length), icon: 'accounts' },
            { label: 'outstanding', value: `৳ ${money(pendingDue)}`, icon: 'cash' },
            { label: 'totalSales', value: `৳ ${money(state.receipts.reduce((s, r) => s + r.total, 0))}`, icon: 'reports' },
          ] : [
            { label: 'salesToday', value: `৳ ${money(todaySales)}`, icon: 'reports' },
            { label: 'collected', value: `৳ ${money(todayPaid)}`, icon: 'cash' },
            { label: 'receiptsToday', value: String(todayReceipts.length), icon: 'sales' },
          ]).map(metric => <div className="metric-card" key={metric.label}><div><span className="eyebrow">{t(metric.label as CopyKey)}</span><Icon name={metric.icon}/></div><strong>{metric.value}</strong></div>)}</div>
          <div className="panel data-panel"><div className="panel-heading"><div className="section-title"><span className="section-number">01</span><h2>{t(view === 'inventory' ? 'products' : view === 'accounts' ? 'customerAccounts' : 'recentSales')}</h2></div>{view === 'reports' && <button className="text-button" onClick={exportCsv}><Icon name="download" size={16}/>{t('exportCsv')}</button>}</div>
            {view === 'inventory' ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{t('product')}</th><th>{t('code')}</th><th>{t('stock')}</th><th>{t('price')}</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><div className="inventory-product"><ProductArt product={p}/><span><strong>{p[lang]}</strong><small>{lang === 'en' ? p.detail : p.detailBn}</small></span></div></td><td><code>{p.code}</code></td><td>{quantityText(stockFor(p, state.receipts))} <small>{p.unit}</small></td><td>৳ {money(p.price)}</td></tr>)}</tbody></table></div> : view === 'accounts' ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{t('customer')}</th><th>{t('phone')}</th><th>{t('balance')}</th></tr></thead><tbody>{customers.map(c => { const due = state.receipts.filter(r => r.customer?.id === c.id).reduce((s, r) => s + r.due, 0); return <tr key={c.id}><td><div className="account-name"><span className="initial-avatar">{c.en.split(' ').map(s => s[0]).join('')}</span><strong>{c[lang]}</strong></div></td><td>{c.phone}</td><td>{due ? <strong>৳ {money(due)}</strong> : <span className="settled-badge">{t('settled')}</span>}</td></tr> })}</tbody></table></div> : state.receipts.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>{t('transaction')}</th><th>{t('customer')}</th><th>{t('time')}</th><th>{t('amount')}</th><th>{t('status')}</th><th/></tr></thead><tbody>{[...state.receipts].reverse().map(r => <tr key={r.id}><td><code>#{receiptNumber(r.number)}</code></td><td>{r.customer ? r.customer[lang] : t('walkIn')}</td><td>{new Date(r.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'short', timeStyle: 'short' })}</td><td>৳ {money(r.total)}</td><td><span className="local-badge">{t('saved')}</span></td><td><button className="icon-button" aria-label={`${t('viewReceipt')} #${receiptNumber(r.number)}`} onClick={() => { setActiveReceipt(r); setJustCompleted(false); openDialog('receipt') }}><Icon name="chevron" size={16}/></button></td></tr>)}</tbody></table></div> : <div className="empty-state reports-empty"><Icon name="reports" size={34}/><h3>{t('noSales')}</h3><p>{t('noSalesHint')}</p><button className="text-button" onClick={() => setView('sales')}>{t('sales')}<Icon name="arrow" size={16}/></button></div>}
            <div className="data-footnote">{t(view === 'inventory' ? 'catalogNote' : view === 'accounts' ? 'accountNote' : 'reportNote')}</div>
          </div>{view === 'accounts' && <p className="phase-note">{t('cashbookNote')}</p>}
        </section>}

        <footer className="workspace-footer"><span className="footer-brand"><PixelMark small/><span>SMALL SHOP. BIG POSSIBILITIES.</span></span><span className="today-summary">{t('today')}<strong>৳ {money(todaySales)}</strong><span> / </span>{todayReceipts.length} {t('receiptsToday').toLowerCase()}</span></footer>
      </main>

      <div className="shortcut-bar"><div className="shortcut-items"><button onClick={() => { setView('sales'); goSearch() }}><kbd>F2</kbd><span>{t('findItem')}</span></button><span className="shortcut-hint"><kbd>↑</kbd><kbd>↓</kbd><span>{t('navigate')}</span></span><span className="shortcut-hint"><kbd>↵</kbd><span>{t('select')}</span></span><button onClick={() => { setView('sales'); openPayment() }}><kbd>+</kbd><span>{t('pay')}</span></button><button onClick={() => { setQuery(''); goSearch() }}><kbd>esc</kbd><span>{t('back')}</span></button></div><button className="help-trigger" onClick={() => openDialog('shortcuts')}><kbd>?</kbd><span>{t('shortcuts')}</span><Icon name="keyboard" size={18}/></button></div>
    </div>

    {toast && <div className="toast" role="status"><Icon name="check" size={16}/><span>{toast.text}</span>{toast.undo && <button onClick={() => { toast.undo?.(); setToast(null) }}>{t('undo')}</button>}<button className="icon-button" aria-label={t('close')} onClick={() => setToast(null)}><Icon name="close" size={13}/></button></div>}

    {dialog && <Modal title={t(dialog === 'payment' ? 'payment' : dialog === 'customer' ? 'chooseCustomer' : dialog === 'discount' ? 'discountTitle' : dialog === 'shortcuts' ? 'shortcuts' : dialog === 'settings' ? 'settings' : dialog === 'clear' ? 'clearTitle' : dialog === 'edit' ? 'editQty' : 'receipt')} onClose={closeDialog} canClose={!busy} className={`dialog-${dialog}`}>
      {dialog === 'payment' && <form onSubmit={e => { e.preventDefault(); completeSale() }}><div className="eyebrow modal-eyebrow">{t('counter')}<span> / </span>#{receiptNumber(state.receipts.length + 1)}</div><h3>{t('payment')}<span className="heading-dot">.</span></h3><div className="payment-total"><span>{t('total')}</span><strong><small>৳</small>{money(billTotal)}</strong><span>{customer ? customer[lang] : t('walkIn')} · {state.lines.length} {t('items')}</span></div><div className="payment-methods" aria-label={t('method')}>{(['cash', 'mobile', 'bank'] as const).map(method => <button key={method} type="button" className={method === paymentMethod ? 'active' : ''} onClick={() => { setPaymentMethod(method); setModalError('') }} aria-pressed={method === paymentMethod}><Icon name={method}/>{t(method)}</button>)}</div><div className="payment-input-label"><label htmlFor="received">{t('received')}</label><button type="button" className="text-button" onClick={() => setReceived((billTotal / 100).toFixed(2))}>{t('exact')}</button></div><div className="money-input"><span>৳</span><input id="received" inputMode="decimal" value={received} onChange={e => { setReceived(e.target.value); setModalError('') }} aria-invalid={!!modalError} aria-describedby={modalError ? 'payment-error' : undefined}/><small>BDT</small></div><div className={`change-row ${paidAmount < billTotal ? 'due' : ''}`}><span>{t(paidAmount < billTotal ? 'due' : 'change')}</span><strong>৳ {money(Math.abs(paidAmount - billTotal))}</strong></div>{modalError && <p className="field-error" id="payment-error" role="alert">{modalError}</p>}<button className="primary-button" type="submit" disabled={busy}><span>{t(busy ? 'completing' : 'complete')}</span><kbd>↵</kbd></button><p className="dialog-note">{t('paymentNote')}</p></form>}

      {dialog === 'customer' && <><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('chooseCustomer')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('customerHint')}</p><div className="search-box"><Icon name="search" size={19}/><input aria-label={t('customerSearch')} placeholder={t('customerSearch')} value={customerQuery} onChange={e => setCustomerQuery(e.target.value)}/></div><div className="customer-options"><button onClick={() => { setState(s => ({ ...s, customerId: null })); closeDialog() }}><span className="initial-avatar"><Icon name="accounts"/></span><span><strong>{t('walkIn')}</strong><small>—</small></span>{!customer && <Icon name="check"/>}</button>{customers.filter(c => `${c.en} ${c.bn} ${c.phone}`.toLowerCase().includes(customerQuery.toLowerCase())).map(c => <button key={c.id} onClick={() => { setState(s => ({ ...s, customerId: c.id })); closeDialog() }}><span className="initial-avatar">{c.en.split(' ').map(s => s[0]).join('')}</span><span><strong>{c[lang]}</strong><small>{c.phone}</small></span>{customer?.id === c.id && <Icon name="check"/>}</button>)}</div></>}

      {dialog === 'discount' && <form onSubmit={e => { e.preventDefault(); const value = parseMoney(discountInput); if (value === null) { setModalError(t('invalidAmount')); return } if (value >= billSubtotal) { setModalError(t('discountInvalid')); return } setState(s => ({ ...s, discount: value })); closeDialog() }}><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('discountTitle')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('discountHint')}</p><label className="field-label" htmlFor="discount">{t('discount')} · BDT</label><div className="money-input"><span>৳</span><input id="discount" value={discountInput} onChange={e => { setDiscountInput(e.target.value); setModalError('') }} inputMode="decimal" placeholder="0.00"/></div>{modalError && <p className="field-error" role="alert">{modalError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" type="submit">{t('apply')}<kbd>↵</kbd></button></div></form>}

      {dialog === 'edit' && state.lines[billSelection] && <form onSubmit={e => { e.preventDefault(); updateLine() }}><div className="eyebrow modal-eyebrow">{t('editQty')}</div><h3>{findProduct(state.lines[billSelection].productId)[lang]}<span className="heading-dot">.</span></h3><label className="field-label" htmlFor="edit-qty">{t('quantity')} · {findProduct(state.lines[billSelection].productId).unit}</label><div className="money-input"><input id="edit-qty" inputMode="decimal" value={qty} onChange={e => { setQty(e.target.value); setModalError('') }}/></div>{modalError && <p className="field-error" role="alert">{modalError}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" type="submit">{t('saveQty')}<kbd>↵</kbd></button></div></form>}

      {dialog === 'clear' && <><div className="eyebrow modal-eyebrow">{t('currentBill')}</div><h3>{t('clearTitle')}</h3><p className="modal-description">{t('clearHint')}</p><div className="dialog-actions"><button className="secondary-button" data-initial-focus onClick={closeDialog}>{t('cancel')}</button><button className="primary-button" onClick={() => { setState(s => ({ ...s, lines: [], discount: 0, customerId: null })); closeDialog(); goSearch() }}>{t('confirmClear')}</button></div></>}

      {dialog === 'shortcuts' && <><div className="eyebrow modal-eyebrow"><Icon name="keyboard" size={17}/> HISAB / KEYS</div><h3>{t('shortcutTitle')}</h3><p className="modal-description">{t('shortcutHint')}</p><div className="shortcut-guide">{([['F2', 'focusSearch'], ['↑  ↓', 'navigate'], ['Enter', 'select'], ['+', 'openPayment'], ['Alt + B', 'billFocus'], ['Enter', 'editBill'], ['Delete', 'removeBill'], ['Esc', 'closeDialog'], ['?', 'showHelp']] as [string, CopyKey][]).map(([key, label]) => <div key={label}><span>{t(label)}</span><kbd>{key}</kbd></div>)}</div><p className="dialog-note">{t('shortcutsNote')}</p></>}

      {dialog === 'settings' && <><div className="eyebrow modal-eyebrow">HISAB / PREFERENCES</div><h3>{t('settings')}<span className="heading-dot">.</span></h3><p className="modal-description">{t('settingsHint')}</p><div className="setting-row"><span>{t('language')}</span><div className="setting-language"><button onClick={() => setLang('en')} className={lang === 'en' ? 'active' : ''} aria-pressed={lang === 'en'}>English</button><button onClick={() => setLang('bn')} className={lang === 'bn' ? 'active' : ''} aria-pressed={lang === 'bn'}>বাংলা</button></div></div><div className="setting-row"><span>{t('appearance')}</span><div className="setting-language"><button onClick={() => setTheme('light')} className={theme === 'light' ? 'active' : ''} aria-pressed={theme === 'light'}>{t('light')}</button><button onClick={() => setTheme('dark')} className={theme === 'dark' ? 'active' : ''} aria-pressed={theme === 'dark'}>{t('dark')}</button></div></div><div className="setting-row"><span>{t('offlineAccess')}</span><span className={`offline-status ${offlineStatus}`} role="status">{t(offlineStatus === 'ready' ? 'offlineReady' : offlineStatus === 'preparing' ? 'offlinePreparing' : offlineStatus === 'development' ? 'offlineDevelopment' : 'offlineUnavailable')}</span></div><div className="storage-setting"><h4>{t('storage')}</h4><p>{t('storageHint')}</p><button className="secondary-button" onClick={exportBackup}><Icon name="download" size={16}/>{t('export')}</button></div><p className="dialog-note">{t('version')}</p></>}

      {dialog === 'receipt' && activeReceipt && <><div className="receipt-dialog-heading">{justCompleted && <span className="success-mark"><Icon name="check" size={22}/></span>}<div className="eyebrow">{t(justCompleted ? 'receiptSaved' : 'receipt')}</div><h3>{t(justCompleted ? 'saleComplete' : 'receipt')}</h3></div>{renderReceipt(activeReceipt)}<div className="dialog-actions"><button className="secondary-button" onClick={() => window.print()}><Icon name="print" size={17}/>{t('printReceipt')}</button><button className="primary-button" data-initial-focus onClick={() => { closeDialog(); if (justCompleted) { setView('sales'); goSearch() } }}>{t(justCompleted ? 'newSale' : 'close')}<Icon name="arrow" size={18}/></button></div></>}
    </Modal>}
  </div>
}
