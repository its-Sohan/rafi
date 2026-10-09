export type Lang = 'en' | 'bn'
export type ServiceCategory = 'printing' | 'documents' | 'applications' | 'government' | 'digital'
export type Category = 'recent' | 'all' | ServiceCategory | 'mobiles' | 'computers' | 'accessories' | 'services' | 'staples' | 'fresh' | 'household'
type FormerShopCategory = 'mobiles' | 'computers' | 'accessories' | 'services'
export type ProductUnit = 'kg' | 'pc' | 'L' | 'BDT' | 'job' | 'page' | 'sheet' | 'set'
export type Product = {
  id: string; code: string; en: string; bn: string; detail: string; detailBn: string
  category: Exclude<Category, 'all' | 'recent'>; unit: ProductUnit; price: number; stock: number
  cost?: number // Wholesale / purchase cost per unit in poisha (minor currency unit: 1 BDT = 100 poisha)
  purchased?: number // Total units purchased / provisioned (scaled integer: 1 unit = 1000)
  groupId?: string // Identifier linking variants of the same product (e.g. 'egg', 'soap')
  variantName?: string // Short variant name for inline picker e.g. 'Brown' / 'White'
  variantNameBn?: string // Bengali variant name e.g. 'লাল' / 'সাদা'
  archived?: boolean // Discontinued and hidden from the sales catalog
  trackStock?: boolean // False for labour/services that do not consume a stocked unit
  art: 'rice' | 'oil' | 'egg' | 'milk' | 'sugar' | 'tea' | 'soap' | 'flour' | 'lentil' | 'biscuit' | 'salt' | 'cleaner' | 'pencil' | 'book' | 'notebook' | 'pen' | 'recharge' | 'snack' | 'daily' | 'phone' | 'featurePhone' | 'laptop' | 'desktop' | 'monitor' | 'chip' | 'charger' | 'cable' | 'headphones' | 'battery' | 'mouse' | 'keyboard' | 'repair' | 'router' | 'cctv' | 'psu' | 'usbDrive' | 'printer' | 'document' | 'form' | 'idCard' | 'online'
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
  version?: 2 | 3 | 4
  lines: Line[]
  discount: number
  customerId: string | null
  receipts: Receipt[]
  customProducts?: Product[]
  customCustomers?: Customer[]
  transactions?: AccountTransaction[]
}
type Seed = [id: string, code: string, en: string, bn: string, detail: string, detailBn: string,
  category: FormerShopCategory, priceTaka: number, costTaka: number, units: number, art: Product['art'], color: string,
  groupId?: string, variantName?: string, variantNameBn?: string]
const seedProduct = ([id, code, en, bn, detail, detailBn, category, priceTaka, costTaka, units, art, color, groupId, variantName, variantNameBn]: Seed): Product => ({
  id, code, en, bn, detail, detailBn, category, unit: category === 'services' ? 'job' : 'pc',
  price: priceTaka * 100, cost: costTaka * 100, stock: units * 1000, purchased: units * 1000,
  trackStock: category !== 'services', art, color, groupId, variantName, variantNameBn,
})

