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
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <ShoppingBag className="w-6 h-6" style={{ color: 'var(--color-secondary, #334155)' }} />
      {itemCount > 0 && (
        <span
          className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-accent, #ef4444)' }}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}