import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#123044] px-5 text-center text-[#f6f0e4]">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Nexora / 404</p><h1 className="mt-5 font-display text-[clamp(5rem,16vw,12rem)] font-semibold leading-[.8] tracking-[-.12em]">Lost<br/><span className="text-primary">object.</span></h1><p className="mx-auto mt-8 max-w-sm text-sm leading-6 text-[#b9ceca]">This page has gone somewhere else. The good news is that there are plenty of good things still here.</p><Link href="/shop" data-testid="link-404-shop" className="mt-8 inline-flex items-center gap-3 border border-primary bg-primary px-5 py-4 font-mono text-[10px] uppercase tracking-widest text-[#123044]">Return to the edit <ArrowRight size={14}/></Link></div>
    </div>
  );
}