// The previous demo catalog is retained for migration of saved bills and receipts.
const formerShopProducts: Product[] = ([
  ['mobile-6-128', 'M101', 'Android smartphone · 6/128 GB', 'অ্যান্ড্রয়েড ফোন · ৬/১২৮ জিবি', 'Dual SIM · 4G', 'ডুয়াল সিম · ৪জি', 'mobiles', 16990, 15300, 8, 'phone', '#e5eaf4'],
  ['mobile-8-256', 'M102', 'Android smartphone · 8/256 GB', 'অ্যান্ড্রয়েড ফোন · ৮/২৫৬ জিবি', 'Dual SIM · 5G', 'ডুয়াল সিম · ৫জি', 'mobiles', 24990, 22600, 6, 'phone', '#e7e2f1'],
  ['feature-dual', 'M103', 'Feature phone · dual SIM', 'বাটন ফোন · ডুয়াল সিম', 'Basic calling and SMS', 'কল ও এসএমএস', 'mobiles', 1890, 1450, 18, 'featurePhone', '#e5e9dd'],
  ['feature-4g', 'M104', '4G feature phone', '৪জি বাটন ফোন', 'Dual SIM · 4G', 'ডুয়াল সিম · ৪জি', 'mobiles', 3190, 2690, 10, 'featurePhone', '#e0e8ef'],
  ['laptop-office', 'C201', 'Office laptop · 8/256 GB', 'অফিস ল্যাপটপ · ৮/২৫৬ জিবি', '8 GB RAM · 256 GB SSD', '৮ জিবি র‍্যাম · ২৫৬ জিবি এসএসডি', 'computers', 48900, 45300, 4, 'laptop', '#e3e9ed'],
  ['laptop-advanced', 'C202', 'Laptop · 16/512 GB', 'ল্যাপটপ · ১৬/৫১২ জিবি', '16 GB RAM · 512 GB SSD', '১৬ জিবি র‍্যাম · ৫১২ জিবি এসএসডি', 'computers', 68900, 64800, 3, 'laptop', '#e4e4eb'],
  ['desktop-office', 'C203', 'Desktop PC · 8/256 GB', 'ডেস্কটপ পিসি · ৮/২৫৬ জিবি', 'Tower only · no monitor', 'শুধু সিপিইউ · মনিটর ছাড়া', 'computers', 36500, 33600, 3, 'desktop', '#e8e4dc'],
  ['monitor-22', 'C204', '22-inch LED monitor', '২২ ইঞ্চি এলইডি মনিটর', 'Full HD · HDMI', 'ফুল এইচডি · এইচডিএমআই', 'computers', 8990, 8100, 5, 'monitor', '#e3e9ee'],
  ['ssd-256', 'C205', '256 GB SATA SSD', '২৫৬ জিবি সাটা এসএসডি', 'Internal storage', 'ইন্টারনাল স্টোরেজ', 'computers', 2490, 1900, 12, 'chip', '#e9e7db'],
  ['ram-8', 'C206', '8 GB DDR4 RAM', '৮ জিবি ডিডিআর৪ র‍্যাম', 'Desktop memory', 'ডেস্কটপ মেমোরি', 'computers', 2190, 1700, 10, 'chip', '#e0e9e4'],
  ['router-dual', 'C207', 'Dual-band Wi-Fi router', 'ডুয়াল-ব্যান্ড ওয়াই-ফাই রাউটার', 'Standard · 2.4 / 5 GHz', 'স্ট্যান্ডার্ড · ২.৪ / ৫ গিগাহার্জ', 'computers', 2490, 1950, 9, 'router', '#e0e8f0', 'grp-0-C207', 'Standard', 'স্ট্যান্ডার্ড'],
  ['router-tenda', 'C207-T', 'Dual-band Wi-Fi router', 'ডুয়াল-ব্যান্ড ওয়াই-ফাই রাউটার', 'Tenda · AC1200', 'টেন্ডা · এসি১২০০', 'computers', 2990, 2380, 8, 'router', '#e1eae5', 'grp-0-C207', 'Tenda', 'টেন্ডা'],
  ['router-asus', 'C207-A', 'Dual-band Wi-Fi router', 'ডুয়াল-ব্যান্ড ওয়াই-ফাই রাউটার', 'ASUS · AC1200', 'আসুস · এসি১২০০', 'computers', 4890, 4190, 4, 'router', '#e5e7f0', 'grp-0-C207', 'ASUS', 'আসুস'],
  ['camera-dahua', 'C208-D', 'CCTV camera · 2 MP', 'সিসিটিভি ক্যামেরা · ২ মেগাপিক্সেল', 'Dahua · bullet camera', 'দাহুয়া · বুলেট ক্যামেরা', 'computers', 2290, 1760, 8, 'cctv', '#e8e8e4', 'grp-0-C208', 'Dahua', 'দাহুয়া'],
  ['camera-hikvision', 'C208-H', 'CCTV camera · 2 MP', 'সিসিটিভি ক্যামেরা · ২ মেগাপিক্সেল', 'Hikvision · bullet camera', 'হিকভিশন · বুলেট ক্যামেরা', 'computers', 2450, 1890, 8, 'cctv', '#e5e9e9', 'grp-0-C208', 'Hikvision', 'হিকভিশন'],
  ['psu-deepcool', 'C209-D', 'ATX power supply · 450 W', 'এটিএক্স পাওয়ার সাপ্লাই · ৪৫০ ওয়াট', 'DeepCool · desktop PSU', 'ডিপকুল · ডেস্কটপ পিএসইউ', 'computers', 3490, 2780, 6, 'psu', '#e6e8e7', 'grp-0-C209', 'DeepCool', 'ডিপকুল'],
  ['psu-antec', 'C209-A', 'ATX power supply · 450 W', 'এটিএক্স পাওয়ার সাপ্লাই · ৪৫০ ওয়াট', 'Antec · desktop PSU', 'অ্যানটেক · ডেস্কটপ পিএসইউ', 'computers', 4190, 3370, 5, 'psu', '#e5e5ea', 'grp-0-C209', 'Antec', 'অ্যানটেক'],
  ['cctv-dvr-4', 'C210', '4-channel CCTV DVR', '৪ চ্যানেলের সিসিটিভি ডিভিআর', 'Recorder · storage sold separately', 'রেকর্ডার · হার্ডডিস্ক আলাদা', 'computers', 5990, 4790, 4, 'cctv', '#e5e8ec'],
  ['charger-25w', 'A301', 'USB-C charger · 25 W', 'ইউএসবি-সি চার্জার · ২৫ ওয়াট', 'Standard · adapter only', 'স্ট্যান্ডার্ড · শুধু অ্যাডাপ্টার', 'accessories', 1250, 850, 24, 'charger', '#e5e8e0', 'grp-0-A301', 'Standard', 'স্ট্যান্ডার্ড'],
  ['charger-anker', 'A301-A', 'USB-C charger · 25 W', 'ইউএসবি-সি চার্জার · ২৫ ওয়াট', 'Anker · adapter only', 'অ্যাঙ্কার · শুধু অ্যাডাপ্টার', 'accessories', 1790, 1350, 9, 'charger', '#e4e9e7', 'grp-0-A301', 'Anker', 'অ্যাঙ্কার'],
  ['charger-baseus', 'A301-B', 'USB-C charger · 25 W', 'ইউএসবি-সি চার্জার · ২৫ ওয়াট', 'Baseus · adapter only', 'বেসাস · শুধু অ্যাডাপ্টার', 'accessories', 1490, 1080, 12, 'charger', '#e9e8e2', 'grp-0-A301', 'Baseus', 'বেসাস'],
  ['cable-usbc', 'A302', 'USB-C cable · 1 m', 'ইউএসবি-সি কেবল · ১ মিটার', 'Charging and data', 'চার্জ ও ডাটা', 'accessories', 350, 200, 42, 'cable', '#e8e8e3'],
  ['cable-lightning', 'A303', 'Lightning cable · 1 m', 'লাইটনিং কেবল · ১ মিটার', 'Charging and data', 'চার্জ ও ডাটা', 'accessories', 550, 340, 20, 'cable', '#e9e7e2'],
  ['powerbank-10k', 'A304', 'Power bank · 10,000 mAh', 'পাওয়ার ব্যাংক · ১০,০০০ এমএএইচ', 'Dual output', 'দুটি আউটপুট', 'accessories', 1950, 1450, 15, 'battery', '#e6e6ee'],
  ['screen-guard', 'A305', 'Tempered glass protector', 'টেম্পার্ড গ্লাস প্রটেক্টর', 'Phone screen · each', 'ফোনের স্ক্রিন · প্রতি পিস', 'accessories', 250, 80, 60, 'phone', '#e1ebed'],
  ['phone-case', 'A306', 'Silicone phone case', 'সিলিকন ফোন কভার', 'Assorted models', 'বিভিন্ন মডেল', 'accessories', 350, 150, 50, 'phone', '#eee3e7'],
  ['earbuds-tws', 'A307', 'Wireless earbuds · TWS', 'ওয়্যারলেস ইয়ারবাড · টিডব্লিউএস', 'Charging case included', 'চার্জিং কেসসহ', 'accessories', 1750, 1250, 16, 'headphones', '#e5e5ec'],
  ['earphones-wired', 'A308', 'Wired earphones', 'তারযুক্ত ইয়ারফোন', '3.5 mm connector', '৩.৫ মিমি কানেক্টর', 'accessories', 450, 240, 30, 'headphones', '#e7e7e2'],
  ['mouse-usb', 'A309', 'USB optical mouse', 'ইউএসবি অপটিক্যাল মাউস', 'Wired · plug and play', 'তারযুক্ত · প্লাগ অ্যান্ড প্লে', 'accessories', 650, 400, 20, 'mouse', '#e3e9e9'],
  ['keyboard-usb', 'A310', 'USB keyboard', 'ইউএসবি কিবোর্ড', 'Wired · full size', 'তারযুক্ত · পূর্ণ সাইজ', 'accessories', 850, 580, 15, 'keyboard', '#e8e7e0'],
  ['pendrive-32', 'A311', 'USB flash drive · 32 GB', 'ইউএসবি পেনড্রাইভ · ৩২ জিবি', 'Standard · USB 3.0', 'স্ট্যান্ডার্ড · ইউএসবি ৩.০', 'accessories', 850, 610, 12, 'usbDrive', '#e4e8ec', 'grp-0-A311', 'Standard', 'স্ট্যান্ডার্ড'],
  ['pendrive-samsung', 'A311-S', 'USB flash drive · 32 GB', 'ইউএসবি পেনড্রাইভ · ৩২ জিবি', 'Samsung · USB 3.1', 'স্যামসাং · ইউএসবি ৩.১', 'accessories', 1190, 900, 10, 'usbDrive', '#e3e8ef', 'grp-0-A311', 'Samsung', 'স্যামসাং'],
  ['pendrive-sandisk', 'A311-D', 'USB flash drive · 32 GB', 'ইউএসবি পেনড্রাইভ · ৩২ জিবি', 'SanDisk · USB 3.0', 'স্যানডিস্ক · ইউএসবি ৩.০', 'accessories', 1050, 780, 14, 'usbDrive', '#ece6e3', 'grp-0-A311', 'SanDisk', 'স্যানডিস্ক'],
  ['hdmi-2m', 'A312', 'HDMI cable · 2 m', 'এইচডিএমআই কেবল · ২ মিটার', 'Monitor or TV connection', 'মনিটর বা টিভি সংযোগ', 'accessories', 550, 320, 14, 'cable', '#e6e4e2'],
  ['adapter-65w', 'A313', 'Laptop adapter · 65 W', 'ল্যাপটপ অ্যাডাপ্টার · ৬৫ ওয়াট', 'Check connector before sale', 'বিক্রির আগে কানেক্টর মিলিয়ে নিন', 'accessories', 1950, 1420, 10, 'charger', '#e4e8e0'],
  ['headphones-havit', 'A314-H', 'Over-ear headphones', 'ওভার-ইয়ার হেডফোন', 'Havit · wired', 'হ্যাভিট · তারযুক্ত', 'accessories', 1690, 1240, 9, 'headphones', '#e8e7ed', 'grp-0-A314', 'Havit', 'হ্যাভিট'],
  ['headphones-jbl', 'A314-J', 'Over-ear headphones', 'ওভার-ইয়ার হেডফোন', 'JBL · wired', 'জেবিএল · তারযুক্ত', 'accessories', 3990, 3190, 5, 'headphones', '#e8e4e1', 'grp-0-A314', 'JBL', 'জেবিএল'],
  ['microsd-64', 'A315', 'microSD card · 64 GB', 'মাইক্রোএসডি কার্ড · ৬৪ জিবি', 'Phone or CCTV storage', 'ফোন বা সিসিটিভির স্টোরেজ', 'accessories', 850, 620, 18, 'chip', '#e4e8e4'],
  ['usb-hub-4', 'A316', '4-port USB hub', '৪ পোর্টের ইউএসবি হাব', 'USB-A · plug and play', 'ইউএসবি-এ · প্লাগ অ্যান্ড প্লে', 'accessories', 750, 510, 12, 'usbDrive', '#e6e9e6'],
  ['power-strip-5', 'A317', '5-socket power strip', '৫ সকেটের পাওয়ার স্ট্রিপ', '3-pin plug · switch', '৩-পিন প্লাগ · সুইচ', 'accessories', 1190, 800, 14, 'psu', '#ebe7e2'],
  ['cctv-adapter', 'A318', '12 V CCTV power adapter', '১২ ভোল্টের সিসিটিভি অ্যাডাপ্টার', 'For compatible cameras', 'উপযুক্ত ক্যামেরার জন্য', 'accessories', 450, 280, 20, 'charger', '#e6e8e5'],
  ['screen-cleaner', 'A319', 'Screen cleaning kit', 'স্ক্রিন পরিষ্কারের কিট', 'Spray and cloth', 'স্প্রে ও কাপড়', 'accessories', 350, 180, 25, 'cleaner', '#e2eaeb'],
  ['bnc-connectors', 'A320', 'BNC connector · pair', 'বিএনসি কানেক্টর · এক জোড়া', 'CCTV cable connection', 'সিসিটিভি কেবল সংযোগ', 'accessories', 250, 120, 30, 'cable', '#e9e7e2'],
  ['service-display', 'S401', 'Phone display replacement · labour', 'ফোনের ডিসপ্লে বদল · মজুরি', 'Screen part billed separately', 'স্ক্রিনের দাম আলাদা', 'services', 800, 250, 0, 'repair', '#e8e8dc'],
  ['service-battery', 'S402', 'Phone battery replacement · labour', 'ফোনের ব্যাটারি বদল · মজুরি', 'Battery part billed separately', 'ব্যাটারির দাম আলাদা', 'services', 500, 180, 0, 'repair', '#e3e9df'],
  ['service-software', 'S403', 'Phone software setup', 'ফোন সফটওয়্যার সেটআপ', 'Apps and basic configuration', 'অ্যাপ ও সাধারণ সেটআপ', 'services', 600, 200, 0, 'repair', '#e4e8ed'],
  ['service-cleaning', 'S404', 'Laptop cleaning', 'ল্যাপটপ পরিষ্কার', 'Fan and internal cleaning', 'ফ্যান ও ভেতর পরিষ্কার', 'services', 1200, 400, 0, 'repair', '#e9e7df'],
  ['service-os', 'S405', 'OS and driver setup', 'ওএস ও ড্রাইভার সেটআপ', 'License not included', 'লাইসেন্সের দাম আলাদা', 'services', 1500, 350, 0, 'repair', '#e5e8e8'],
  ['service-transfer', 'S406', 'Data transfer', 'ডাটা স্থানান্তর', 'Phone or computer · basic transfer', 'ফোন বা কম্পিউটার · সাধারণ ডাটা', 'services', 700, 200, 0, 'repair', '#e4e6ee'],
] satisfies Seed[]).map(seedProduct)

