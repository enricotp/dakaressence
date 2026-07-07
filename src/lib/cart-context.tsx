import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type CartMap = Record<string, number>;

type CartContextValue = {
  cart: CartMap;
  cartCount: number;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "dakar-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartMap>({});
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
    return {
      cart,
      cartCount,
      add: (id) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })),
      remove: (id) =>
        setCart((c) => {
          const next = { ...c };
          if (!next[id]) return c;
          next[id] -= 1;
          if (next[id] <= 0) delete next[id];
          return next;
        }),
      clear: () => setCart({}),
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [cart, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
