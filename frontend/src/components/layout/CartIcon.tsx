import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

interface CartIconProps {
  onClick: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const items = useCartStore((state) => state.items);
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <button
      onClick={onClick}
      className="relative p-3 rounded-2xl hover:bg-slate-100 transition-all hover:scale-105 shadow-soft"
    >
      <ShoppingBag className="w-7 h-7 text-slate-700" />
      {itemCount > 0 && (
        <span
          className="absolute -top-2 -right-2 text-white text-sm font-black rounded-full w-7 h-7 flex items-center justify-center bg-gradient-accent shadow-glow"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