export const serviceCategories: ServiceCategory[] = ['printing', 'documents', 'applications', 'government', 'digital']
export const isServiceCategory = (category: Product['category']): boolean => category === 'services' || serviceCategories.includes(category as ServiceCategory)
export const serviceArt = (category: ServiceCategory): Product['art'] => ({
  printing: 'printer', documents: 'document', applications: 'form', government: 'idCard', digital: 'online',
} as const)[category]

type ServiceSeed = [id: string, code: string, en: string, bn: string, detail: string, detailBn: string,
  category: ServiceCategory, unit: ProductUnit, priceTaka: number, costTaka: number]
const serviceColors: Record<ServiceCategory, string> = {
  printing: '#e1eaf0', documents: '#e8e7f0', applications: '#e6eddf', government: '#e9e6dd', digital: '#e2ebe7',
}
const seedService = ([id, code, en, bn, detail, detailBn, category, unit, priceTaka, costTaka]: ServiceSeed): Product => ({
  id, code, en, bn, detail, detailBn, category, unit,
  price: priceTaka * 100, cost: costTaka * 100, stock: 0, purchased: 0,
  trackStock: false, art: serviceArt(category), color: serviceColors[category],
})

// Illustrative counter service fees in BDT. Official application/portal fees are extra.
export const products: Product[] = ([
  ['print-pdf-bw', 'PR101', 'PDF print · B&W A4', 'পিডিএফ প্রিন্ট · সাদা-কালো এ৪', 'Per printed page', 'প্রতি প্রিন্ট করা পৃষ্ঠা', 'printing', 'page', 10, 3],
  ['print-pdf-color', 'PR102', 'PDF print · colour A4', 'পিডিএফ প্রিন্ট · রঙিন এ৪', 'Per printed page', 'প্রতি প্রিন্ট করা পৃষ্ঠা', 'printing', 'page', 25, 10],
  ['photocopy-bw', 'PR103', 'Photocopy · B&W A4', 'ফটোকপি · সাদা-কালো এ৪', 'Per copied side', 'প্রতি কপি করা পিঠ', 'printing', 'page', 5, 2],
  ['photocopy-color', 'PR104', 'Photocopy · colour A4', 'ফটোকপি · রঙিন এ৪', 'Per copied side', 'প্রতি কপি করা পিঠ', 'printing', 'page', 25, 10],
  ['scan-pdf', 'PR105', 'Scan document to PDF', 'ডকুমেন্ট স্ক্যান করে পিডিএফ', 'Per scanned page · digital file', 'প্রতি স্ক্যান করা পৃষ্ঠা · ডিজিটাল ফাইল', 'printing', 'page', 10, 2],
  ['laminate-a4', 'PR106', 'A4 lamination', 'এ৪ লেমিনেশন', 'Per sheet', 'প্রতি শিট', 'printing', 'sheet', 40, 15],
  ['bind-document', 'PR107', 'Document binding', 'ডকুমেন্ট বাঁধাই', 'Simple comb binding · per document', 'সাধারণ কম্ব বাঁধাই · প্রতি ডকুমেন্ট', 'printing', 'job', 80, 35],
  ['passport-photo', 'PR108', 'Passport photo · 4 copies', 'পাসপোর্ট সাইজ ছবি · ৪ কপি', 'One set of four printed photos', 'চারটি প্রিন্ট করা ছবির এক সেট', 'printing', 'set', 100, 25],
  ['photo-print-4r', 'PR109', 'Photo print · 4R', 'ছবি প্রিন্ট · ৪আর', 'Per print', 'প্রতি প্রিন্ট', 'printing', 'pc', 30, 12],

  ['typing-bn', 'DC201', 'Bangla typing', 'বাংলা টাইপিং', 'From supplied text · per page', 'দেওয়া লেখা থেকে · প্রতি পৃষ্ঠা', 'documents', 'page', 70, 10],
  ['typing-en', 'DC202', 'English typing', 'ইংরেজি টাইপিং', 'From supplied text · per page', 'দেওয়া লেখা থেকে · প্রতি পৃষ্ঠা', 'documents', 'page', 50, 8],
  ['cv-design', 'DC203', 'CV / resume design', 'সিভি / জীবনবৃত্তান্ত তৈরি', 'One CV · PDF copy included', 'একটি সিভি · পিডিএফ কপিসহ', 'documents', 'job', 250, 40],
  ['cv-update', 'DC204', 'CV update and formatting', 'সিভি সংশোধন ও ফরম্যাটিং', 'Existing CV · one revision', 'আগের সিভি · একবার সংশোধন', 'documents', 'job', 100, 15],
  ['cover-letter', 'DC205', 'Cover letter writing', 'কভার লেটার লেখা', 'One letter · PDF copy', 'একটি চিঠি · পিডিএফ কপি', 'documents', 'job', 120, 20],
  ['application-letter', 'DC206', 'Application letter typing', 'আবেদনপত্র টাইপিং', 'One letter · supplied details', 'একটি আবেদনপত্র · দেওয়া তথ্য থেকে', 'documents', 'job', 100, 15],
  ['photo-edit', 'DC207', 'Photo resize and background', 'ছবির সাইজ ও ব্যাকগ্রাউন্ড ঠিক করা', 'One digital photo', 'একটি ডিজিটাল ছবি', 'documents', 'job', 60, 5],
  ['pdf-edit', 'DC208', 'PDF edit / merge / split', 'পিডিএফ সম্পাদনা / জোড়া / ভাগ', 'One file task · basic edits', 'একটি ফাইলের কাজ · সাধারণ সম্পাদনা', 'documents', 'job', 50, 5],

  ['govt-job-apply', 'AP301', 'Government job application', 'সরকারি চাকরির আবেদন', 'Form entry & submission · portal fee extra', 'ফরম পূরণ ও জমা · পোর্টালের ফি আলাদা', 'applications', 'job', 150, 20],
  ['private-job-apply', 'AP302', 'Private job application', 'বেসরকারি চাকরির আবেদন', 'One vacancy · required documents supplied', 'একটি পদে · প্রয়োজনীয় কাগজ গ্রাহকের', 'applications', 'job', 100, 10],
  ['university-apply', 'AP303', 'University admission application', 'বিশ্ববিদ্যালয়ে ভর্তির আবেদন', 'One institution · admission fee extra', 'একটি প্রতিষ্ঠানে · ভর্তি ফি আলাদা', 'applications', 'job', 200, 20],
  ['college-apply', 'AP304', 'College admission application', 'কলেজে ভর্তির আবেদন', 'One institution · admission fee extra', 'একটি প্রতিষ্ঠানে · ভর্তি ফি আলাদা', 'applications', 'job', 150, 15],
  ['scholarship-apply', 'AP305', 'Scholarship application', 'বৃত্তির আবেদন', 'One programme · documents supplied', 'একটি কর্মসূচিতে · কাগজপত্র গ্রাহকের', 'applications', 'job', 150, 15],
  ['exam-register', 'AP306', 'Online exam registration', 'অনলাইনে পরীক্ষার নিবন্ধন', 'One exam · registration fee extra', 'একটি পরীক্ষা · নিবন্ধন ফি আলাদা', 'applications', 'job', 120, 10],
  ['admit-card', 'AP307', 'Admit card download & print', 'প্রবেশপত্র ডাউনলোড ও প্রিন্ট', 'One admit card · one B&W print', 'একটি প্রবেশপত্র · একটি সাদা-কালো প্রিন্ট', 'applications', 'job', 30, 4],
  ['result-print', 'AP308', 'Result check & print', 'ফলাফল দেখা ও প্রিন্ট', 'One result · one B&W print', 'একটি ফলাফল · একটি সাদা-কালো প্রিন্ট', 'applications', 'job', 30, 4],

  ['birth-register', 'GV401', 'Birth registration application', 'জন্ম নিবন্ধনের আবেদন', 'Online form help · official fee extra', 'অনলাইন ফরমে সহায়তা · সরকারি ফি আলাদা', 'government', 'job', 200, 20],
  ['birth-correction', 'GV402', 'Birth record correction request', 'জন্ম নিবন্ধন সংশোধনের আবেদন', 'Online request help · official fee extra', 'অনলাইন আবেদনে সহায়তা · সরকারি ফি আলাদা', 'government', 'job', 250, 25],
  ['nid-correction', 'GV403', 'NID correction request', 'জাতীয় পরিচয়পত্র সংশোধনের আবেদন', 'Online request help · official fee extra', 'অনলাইন আবেদনে সহায়তা · সরকারি ফি আলাদা', 'government', 'job', 250, 25],
  ['epassport-apply', 'GV404', 'E-passport application', 'ই-পাসপোর্টের আবেদন', 'Form entry · passport fee extra', 'ফরম পূরণ · পাসপোর্ট ফি আলাদা', 'government', 'job', 300, 30],
  ['police-clearance', 'GV405', 'Police clearance application', 'পুলিশ ক্লিয়ারেন্সের আবেদন', 'Online form help · official fee extra', 'অনলাইন ফরমে সহায়তা · সরকারি ফি আলাদা', 'government', 'job', 300, 30],
  ['e-tin', 'GV406', 'E-TIN registration', 'ই-টিআইএন নিবন্ধন', 'Registration help · account access needed', 'নিবন্ধনে সহায়তা · অ্যাকাউন্টে প্রবেশাধিকার দরকার', 'government', 'job', 200, 20],
  ['land-record', 'GV407', 'Land record / khatian lookup', 'জমির খতিয়ান খোঁজা', 'Search and download · official fee extra', 'খোঁজা ও ডাউনলোড · সরকারি ফি আলাদা', 'government', 'job', 100, 10],
  ['learner-license', 'GV408', 'Learner driving licence application', 'শিক্ষানবিশ ড্রাইভিং লাইসেন্সের আবেদন', 'BRTA online form help · fee extra', 'বিআরটিএ অনলাইন ফরমে সহায়তা · ফি আলাদা', 'government', 'job', 250, 25],

  ['online-form', 'DG501', 'Online form fill & submit', 'অনলাইন ফরম পূরণ ও জমা', 'One form · customer reviews before submission', 'একটি ফরম · জমার আগে গ্রাহক যাচাই করবেন', 'digital', 'job', 100, 10],
  ['email-setup', 'DG502', 'Email account setup', 'ইমেইল অ্যাকাউন্ট তৈরি', 'One account · customer keeps password', 'একটি অ্যাকাউন্ট · পাসওয়ার্ড গ্রাহক রাখবেন', 'digital', 'job', 80, 5],
  ['file-upload', 'DG503', 'File resize and upload', 'ফাইল ছোট করে আপলোড', 'One file · portal limits checked', 'একটি ফাইল · পোর্টালের সীমা দেখে', 'digital', 'job', 50, 5],
  ['file-convert', 'DG504', 'Word / image to PDF', 'ওয়ার্ড / ছবি থেকে পিডিএফ', 'One file conversion', 'একটি ফাইল রূপান্তর', 'digital', 'job', 30, 2],
  ['utility-bill-help', 'DG505', 'Utility bill payment assistance', 'ইউটিলিটি বিল পরিশোধে সহায়তা', 'Service charge only · bill amount extra', 'শুধু সার্ভিস চার্জ · বিলের টাকা আলাদা', 'digital', 'job', 30, 2],
  ['online-fee-help', 'DG506', 'Online fee payment assistance', 'অনলাইনে ফি পরিশোধে সহায়তা', 'Service charge only · payable fee extra', 'শুধু সার্ভিস চার্জ · প্রদেয় ফি আলাদা', 'digital', 'job', 30, 2],
] satisfies ServiceSeed[]).map(seedService)

