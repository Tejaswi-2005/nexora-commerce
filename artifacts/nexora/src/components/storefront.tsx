import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Heart, Menu, Search, ShoppingBag, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import {
  getGetCartQueryKey,
  getGetWishlistQueryKey,
  useAddCartItem,
  useToggleWishlist,
  type Product,
} from '@workspace/api-client-react';

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const queryClient = useQueryClient();
  const cart = queryClient.getQueryData<{ itemCount?: number }>(getGetCartQueryKey());
  const nav = [['Shop', '/shop'], ['New arrivals', '/shop?sort=newest'], ['Journal', '/']].map(([label, href]) => ({ label, href }));
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="bg-[#123044] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-[#f6f0e4]">Complimentary delivery on orders over ₹2,500</div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-5 px-5 lg:px-10">
          <button data-testid="button-mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-sm p-2 md:hidden" aria-label="Open menu"><Menu size={21} /></button>
          <Link href="/" data-testid="link-logo" className="group shrink-0 font-display text-[27px] font-bold tracking-[-0.07em] text-[#123044] dark:text-[#f6f0e4]">NEX<span className="text-primary">O</span>RA</Link>
          <nav className="hidden items-center gap-7 md:flex">
            {nav.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-primary ${location === item.href ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <button data-testid="button-search" onClick={() => setSearchOpen(!searchOpen)} className="rounded-sm p-2.5 transition-colors hover:bg-secondary" aria-label="Search"><Search size={19} strokeWidth={1.7} /></button>
            <Link href="/wishlist" data-testid="link-wishlist" className="hidden rounded-sm p-2.5 transition-colors hover:bg-secondary sm:block" aria-label="Wishlist"><Heart size={19} strokeWidth={1.7} /></Link>
            <Link href="/account" data-testid="link-account" className="hidden rounded-sm p-2.5 transition-colors hover:bg-secondary sm:block" aria-label="Account"><span className="font-mono text-[10px]">ME</span></Link>
            <Link href="/cart" data-testid="link-cart" className="relative rounded-sm p-2.5 transition-colors hover:bg-secondary" aria-label="Cart"><ShoppingBag size={19} strokeWidth={1.7} />{cart?.itemCount ? <span data-testid="text-cart-count" className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] font-bold text-primary-foreground">{cart.itemCount}</span> : null}</Link>
          </div>
        </div>
        {mobileOpen && <div className="border-t border-border bg-background px-5 py-5 md:hidden">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`} className="block border-b border-border py-3 font-display text-xl">{item.label}</Link>)}<Link href="/wishlist" data-testid="link-mobile-wishlist" className="block py-3 font-display text-xl">Saved pieces</Link></div>}
        {searchOpen && <SearchBar close={() => setSearchOpen(false)} />}
      </header>
      <main className="animate-in">{children}</main>
      <footer className="border-t border-[#23465b] bg-[#123044] text-[#f6f0e4]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-10">
          <div><div className="font-display text-3xl font-bold tracking-[-0.06em]">NEX<span className="text-primary">O</span>RA</div><p className="mt-4 max-w-xs text-sm leading-6 text-[#bbcbc9]">Everyday objects with an uncommon point of view. Chosen for their staying power.</p></div>
          <div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8da9a6]">Explore</p>{['Shop all', 'New arrivals', 'Saved pieces'].map((x, i) => <Link key={x} href={['/shop', '/shop?sort=newest', '/wishlist'][i]} data-testid={`link-footer-${i}`} className="mb-3 block text-sm text-[#f6f0e4] transition-colors hover:text-primary">{x}</Link>)}</div>
          <div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8da9a6]">Nexora</p>{['Our edit', 'The journal', 'Shipping & returns'].map((x, i) => <button key={x} data-testid={`button-footer-${i}`} className="mb-3 block text-left text-sm text-[#f6f0e4] transition-colors hover:text-primary">{x}</button>)}</div>
          <div><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8da9a6]">Stay curious</p><p className="mb-4 text-sm leading-6 text-[#bbcbc9]">A quiet dispatch of new objects and old ideas.</p><div className="flex border-b border-[#5b7a7a] pb-2"><input data-testid="input-footer-email" placeholder="Your email address" className="w-full bg-transparent text-sm outline-none placeholder:text-[#8da9a6]" /><button data-testid="button-footer-subscribe" className="font-mono text-[10px] uppercase tracking-widest text-primary">Join</button></div></div>
        </div>
        <div className="mx-auto flex max-w-[1440px] justify-between border-t border-[#23465b] px-5 py-5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#8da9a6] lg:px-10"><span>© 2025 Nexora Goods</span><span>Made for keeping</span></div>
      </footer>
    </div>
  );
}

function SearchBar({ close }: { close: () => void }) {
  const [, setLocation] = useLocation();
  const [q, setQ] = useState('');
  return <div className="border-t border-border bg-background px-5 py-5 lg:px-10"><form className="mx-auto flex max-w-[1440px] items-center gap-3" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { setLocation(`/search?q=${encodeURIComponent(q)}`); close(); } }}><Search size={18} className="text-muted-foreground" /><input autoFocus data-testid="input-global-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects, makers, materials..." className="flex-1 bg-transparent font-display text-xl outline-none placeholder:text-muted-foreground/60" /><button type="button" data-testid="button-close-search" onClick={close} className="p-2 text-muted-foreground"><X size={18} /></button></form></div>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-8 flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}<h2 className="font-display text-3xl font-semibold tracking-[-0.05em] md:text-4xl">{title}</h2></div>{action}</div>;
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const queryClient = useQueryClient();
  const toggle = useToggleWishlist();
  const add = useAddCartItem();
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const image = product.imageUrl || product.gallery?.[0];
  return <article data-testid={`card-product-${product.id}`} className="group product-stagger relative" style={{ animationDelay: `${index * 70}ms` }}>
    <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
      <Link href={`/product/${product.slug}`} data-testid={`link-product-${product.id}`} className="block h-full w-full"><img src={image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]" /></Link>
      <div className="absolute left-3 top-3 flex gap-2">{product.isNew && <span className="bg-[#f6f0e4] px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-[#123044]">New</span>}{product.discountPercent > 0 && <span className="bg-primary px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-primary-foreground">-{product.discountPercent}%</span>}</div>
      <button data-testid={`button-wishlist-${product.id}`} onClick={() => { setSaved(!saved); toggle.mutate({ data: { productId: product.id } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() }) }); }} className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f0e4]/90 transition-all hover:scale-110 ${saved ? 'text-primary' : 'text-[#123044]'}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={16} fill={saved ? 'currentColor' : 'none'} /></button>
      <button data-testid={`button-add-card-${product.id}`} onClick={() => { setAdded(true); add.mutate({ data: { productId: product.id, quantity: 1, color: product.colors?.[0], size: product.sizes?.[0] } }, { onSuccess: (cart) => { queryClient.setQueryData(getGetCartQueryKey(), cart); setTimeout(() => setAdded(false), 1400); } }); }} className="absolute bottom-3 left-3 right-3 translate-y-3 bg-[#123044] py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#f6f0e4] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 disabled:opacity-70">{added ? 'Added to bag' : add.isPending ? 'Adding...' : 'Add to bag'}</button>
    </div>
    <Link href={`/product/${product.slug}`} data-testid={`link-product-info-${product.id}`} className="block pt-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</p><h3 className="mt-1 font-display text-[17px] font-semibold tracking-[-0.025em]">{product.name}</h3><div className="mt-2 flex items-center justify-between"><span className="font-mono text-xs">{money(product.price)}</span>{product.rating > 0 && <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><Star size={11} fill="currentColor" /> {product.rating.toFixed(1)}</span>}</div></Link>
  </article>;
}

export function ProductGrid({ products, loading = false, empty = 'Nothing here yet.' }: { products?: Product[]; loading?: boolean; empty?: string }) {
  if (loading) return <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse"><div className="aspect-[4/5] bg-secondary" /><div className="mt-4 h-2 w-1/3 bg-secondary" /><div className="mt-2 h-4 w-3/4 bg-secondary" /></div>)}</div>;
  if (!products?.length) return <EmptyState title={empty} action={<Link href="/shop" data-testid="link-empty-shop" className="border-b border-primary pb-1 font-mono text-[10px] uppercase tracking-widest text-primary">Browse the edit</Link>} />;
  return <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return <div data-testid="empty-state" className="flex min-h-[300px] flex-col items-center justify-center border border-dashed border-border px-6 text-center"><Sparkles size={22} className="mb-4 text-primary" /><h3 className="font-display text-2xl tracking-[-0.04em]">{title}</h3>{description && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>}{action && <div className="mt-6">{action}</div>}</div>;
}

export function ErrorState({ retry }: { retry?: () => void }) {
  return <div data-testid="error-state" className="flex min-h-[300px] flex-col items-center justify-center border border-border px-6 text-center"><p className="font-mono text-[10px] uppercase tracking-widest text-destructive">Connection interrupted</p><h3 className="mt-2 font-display text-2xl">The edit is taking a breath.</h3><p className="mt-2 text-sm text-muted-foreground">Try again in a moment.</p>{retry && <button data-testid="button-retry" onClick={retry} className="mt-6 border-b border-primary pb-1 font-mono text-[10px] uppercase tracking-widest text-primary">Try again</button>}</div>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className="border-b border-border px-5 pb-12 pt-14 lg:px-10 lg:pb-16 lg:pt-20"><div className="mx-auto max-w-[1440px]"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.95] tracking-[-0.07em] md:text-7xl">{title}</h1>{description && <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>}</div></div>;
}

export function FilterBar({ search, setSearch, sort, setSort }: { search?: string; setSearch: (x: string) => void; sort: string; setSort: (x: string) => void }) {
  return <div className="mb-8 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><SlidersHorizontal size={16} className="text-muted-foreground" /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Filter edit</span>{search !== undefined && <input data-testid="input-product-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or maker" className="w-48 border-b border-border bg-transparent px-1 py-2 text-sm outline-none focus:border-primary" />}</div><label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Sort <select data-testid="select-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="bg-transparent py-2 text-foreground outline-none"><option value="recommended">Recommended</option><option value="newest">Newest</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={13} /></label></div>;
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages < 2) return null;
  return <div className="mt-12 flex items-center justify-center gap-4"><button data-testid="button-prev-page" disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-2 disabled:opacity-30"><ChevronLeft size={18} /></button><span data-testid="text-page" className="font-mono text-[10px] uppercase tracking-widest">{String(page).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}</span><button data-testid="button-next-page" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="p-2 disabled:opacity-30"><ChevronRight size={18} /></button></div>;
}