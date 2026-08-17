import { Link, useLocation } from "@tanstack/react-router";
import { logoWhite } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CartButton } from "./cart-drawer";
import { useEffect, useState, useRef } from "react";


interface HeaderProps {
  secaoAtiva?: "home" | "sobre" | "faq";
}

export function Header({ secaoAtiva: initialSecao }: HeaderProps) {
  const { pathname } = useLocation();
  const [secaoAtiva, setSecaoAtiva] = useState<"home" | "sobre" | "faq" | null>(initialSecao || null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/") {
      setSecaoAtiva(null);
      return;
    }

    const idParaSecao: Record<string, "home" | "sobre" | "faq"> = { top: "home", sobre: "sobre", faq: "faq" };
    const sections = Object.keys(idParaSecao).map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    
    if (sections.length === 0) return;

    const handleScroll = () => {
      // If we're mid-navigation-click-scroll, let that finish
      if (isScrollingRef.current) return;

      const scrollPos = window.scrollY + window.innerHeight / 3;
      
      let currentSection: "home" | "sobre" | "faq" = "home";
      for (const section of sections) {
        if (scrollPos >= section.offsetTop) {
          currentSection = idParaSecao[section.id];
        }
      }
      setSecaoAtiva(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const scrollToSection = (id: string, secao: "home" | "sobre" | "faq") => {
    isScrollingRef.current = true;
    setSecaoAtiva(secao);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 80, // Offset for header
        behavior: "smooth"
      });
      // Unlock after scroll finishes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };


  const isCatalogo = pathname === "/catalogo";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link to="/" hash="top" className="flex min-w-0 items-center" aria-label="Dakar Essence">
          <img src={logoWhite} alt="Dakar Essence" className="h-12 w-auto sm:h-16 md:h-24" />
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <div className="relative inline-flex rounded-full border border-border/60 bg-card p-1 text-sm">
            <span
              aria-hidden
              className={`absolute top-1 bottom-1 w-24 rounded-full bg-gold transition-all duration-300 ease-out ${
                secaoAtiva ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: "4px",
                transform: `translateX(${
                  secaoAtiva === "home" ? "0" : secaoAtiva === "sobre" ? "96" : secaoAtiva === "faq" ? "192" : "0"
                }px)`,
              }}
            />

            {(
              [
                { id: "top", secao: "home", label: "Home" },
                { id: "sobre", secao: "sobre", label: "Sobre" },
                { id: "faq", secao: "faq", label: "FAQ" },
              ] as const
            ).map((s) => (
              <Link
                key={s.id}
                to="/"
                hash={s.id}
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    scrollToSection(s.id, s.secao);
                  }
                }}
                className={`relative z-10 w-24 rounded-full px-4 py-2 text-center font-medium transition-colors ${
                  secaoAtiva === s.secao ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </Link>
            ))}

          </div>

          <Link
            to="/catalogo"
            className={`relative inline-flex h-[38px] items-center justify-center rounded-full border px-6 text-sm font-medium transition-all ${
              isCatalogo
                ? "border-gold bg-gold text-primary-foreground shadow-md"
                : "border-border/60 bg-card text-muted-foreground hover:border-gold hover:text-gold"
            }`}
          >
            Catálogo
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/rastrear"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-gold hover:text-gold sm:text-sm"
            aria-label="Rastrear pedido"
          >
            <svg
              aria-hidden
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 3h5v5" />
              <path d="M21 3l-7 7" />
              <circle cx="12" cy="12" r="3" />
              <path d="M3 12a9 9 0 0 0 9 9" />
            </svg>
            <span className="hidden sm:inline">Rastrear</span>
          </Link>
          <CartButton />
        </div>
      </div>

      <nav className="flex gap-1 border-t border-border/60 px-2 py-2 md:hidden overflow-x-auto no-scrollbar">
        {(
          [
            { id: "top", secao: "home", label: "Home" },
            { id: "sobre", secao: "sobre", label: "Sobre" },
            { id: "faq", secao: "faq", label: "FAQ" },
          ] as const
        ).map((s) => (
          <Link
            key={s.id}
            to="/"
            hash={s.id}
            className={`flex-1 min-h-11 inline-flex items-center justify-center rounded-full px-2 text-xs font-medium transition ${
              secaoAtiva === s.secao ? "bg-gold text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {s.label}
          </Link>
        ))}
        <Link
          to="/catalogo"
          className={`flex-1 min-h-11 inline-flex items-center justify-center rounded-full px-2 text-xs font-medium transition ${
            isCatalogo ? "bg-gold text-primary-foreground" : "text-muted-foreground border border-border/60"
          }`}
        >
          Catálogo
        </Link>
      </nav>
    </header>
  );
}