export const customers: Customer[] = []
// Prior built-in IDs remain available only for saved draft lines. Keeping their
// original IDs and prices avoids silently changing an unfinished bill.
type LegacySeed = [id: string, code: string, en: string, bn: string, detail: string, detailBn: string,
  category: 'staples' | 'fresh' | 'household', unit: ProductUnit, price: number, cost: number, stock: number, art: Product['art'], color: string]
const legacyProducts: Product[] = ([
  ['rice', '101', 'Exercise book', 'এক্সারসাইজ খাতা', '80 pages · ruled', '৮০ পৃষ্ঠা · দাগ টানা', 'staples', 'pc', 7200, 6200, 125000, 'book', '#e8e4d8'],
  ['oil', '102', 'Blue ball pen', 'নীল বলপেন', 'Smooth writing · each', 'মসৃণ লেখা · প্রতি পিস', 'staples', 'pc', 1800, 1200, 48000, 'pen', '#e4eaff'],
  ['egg', '103', 'HB pencil', 'এইচবি পেন্সিল', 'Wooden · each', 'কাঠের · প্রতি পিস', 'staples', 'pc', 1200, 800, 180000, 'pencil', '#f2dfce'],
  ['egg-white', '103W', 'Black ball pen', 'কালো বলপেন', 'Fine tip · each', 'সরু নিব · প্রতি পিস', 'staples', 'pc', 1000, 700, 120000, 'pen', '#fffdfa'],
  ['milk', '104', 'Mobile recharge', 'মোবাইল রিচার্জ', 'All operators · enter amount', 'সব অপারেটর · টাকার পরিমাণ দিন', 'fresh', 'BDT', 100, 98, 24000000, 'recharge', '#e0e8f0'],
  ['sugar', '105', 'Class notebook', 'ক্লাসের খাতা', '120 pages · ruled', '১২০ পৃষ্ঠা · দাগ টানা', 'staples', 'pc', 13500, 11500, 65000, 'notebook', '#e6e5ee'],
  ['tea', '106', 'Drawing book', 'ড্রয়িং খাতা', 'A4 · 40 sheets', 'এ ফোর · ৪০ পাতা', 'staples', 'pc', 11000, 9000, 32000, 'book', '#dee9d8'],
  ['soap', '107', 'Eraser', 'রাবার', 'Soft · each', 'নরম · প্রতি পিস', 'staples', 'pc', 4500, 3000, 56000, 'daily', '#e5ebc9'],
  ['soap-rose', '108', 'Pencil sharpener', 'পেন্সিল কাটার', 'Metal blade · each', 'ধাতব ব্লেড · প্রতি পিস', 'staples', 'pc', 4500, 3000, 38000, 'daily', '#f0dce1'],
  ['flour', '109', '30 cm ruler', '৩০ সেমি স্কেল', 'Clear plastic · each', 'স্বচ্ছ প্লাস্টিক · প্রতি পিস', 'staples', 'pc', 6000, 4000, 44000, 'daily', '#eae0cf'],
  ['lentil', '110', 'Glue stick', 'গ্লু স্টিক', 'Small · each', 'ছোট · প্রতি পিস', 'staples', 'pc', 12000, 9000, 38000, 'daily', '#f0d7c6'],
  ['biscuit', '111', 'Potato chips', 'আলুর চিপস', 'Small packet · each', 'ছোট প্যাকেট · প্রতি পিস', 'household', 'pc', 3000, 2200, 18000, 'snack', '#eaddba'],
  ['salt', '112', 'Electricity meter top-up', 'বিদ্যুৎ মিটার টপ-আপ', 'Prepaid meter · enter amount', 'প্রিপেইড মিটার · টাকার পরিমাণ দিন', 'fresh', 'BDT', 100, 99, 40000000, 'recharge', '#d8e8ed'],
  ['recharge-20', '113', 'Internet recharge', 'ইন্টারনেট রিচার্জ', 'Broadband or data · enter amount', 'ব্রডব্যান্ড বা ডাটা · টাকার পরিমাণ দিন', 'fresh', 'BDT', 100, 97, 50000000, 'recharge', '#e0e8f0'],
  ['recharge-100', '114', 'TV recharge', 'টিভি রিচার্জ', 'DTH or cable · enter amount', 'ডিটিএইচ বা কেবল · টাকার পরিমাণ দিন', 'fresh', 'BDT', 100, 98, 20000000, 'recharge', '#e0e8f0'],
  ['khata-small', '115', 'Pocket notebook', 'পকেট নোটবুক', '40 pages · each', '৪০ পৃষ্ঠা · প্রতি পিস', 'staples', 'pc', 2500, 1700, 30000, 'notebook', '#f1e4ca'],
  ['biscuit-water', '116', 'Bottled water · 500 ml', 'বোতলজাত পানি · ৫০০ মি.লি.', 'Sealed bottle · each', 'সিল করা বোতল · প্রতি পিস', 'household', 'pc', 2000, 1200, 24000, 'daily', '#d8e8ed'],
] satisfies LegacySeed[]).map(([id, code, en, bn, detail, detailBn, category, unit, price, cost, stock, art, color]) => ({
  id, code, en, bn, detail, detailBn, category, unit, price, cost, stock, purchased: stock, art, color, archived: true,
}))
const legacyCustomers: Customer[] = [
  { id: 'c1', en: 'Nadia Rahman', bn: 'নাদিয়া রহমান', phone: '01700 000101', creditLimit: 500000 },
  { id: 'c2', en: 'Karim Ahmed', bn: 'করিম আহমেদ', phone: '01700 000102', creditLimit: 300000 },
  { id: 'c3', en: 'Shila Begum', bn: 'শীলা বেগম', phone: '01700 000103', creditLimit: 200000 },
]
export const initialState: ShopState = {
  version: 4,
  lines: [],
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

export function getProductVariants(product: Product, catalog: Product[] = products): Product[] {
  if (!product.groupId) return [product]
  return catalog.filter(item => item.groupId === product.groupId)
}

export function displayCatalogProducts(catalog: Product[] = products): Product[] {
  const seenGroups = new Set<string>()
  const list: Product[] = []
  for (const p of catalog.filter(item => !item.archived)) {
    if (p.groupId) {
      if (!seenGroups.has(p.groupId)) {
        seenGroups.add(p.groupId)
        list.push(p)
      }
    } else {
      list.push(p)
    }
  }
  return list
}

const BENGALI_DIGITS = '০১২৩৪৫৬৭৮৯'

export function normalizeBengaliDigits(text: string): string {
  return text.replace(/[০-৯]/g, ch => String(BENGALI_DIGITS.indexOf(ch)))
}

export function cleanSearchText(text: string): string {
  return normalizeBengaliDigits(text || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
}

export function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0
  const la = a.length
  const lb = b.length
  if (la === 0) return lb
  if (lb === 0) return la

  const lenDiff = Math.abs(la - lb)
  if (lenDiff > 3) return lenDiff

  const dp: number[][] = []
  for (let i = 0; i <= la; i++) {
    dp[i] = new Array(lb + 1)
    dp[i][0] = i
  }
  for (let j = 0; j <= lb; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= la; i++) {
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= lb; j++) {
      const cb = b.charCodeAt(j - 1)
      const cost = ca === cb ? 0 : 1
      let dist = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
      if (i > 1 && j > 1 && ca === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === cb) {
        dist = Math.min(dist, dp[i - 2][j - 2] + 1)
      }
      dp[i][j] = dist
    }
  }

  return dp[la][lb]
}

