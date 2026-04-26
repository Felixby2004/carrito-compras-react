import { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus, ShoppingBag  } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, subtotal, impuesto, total, updateItem, removeItem, clearCart } = useCartStore();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnimate(true);
    } else {
      setTimeout(() => setAnimate(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !animate) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold">Mi Carrito</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <img
                      src={item.imagen || 'https://placehold.co/80x80?text=Producto'}
                      alt={item.nombre}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.nombre}</h3>
                      <p className="text-sm text-gray-600">
                        S/ {item.precio_unitario.toFixed(2)} c/u
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => {
                            if (item.cantidad > 1) {
                              updateItem(item.id, item.cantidad - 1);
                            } else {
                              if (confirm(`¿Eliminar ${item.nombre}?`)) {
                                removeItem(item.id);
                              }
                            }
                          }}
                          className="bg-gray-100 p-1 rounded hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                        <button
                          onClick={() => updateItem(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= (item.stock_disponible || 0)}
                          className={`p-1 rounded ${
                            item.cantidad >= (item.stock_disponible || 0)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar ${item.nombre} del carrito?`)) {
                              removeItem(item.id);
                            }
                          }}
                          className="ml-auto text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">S/ {item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Impuesto (18%):</span>
                <span>S/ {impuesto.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">S/ {total.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                onClick={async () => {
                    if (confirm('¿Vaciar todo el carrito?')) {
                    await clearCart();
                    onClose(); // Cierra el drawer después de vaciar
                    }
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                Vaciar
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition">
                  Proceder al Pago
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}