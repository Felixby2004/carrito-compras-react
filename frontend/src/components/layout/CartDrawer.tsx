import { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus, ShoppingBag, Ticket, CreditCard } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { cuponApi } from '../../api/cupon.api';
import { getSocket } from '../../socket';
import { useProductoStore } from '../../stores/productoStore';
import { useNavigate } from 'react-router-dom';
import { Price } from '../Price';
import { fixImageUrl } from '../../utils/images';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [codigoCupon, setCodigoCupon] = useState('');
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [descuento, setDescuento] = useState(0);
  const [mensajeCupon, setMensajeCupon] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [mostrarCupon, setMostrarCupon] = useState(false);
  
  const { items, subtotal, impuesto, total, updateItem, clearCart } = useCartStore();
  const actualizarPrecioGlobal = useProductoStore((state) => state.actualizarPrecio);
  
  const totalConDescuento = total - descuento;
  const ahorro = descuento;
  const navigate = useNavigate();

  const [mensajeCambioPrecio, setMensajeCambioPrecio] = useState<{ 
    itemId: number;
    nombre: string;
    precioAnterior: number;
    precioNuevo: number
  } | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handlePrecioActualizado = (data: any) => {
      const item = items.find(i => i.producto_id === data.productoId);
      if (item) {
        setMensajeCambioPrecio({
          itemId: item.id,
          nombre: data.nombre,
          precioAnterior: data.precioAnterior,
          precioNuevo: data.precioNuevo
        });
        actualizarPrecioGlobal(data.productoId, data.precioNuevo);
        const updatedItems = items.map(i => 
          i.producto_id === data.productoId 
            ? { ...i, precio_unitario: data.precioNuevo, subtotal: i.cantidad * data.precioNuevo } 
            : i
        );
        const nuevoSubtotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        const nuevoImpuesto = nuevoSubtotal * 0.18;
        const nuevoTotal = nuevoSubtotal + nuevoImpuesto;
        useCartStore.setState({ 
          items: updatedItems,
          subtotal: nuevoSubtotal,
          impuesto: nuevoImpuesto,
          total: nuevoTotal
        });
        setTimeout(() => setMensajeCambioPrecio(null), 8000);
      }
    };
    socket.on('precio-actualizado', handlePrecioActualizado);
    return () => { socket.off('precio-actualizado', handlePrecioActualizado); };
  }, [items]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const suscripciones = items.map(item => {
      socket.emit('suscribir-producto', item.producto_id);
      const handlePrecioActualizado = (data: any) => {
        if (data.productoId === item.producto_id) {
          setMensajeCambioPrecio({
            itemId: item.id,
            nombre: data.nombre,
            precioAnterior: data.precioAnterior,
            precioNuevo: data.precioNuevo
          });
          const updatedItems = items.map(i => 
            i.id === item.id ? { ...i, precio_unitario: data.precioNuevo, subtotal: i.cantidad * data.precioNuevo } : i
          );
          useCartStore.setState({ items: updatedItems });
          setTimeout(() => setMensajeCambioPrecio(null), 8000);
        }
      };
      socket.on('precio-actualizado', handlePrecioActualizado);
      return () => {
        socket.off('precio-actualizado', handlePrecioActualizado);
        socket.emit('unsuscribir-producto', item.producto_id);
      };
    });
    return () => { suscripciones.forEach(cleanup => cleanup?.()); };
  }, [items]);

  useEffect(() => {
    if (cuponAplicado && subtotal > 0) {
      if (cuponAplicado.monto_minimo && subtotal < cuponAplicado.monto_minimo) {
        quitarCupon();
        setMensajeCupon({ 
          text: `❌ Cupón removido: El monto mínimo es S/ ${cuponAplicado.monto_minimo.toFixed(2)}`, 
          type: 'error' 
        });
        return;
      }
      if (cuponAplicado.tipo === 'porcentaje') {
        const nuevoDescuento = subtotal * (cuponAplicado.valor / 100);
        setDescuento(nuevoDescuento);
      } else if (cuponAplicado.tipo === 'fijo') {
        setDescuento(cuponAplicado.valor > subtotal ? subtotal : cuponAplicado.valor);
      }
    }
  }, [subtotal, cuponAplicado]);

  const aplicarCupon = async () => {
    if (!codigoCupon.trim()) {
      setMensajeCupon({ text: 'Ingresa un código de cupón', type: 'error' });
      return;
    }
    setAplicandoCupon(true);
    setMensajeCupon(null);
    try {
      const result = await cuponApi.validarCupon(codigoCupon.toUpperCase(), subtotal);
      if (result.success) {
        setCuponAplicado(result.data);
        setDescuento(result.data.descuento);
        sessionStorage.setItem('checkoutCupon', JSON.stringify(result.data));
        setMensajeCupon({ 
          text: `✅ Cupón aplicado: ${result.data.tipo === 'porcentaje' ? `${result.data.valor}% de descuento` : `S/ ${result.data.descuento.toFixed(2)} de descuento`}`, 
          type: 'success' 
        });
      } else {
        setMensajeCupon({ text: `❌ ${result.message}`, type: 'error' });
      }
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al validar cupón';
      setMensajeCupon({ text: `❌ ${mensaje}`, type: 'error' });
    } finally {
      setAplicandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCodigoCupon('');
    setCuponAplicado(null);
    setDescuento(0);
    setMensajeCupon(null);
    sessionStorage.removeItem('checkoutCupon');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <h2 className="text-xl font-bold">Mi Carrito</h2>
            <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{items.length}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
          {mensajeCambioPrecio && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                💰 <strong>{mensajeCambioPrecio.nombre}</strong>: El precio cambió de 
                S/ {mensajeCambioPrecio.precioAnterior.toFixed(2)} a 
                S/ {mensajeCambioPrecio.precioNuevo.toFixed(2)}
              </p>
            </div>
          )}
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm mt-1">¡Agrega productos para empezar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                  <div className="relative">
                    <img
                      src={fixImageUrl(item.imagen)}
                      alt={item.nombre}
                      className="w-20 h-20 object-contain p-1 bg-slate-50 rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate text-sm">{item.nombre}</h3>
                    <p className="text-xs font-bold text-[var(--color-primary)] mt-1">
                      <Price value={item.precio_unitario} />
                    </p>
                    {item.stock_disponible !== undefined && item.stock_disponible < 5 && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">
                        ⚠️ ¡Solo quedan {item.stock_disponible} unidades!
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-gray-100 rounded-lg">
                        <button
                          onClick={() => updateItem(item.id, item.cantidad - 1)}
                          className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-bold text-gray-800 text-sm">{item.cantidad}</span>
                        <button
                          onClick={() => updateItem(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= (item.stock_disponible || 0)}
                          className={`p-1.5 rounded-r-lg transition-colors ${
                            item.cantidad >= (item.stock_disponible || 0)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'hover:bg-gray-200'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                      <button
                        onClick={() => updateItem(item.id, 0)}
                        className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col justify-between">
                    <p className="font-bold text-base text-gray-800"><Price value={item.subtotal} /></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <>
            <div className="border-t border-gray-100 bg-white">
              <button
                onClick={() => setMostrarCupon(!mostrarCupon)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Ticket className="w-4 h-4" />
                  {cuponAplicado ? (
                    <>✅ Cupón aplicado: {cuponAplicado.codigo}</>
                  ) : (
                    <>¿Tienes un cupón?</>
                  )}
                </span>
                <span className="text-gray-400 text-sm">{mostrarCupon ? '▲' : '▼'}</span>
              </button>
              {mostrarCupon && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Ingresa tu código"
                        value={codigoCupon}
                        onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                        disabled={!!cuponAplicado}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all outline-none"
                      />
                    </div>
                    {!cuponAplicado ? (
                      <button
                        onClick={aplicarCupon}
                        disabled={aplicandoCupon || !codigoCupon.trim()}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {aplicandoCupon ? '...' : 'Aplicar'}
                      </button>
                    ) : (
                      <button
                        onClick={quitarCupon}
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {mensajeCupon && (
                    <p className={`text-xs font-medium ${mensajeCupon.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {mensajeCupon.text}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="p-4 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span className="font-medium">Subtotal:</span>
                  <Price value={subtotal} />
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-green-600 font-medium text-sm">
                    <span>Descuento:</span>
                    <span>- <Price value={descuento} /></span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-sm">
                  <span className="font-medium">Impuesto (18%):</span>
                  <span><Price value={impuesto} /></span>
                </div>
                {ahorro > 0 && (
                  <div className="flex justify-between text-green-500 text-xs font-semibold pt-1 border-t border-dashed border-gray-200">
                    <span>🎉 Ahorro total:</span>
                    <span><Price value={ahorro} /></span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-gray-800">Total:</span>
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  <Price value={totalConDescuento} />
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={async () => {
                    if (confirm('¿Vaciar todo el carrito?')) {
                      await clearCart();
                      quitarCupon();
                      onClose();
                    }
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Vaciar
                </button>
                <button 
                  onClick={() => { onClose(); navigate('/checkout'); }}
                  className="flex-[2] text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <CreditCard className="w-4 h-4" />
                  Proceder al Pago
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