const PHONETIC_SYNONYMS: Record<string, string[]> = {
  'মোবাইল': ['mobile', 'mobail', 'phone'],
  'ফোন': ['phone', 'fon'],
  'বাটন': ['button', 'feature'],
  'ল্যাপটপ': ['laptop', 'leptop'],
  'কম্পিউটার': ['computer', 'pc'],
  'ডেস্কটপ': ['desktop', 'pc'],
  'মনিটর': ['monitor', 'display'],
  'চার্জার': ['charger', 'charjar', 'adapter'],
  'অ্যাডাপ্টার': ['adapter', 'charger'],
  'কেবল': ['cable', 'kebol'],
  'ইয়ারফোন': ['earphone', 'headphone'],
  'ইয়ারবাড': ['earbud', 'earbuds', 'tws'],
  'হেডফোন': ['headphone', 'headset'],
  'মাউস': ['mouse', 'maus'],
  'কিবোর্ড': ['keyboard', 'keybord'],
  'পেনড্রাইভ': ['pendrive', 'flashdrive', 'usb'],
  'র‍্যাম': ['ram', 'memory'],
  'এসএসডি': ['ssd', 'storage'],
  'স্ক্রিন': ['screen', 'display'],
  'গ্লাস': ['glass', 'protector'],
  'কভার': ['cover', 'case'],
  'সার্ভিস': ['service', 'repair'],
  'ডিসপ্লে': ['display', 'screen'],
  'ব্যাটারি': ['battery', 'betari'],
  'রাউটার': ['router', 'wifi'],
  'ওয়াই-ফাই': ['wifi', 'router'],
  'সিসিটিভি': ['cctv', 'camera', 'security'],
  'ক্যামেরা': ['camera', 'cctv'],
  'পাওয়ার': ['power', 'psu', 'supply'],
  'পিএসইউ': ['psu', 'power', 'supply'],
  'মাইক্রোএসডি': ['microsd', 'memorycard'],
  'হাব': ['hub', 'usb'],
  'ডাটা': ['data', 'transfer'],
  'সেটআপ': ['setup', 'install'],
  'রিচার্জ': ['recharge', 'topup'],
  'প্রিন্ট': ['print', 'printing'],
  'ফটোকপি': ['photocopy', 'photostat', 'xerox', 'copy'],
  'স্ক্যান': ['scan', 'scanning'],
  'পিডিএফ': ['pdf'],
  'সিভি': ['cv', 'resume', 'biodata'],
  'জীবনবৃত্তান্ত': ['cv', 'resume', 'biodata'],
  'টাইপিং': ['typing', 'type'],
  'আবেদন': ['application', 'apply', 'abedon'],
  'চাকরি': ['job', 'chakri'],
  'ভর্তি': ['admission', 'vorti'],
  'বিশ্ববিদ্যালয়ে': ['university', 'varsity'],
  'পাসপোর্ট': ['passport'],
  'জন্ম': ['birth'],
  'পরিচয়পত্র': ['nid', 'idcard'],
  'ইমেইল': ['email', 'mail'],
  'বিল': ['bill', 'payment'],
}

