import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-20 border-t border-[#B52A32]/20 bg-gradient-to-b from-transparent to-black md:mt-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-12 md:px-10 md:py-20">
        <div className="md:col-span-7">
          <h2 className="display text-3xl font-bold leading-none text-white md:text-5xl">SEE YOU AT THE EVENT HORIZON.</h2>
          <p className="mt-5"><span className="display text-xl font-bold">HACKMITTEN</span> <span className="mono text-sm text-[#B52A32]">3.0</span></p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm md:col-span-5">
          <nav aria-label="Footer navigation">
            <h3 className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">Quick links</h3>
            {[['Home','/'],['About','/#about'],['Gallery','/#gallery'],['Coordinators','/#coordinators']].map(([label, href]) => <Link key={href} href={href} className="block py-1 text-white/80 hover:text-white">{label}</Link>)}
          </nav>
          <div>
            <h3 className="mono mb-3 text-[10px] uppercase tracking-widest text-[#A8A8A8]">Venue</h3>
            <p className="leading-relaxed text-white/80">Maharaja Institute of Technology Thandavapura</p>
          </div>
        </div>
        <div className="flex flex-col gap-6 border-t border-white/5 pt-7 md:col-span-12 md:flex-row md:items-end md:justify-between">
          <p className="mono text-[10px] uppercase tracking-widest text-[#A8A8A8]">© {new Date().getFullYear()} Hackmitten · All rights reserved</p>
          <Image src="/images/branding/mitt-logo.png" alt="MIT Thandavapura" width={160} height={48} className="h-12 w-auto object-contain" />
        </div>
      </div>
    </footer>
  );
}
