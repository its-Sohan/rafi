import type { CSSProperties } from 'react'
import type { Product } from './model'

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    sales: <><path d="M4 8h16v12H4zM7 4h10v4M8 12h1m3 0h1m3 0h1M8 16h1m3 0h1m3 0h1" /></>,
    inventory: <><path d="m4 7 8-4 8 4v10l-8 4-8-4zm0 0 8 4 8-4M12 11v10M8 5l8 4" /></>,
    accounts: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" /></>,
    reports: <><path d="M4 4v16h17M8 16v-5m5 5V7m5 9V4" /></>,
    settings: <><path d="M4 7h16M4 17h16M8 4v6m8 4v6" /><rect x="6" y="5" width="4" height="4" fill="currentColor" stroke="none"/><rect x="14" y="15" width="4" height="4" fill="currentColor" stroke="none"/></>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <><path d="m4 12 5 5L20 6"/></>,
    chevron: <><path d="m8 4 8 8-8 8"/></>,
    down: <><path d="m6 9 6 6 6-6"/></>,
    cash: <><rect x="2" y="5" width="20" height="14"/><circle cx="12" cy="12" r="3"/><path d="M5 9h1m12 6h1"/></>,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="1"/><path d="M10 18h4M9 5h6"/></>,
    bank: <><path d="m2 8 10-5 10 5H2zm2 12h16M6 10v7m6-7v7m6-7v7"/></>,
    print: <><path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6zM17 11h1"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    keyboard: <><rect x="2" y="5" width="20" height="14" rx="1"/><path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M7 16h10"/></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
    dot: <rect x="8" y="8" width="8" height="8" fill="currentColor" stroke="none"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">{paths[name] ?? paths.sales}</svg>
}
export function PixelMark({ small = false }: { small?: boolean }) {
  return <span className={`pixel-mark ${small ? 'small' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" focusable="false">
      <path fill="currentColor" d="M3 0h10v2h2v14H1V2h2V0Zm0 2v2h10V2H3Zm0 4v2h2V6H3Zm4 0v2h2V6H7Zm4 0v2h2V6h-2ZM3 10v2h2v-2H3Zm4 0v2h2v-2H7Zm4 0v2h2v-2h-2ZM3 14h6v-2H3v2Zm8-2v2h2v-2h-2Z" />
    </svg>
  </span>
}
export function ProductArt({ product, className = '' }: { product: Product; className?: string }) {
  const art: Record<Product['art'], React.ReactNode> = {
    rice: <><path fill="#9d957b" d="M5 4h14v3H5zM3 7h18v15H3z"/><path fill="#ece8d8" d="M5 9h14v11H5z"/><path fill="#34674e" d="M5 12h14v5H5z"/><path fill="#f8f6eb" d="M8 13h2v2H8zm4 0h4v2h-4z"/><path fill="#b7ad8b" d="M7 7h2v2H7zm8 0h2v2h-2z"/></>,
    oil: <><path fill="#4d6140" d="M9 2h6v3H9z"/><path fill="#e4b845" d="M9 5h6v3H9zM7 8h10v13H7z"/><path fill="#f8d577" d="M9 8h6v11H9z"/><path fill="#f3f1dc" d="M7 12h10v5H7z"/><path fill="#507348" d="M10 13h4v3h-4z"/><path fill="#e5b33d" d="M8 21h8v1H8z"/></>,
    egg: <><path fill="#c4a788" d="M3 14h18v6H3zM5 20h14v2H5z"/><path fill="#f4e8d5" d="M5 7h4v2h2v7H3V9h2zm10 0h4v2h2v7h-8V9h2z"/><path fill="#dec5a4" d="M3 14h8v2H3zm10 0h8v2h-8z"/><path fill="#b79672" d="M5 18h3v2H5zm5 0h3v2h-3zm6 0h3v2h-3z"/></>,
    milk: <><path fill="#b5c7d8" d="M8 3h8v4H8zM5 9l3-2h8l3 2v13H5z"/><path fill="#fffefa" d="M5 10h14v12H5z"/><path fill="#44769d" d="M5 13h14v6H5z"/><path fill="#e9f0f4" d="M9 14h2v4H9zm4 0h2v4h-2z"/><path fill="#7197b2" d="M15 7h1l3 3h-4z"/></>,
    sugar: <><path fill="#b9b8c3" d="M5 4h14v3H5zM3 7h18v15H3z"/><path fill="#f4f2f5" d="M5 8h14v12H5z"/><path fill="#8b7da5" d="M5 11h14v6H5z"/><path fill="#fff" d="M8 13h3v2H8zm5 0h3v2h-3z"/></>,
    tea: <><path fill="#407347" d="M4 4h16v18H4z"/><path fill="#2a4c31" d="M4 4h16v3H4z"/><path fill="#d5c28a" d="M6 10h12v7H6z"/><path fill="#f7ebc5" d="M8 11h7v4H8z"/><path fill="#7c6941" d="M15 12h2v3h-2zM8 16h9v1H8z"/></>,
    soap: <><path fill={product.id === 'soap-rose' ? '#bf7f93' : '#8c9e4e'} d="M4 7h16v3h2v8h-2v3H4v-3H2v-8h2z"/><path fill={product.id === 'soap-rose' ? '#eac3d0' : '#d9e6a7'} d="M4 9h16v9H4z"/><path fill="#fff9dd" d="M8 11h8v5H8z"/><path fill={product.id === 'soap-rose' ? '#b26985' : '#758f3c'} d="M10 12h4v3h-4z"/></>,
    flour: <><path fill="#b39972" d="M5 3h14v4H5zM3 7h18v15H3z"/><path fill="#efdfbb" d="M5 8h14v12H5z"/><path fill="#8f6c39" d="M11 10h2v9h-2zM8 11h3v2H8zm5 3h3v2h-3zM8 16h3v2H8z"/></>,
    lentil: <><path fill="#a76a43" d="M5 4h14v3H5zM3 7h18v15H3z"/><path fill="#ecc5a0" d="M5 9h14v11H5z"/><path fill="#c97e49" d="M7 12h3v2H7zm6-1h3v2h-3zm-2 5h3v2h-3zm5-1h2v2h-2zm-9 2h2v2H7z"/></>,
    biscuit: <><path fill="#a67539" d="M3 6h18v15H3z"/><path fill="#d9ba76" d="M5 8h14v11H5z"/><path fill="#f3dfac" d="M8 10h8v2h2v5H6v-5h2z"/><path fill="#b4925c" d="M9 12h2v2H9zm4 2h2v2h-2zm-4 2h2v1H9z"/></>,
    salt: <><path fill="#42889e" d="M5 4h14v3H5zM3 7h18v15H3z"/><path fill="#f0f6f6" d="M5 8h14v12H5z"/><path fill="#71b4c6" d="M5 11h14v6H5z"/><path fill="#fff" d="M8 13h8v2H8z"/></>,
    cleaner: <><path fill="#58796b" d="M9 2h6v4H9z"/><path fill="#72b293" d="M8 6h8v3h2v13H6V9h2z"/><path fill="#f1efde" d="M6 12h12v6H6z"/></>,
    pencil: <><path fill="#d6a847" d="M10 2h5v16h-5z"/><path fill="#f0d078" d="M11 3h2v14h-2z"/><path fill="#d9b99a" d="m10 18 2.5 4 2.5-4z"/><path fill="#343a44" d="m12.5 22 1-2h-2z"/><path fill="#d86c59" d="M10 2h5v3h-5z"/></>,
    book: <><path fill="#315e9c" d="M3 2h16v20H3z"/><path fill="#e9edf3" d="M6 4h13v16H6z"/><path fill="#6f8fbd" d="M3 2h3v20H3z"/><path fill="#315e9c" d="M9 8h7v2H9zm0 4h6v1H9z"/></>,
    notebook: <><path fill="#729262" d="M4 2h16v20H4z"/><path fill="#f1eee0" d="M7 4h13v16H7z"/><path fill="#d9d2bd" d="M4 2h3v20H4z"/><path fill="#8ba77c" d="M9 8h7v1H9zm0 3h8v1H9zm0 3h6v1H9z"/></>,
    pen: <><path fill="#343f54" d="M10 2h5v16h-5z"/><path fill="#4678c7" d="M11 3h2v13h-2z"/><path fill="#c7cedb" d="M10 18h5l-2.5 4z"/><path fill="#d75b55" d="M10 2h5v3h-5z"/></>,
    recharge: <><path fill="#3d6fbc" d="M3 2h18v20H3z"/><path fill="#edf2fa" d="M6 5h12v13H6z"/><path fill="#3d6fbc" d="M9 8h6v2H9zm-2 4h3v2H7zm5 0h5v2h-5z"/><path fill="#edc64e" d="M10 17h4v2h-4z"/></>,
    snack: <><path fill="#d98236" d="M5 3h14v3h2v14H3V6h2z"/><path fill="#f4ce73" d="M6 7h12v10H6z"/><path fill="#ae4f3c" d="M8 10h8v2H8zm2 4h4v1h-4z"/></>,
    daily: <><path fill="#4a8995" d="M4 4h16v17H4z"/><path fill="#e9f0e7" d="M7 7h10v10H7z"/><path fill="#4a8995" d="M9 9h6v2H9zm0 4h6v2H9z"/></>,
  }
  return <span className={`product-art ${className}`} style={{ '--art-bg': product.color } as CSSProperties}><svg viewBox="0 0 24 24" shapeRendering="crispEdges" aria-hidden="true">{art[product.art]}</svg></span>
}