function extractTokens(text?: string): string[] {
  if (!text) return []
  const cleaned = cleanSearchText(text)
  const rawTokens = cleaned.split(/[\s\-_\.,/:;()·#+*&|~'"!?]+/).filter(Boolean)
  const result = new Set(rawTokens)
  for (const t of rawTokens) {
    const parts = t.match(/([0-9]+|[a-z]+|[\u0980-\u09ff]+)/gi)
    if (parts && parts.length > 1) {
      for (const p of parts) result.add(p)
    }
  }
  return [...result]
}

function scoreTokenMatch(qToken: string, tToken: string): number {
  if (qToken === tToken) return 100

  const qIsDigits = /^\d+$/.test(qToken)
  const tIsDigits = /^\d+$/.test(tToken)

  if (qIsDigits && tIsDigits) {
    if (tToken.startsWith(qToken)) {
      return 75 + Math.round(25 * (qToken.length / tToken.length))
    }
    return 0
  }

  if (tToken.startsWith(qToken)) {
    return 70 + Math.round(25 * (qToken.length / tToken.length))
  }
  if (tToken.includes(qToken) && qToken.length >= 2) {
    return 55
  }
  if (tToken.endsWith(qToken) && qToken.length >= 3) {
    return 60
  }

  // Fuzzy match (for text/words)
  const qLen = qToken.length
  const tLen = tToken.length
  if (qLen < 3) return 0
  if (qIsDigits || tIsDigits) return 0

  const maxDist = qLen <= 4 ? 1 : qLen <= 7 ? 2 : 2
  const d = damerauLevenshtein(qToken, tToken)
  if (d <= maxDist) {
    const similarity = 1 - d / Math.max(qLen, tLen)
    return Math.round(75 * similarity)
  }

  // Fuzzy match against prefix of target token
  if (qLen >= 4 && tLen > qLen) {
    const tPrefix = tToken.slice(0, qLen)
    if (damerauLevenshtein(qToken, tPrefix) <= 1) {
      return 50
    }
  }

  return 0
}

function getSynonymsForTokens(tokens: string[]): string[] {
  const syns = new Set<string>()
  for (const t of tokens) {
    if (!t || t.length < 2) continue
    const direct = PHONETIC_SYNONYMS[t]
    if (direct) {
      for (const s of direct) syns.add(s)
    }
    for (const [key, list] of Object.entries(PHONETIC_SYNONYMS)) {
      if (list.includes(t)) {
        syns.add(key)
        for (const s of list) syns.add(s)
      }
    }
  }
  return [...syns]
}

export function scoreProductVariant(
  v: Product,
  query: string,
  compactQuery?: string,
  queryTokens?: string[]
): number {
  const cleanQ = cleanSearchText(query).trim()
  const compactQ = compactQuery ?? cleanQ.replace(/[\s\-_\.,/:;()·#+*&|~'"!?]+/g, '')
  const qTokens = queryTokens ?? cleanQ.split(/[\s\-_\.,/:;()·#+*&|~'"!?]+/).filter(Boolean)

  if (!cleanQ) return 0

  const code = cleanSearchText(v.code)
  const baseCode = cleanSearchText(v.groupId ? v.groupId.replace(/^grp-\d+-/, '') : '')
  const compactCode = code.replace(/[\s\-]/g, '')
  const compactBaseCode = baseCode.replace(/[\s\-]/g, '')
  const isPureDigits = /^\d+$/.test(compactQ)

  let score = 0

  // 1. Code match boosts
  if (compactQ === compactCode || (compactBaseCode && compactQ === compactBaseCode)) {
    score += 3000
  } else if (compactCode.startsWith(compactQ) || (compactBaseCode && compactBaseCode.startsWith(compactQ))) {
    score += 1500
  } else if (!isPureDigits && (compactCode.includes(compactQ) || (compactBaseCode && compactBaseCode.includes(compactQ)))) {
    score += 600
  } else if (!isPureDigits && compactQ.length >= 3 && (damerauLevenshtein(compactQ, compactCode) <= 1 || (compactBaseCode && damerauLevenshtein(compactQ, compactBaseCode) <= 1))) {
    score += 500
  }

  // 2. Full phrase / Name match
  const enClean = cleanSearchText(v.en)
  const bnClean = cleanSearchText(v.bn)
  const enCompact = enClean.replace(/[\s\-]/g, '')
  const bnCompact = bnClean.replace(/[\s\-]/g, '')

  if (enCompact === compactQ || bnCompact === compactQ) {
    score += 2000
  } else if (enClean.startsWith(cleanQ) || bnClean.startsWith(cleanQ)) {
    score += 1200
  } else if (enCompact.startsWith(compactQ) || bnCompact.startsWith(compactQ)) {
    score += 1000
  } else if (enCompact.includes(compactQ) || bnCompact.includes(compactQ)) {
    score += 700
  }

  // 3. Token-based matching
  const primaryTokens = [
    ...extractTokens(v.en),
    ...extractTokens(v.bn),
    ...extractTokens(v.variantName),
    ...extractTokens(v.variantNameBn),
    ...extractTokens(v.code),
    ...extractTokens(baseCode),
  ]
  const secondaryTokens = [
    ...extractTokens(v.detail),
    ...extractTokens(v.detailBn),
    ...extractTokens(v.id),
    ...extractTokens(v.category),
  ]
  const synTokens = getSynonymsForTokens([...primaryTokens, ...secondaryTokens])

  // Compound check: e.g. ballpen matching [ball, pen]
  for (let i = 0; i < primaryTokens.length - 1; i++) {
    const pair = primaryTokens[i] + primaryTokens[i + 1]
    if (pair === compactQ) {
      score += 900
      break
    }
  }

  if (qTokens.length === 0) return score

  let matchedCount = 0
  let tokenScoreSum = 0

  for (const qToken of qTokens) {
    let best = 0
    for (const pt of primaryTokens) {
      best = Math.max(best, scoreTokenMatch(qToken, pt) * 2.0)
    }
    for (const st of synTokens) {
      best = Math.max(best, scoreTokenMatch(qToken, st) * 1.6)
    }
    for (const st of secondaryTokens) {
      best = Math.max(best, scoreTokenMatch(qToken, st) * 1.0)
    }

    if (best >= 40) {
      matchedCount++
      tokenScoreSum += best
    }
  }

  if (qTokens.length === 1) {
    score += tokenScoreSum
  } else {
    if (matchedCount === qTokens.length) {
      score += tokenScoreSum + 600
    } else if (matchedCount >= Math.ceil(qTokens.length * 0.6)) {
      score += Math.round(tokenScoreSum * (matchedCount / qTokens.length))
    }
  }

  return score
}

export function searchCatalog(
  catalog: Product[] = products,
  query: string = '',
  category: Category = 'recent',
  recentProducts: Product[] = []
): Product[] {
  const cleanQ = cleanSearchText(query).trim()
  const displayList = displayCatalogProducts(catalog)

  if (!cleanQ) {
    return category === 'recent'
      ? recentProducts
      : displayList.filter(p => category === 'all' || p.category === category)
  }

  const compactQ = cleanQ.replace(/[\s\-_\.,/:;()·#+*&|~'"!?]+/g, '')
  const queryTokens = cleanQ.split(/[\s\-_\.,/:;()·#+*&|~'"!?]+/).filter(Boolean)

  const scoredList: { product: Product; score: number }[] = []
  for (const p of displayList) {
    const variants = getProductVariants(p, catalog).filter(v => !v.archived)
    if (!variants.length) continue

    let bestScore = 0
    for (const v of variants) {
      const s = scoreProductVariant(v, cleanQ, compactQ, queryTokens)
      if (s > bestScore) bestScore = s
    }

    // Current category affinity bonus
    if (bestScore > 0 && p.category === category) {
      bestScore += 25
    }

    if (bestScore > 0) {
      scoredList.push({ product: p, score: bestScore })
    }
  }

  scoredList.sort((a, b) => b.score - a.score)
  return scoredList.map(item => item.product)
}

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
export const unitText = (unit: ProductUnit, lang: Lang = 'en') => isMoneyUnit(unit) ? '৳' : lang === 'bn'
  ? ({ kg: 'কেজি', pc: 'পিস', L: 'লি.', BDT: '৳', job: 'কাজ', page: 'পৃষ্ঠা', sheet: 'শিট', set: 'সেট' } as Record<ProductUnit, string>)[unit]
  : unit
export const quantityWithUnit = (scaled: number, unit: ProductUnit, lang: Lang = 'en') => isMoneyUnit(unit)
  ? `৳ ${money(Math.round(scaled / 10))}`
  : `${quantityText(scaled)} ${unitText(unit, lang)}`
const legacyRechargeValues: Record<string, number> = { milk: 90, salt: 50, 'recharge-20': 20, 'recharge-100': 100 }
export function migrateShopState(state: ShopState): ShopState {
  if (state.version === 4) return state
  const oldLines = state.version === 2 || state.version === 3 ? state.lines : state.lines.map(line => legacyRechargeValues[line.productId]
    ? { ...line, quantity: line.quantity * legacyRechargeValues[line.productId] }
    : line)
  const isSampleDraft = state.receipts.length === 0 && state.discount === 0 && state.customerId === null &&
    oldLines.length === 3 && oldLines[0].productId === 'rice' && oldLines[0].quantity === 2000 &&
    oldLines[1].productId === 'egg' && oldLines[1].quantity === 6000 &&
    oldLines[2].productId === 'milk' && oldLines[2].quantity === 90000
  const lines = isSampleDraft ? [] : oldLines
  // Keep user-created items. Retire only the former built-in demo items, while
  // retaining their saved prices for unfinished bills and historical lookup.
  const formerIds = new Set(formerShopProducts.map(product => product.id))
  const customProducts = (state.customProducts ?? []).map(product => formerIds.has(product.id)
    ? { ...product, archived: true }
    : product)
  const knownProducts = new Set([...products, ...customProducts].map(product => product.id))
  const referencedIds = new Set([
    ...lines.map(line => line.productId),
    ...state.receipts.flatMap(receipt => receipt.lines.map(line => line.productId)),
  ])
  for (const id of referencedIds) {
    if (knownProducts.has(id)) continue
    const previous = [...formerShopProducts, ...legacyProducts].find(product => product.id === id)
    if (previous) {
      customProducts.push({ ...previous, archived: true })
      knownProducts.add(previous.id)
    }
  }
  const customCustomers = [...(state.customCustomers ?? [])]
  const knownCustomers = new Set(customCustomers.map(customer => customer.id))
  const referencedCustomers = new Set([
    state.customerId,
    ...state.receipts.map(receipt => receipt.customer?.id),
    ...(state.transactions ?? []).map(transaction => transaction.customerId),
  ])
  for (const customer of legacyCustomers) {
    if (referencedCustomers.has(customer.id) && !knownCustomers.has(customer.id)) customCustomers.push(customer)
  }
  return {
    ...state,
    version: 4,
    lines,
    customProducts,
    customCustomers,
  }
}
export function parseQuantity(value: string, unit: Product['unit']): number | null {
  const pattern = isMoneyUnit(unit) ? /^\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,3})?$/
  if (!pattern.test(value.trim())) return null
  const scaled = Math.round(Number(value) * 1000)
  const maximum = isMoneyUnit(unit) ? 1000000000 : 10000000
  if (scaled <= 0 || scaled > maximum || (['pc', 'job', 'page', 'sheet', 'set'].includes(unit) && scaled % 1000 !== 0)) return null
  return scaled
}
export function parseMoney(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null
  const amount = Math.round(Number(value) * 100)
  return Number.isSafeInteger(amount) && amount <= 100000000 ? amount : null
}
export function stockFor(product: Product, receipts: Receipt[]) {
  if (product.trackStock === false) return 0
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
