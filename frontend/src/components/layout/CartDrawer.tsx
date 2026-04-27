import { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus, ShoppingBag, Ticket } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { cuponApi } from '../../api/cupon.api';
import { getSocket } from '../../socket';
import { useProductoStore } from '../../stores/productoStore';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [animate] = useState(false);
  const [codigoCupon, setCodigoCupon] = useState('');
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  const [descuento, setDescuento] = useState(0);
  const [mensajeCupon, setMensajeCupon] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { items, subtotal, impuesto, total, updateItem, clearCart } = useCartStore();
  const actualizarPrecioGlobal = useProductoStore((state) => state.actualizarPrecio);
  
  // Calcular totales con descuento
  const totalConDescuento = total - descuento;
  const ahorro = descuento;

  const navigate = useNavigate();

  // Agregar después de los otros estados
  const [mensajeCambioPrecio, setMensajeCambioPrecio] = useState<{ 
    itemId: number;
    nombre: string;
    precioAnterior: number;
    precioNuevo: number
  } | null>(null);

  // Conectar WebSocket y escuchar cambios de precio
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Función para manejar cambio de precio
    const handlePrecioActualizado = (data: any) => {
      const item = items.find(i => i.producto_id === data.productoId);
      if (item) {
        // Mostrar alerta
        setMensajeCambioPrecio({
          itemId: item.id,
          nombre: data.nombre,
          precioAnterior: data.precioAnterior,
          precioNuevo: data.precioNuevo
        });
        
        // Actualizar precio en el store global
        actualizarPrecioGlobal(data.productoId, data.precioNuevo);
        
        // Actualizar el precio en el item del carrito
        const updatedItems = items.map(i => 
          i.producto_id === data.productoId 
            ? { 
                ...i, 
                precio_unitario: data.precioNuevo, 
                subtotal: i.cantidad * data.precioNuevo 
              } 
            : i
        );
        
        // Recalcular subtotal y total
        const nuevoSubtotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        const nuevoImpuesto = nuevoSubtotal * 0.18;
        const nuevoTotal = nuevoSubtotal + nuevoImpuesto;
        
        // Actualizar el store del carrito
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

    return () => {
      socket.off('precio-actualizado', handlePrecioActualizado);
    };
  }, [items]);

  useEffect(() => {
    // Verificar precios cada 30 segundos
    const interval = setInterval(() => {
      verificarCambiosPrecio();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (isOpen) {
      verificarCambiosPrecio();
    }
  }, [isOpen]);

  useEffect(() => {
  const socket = getSocket();
  if (!socket) return;

  // Suscribirse a cada producto en el carrito
  const suscripciones = items.map(item => {
    socket.emit('suscribir-producto', item.producto_id);
    
    // Escuchar cambios de precio
    const handlePrecioActualizado = (data: any) => {
      if (data.productoId === item.producto_id) {
        setMensajeCambioPrecio({
          itemId: item.id,
          nombre: data.nombre,
          precioAnterior: data.precioAnterior,
          precioNuevo: data.precioNuevo
        });
        // Actualizar el precio en el item localmente
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

  return () => {
    suscripciones.forEach(cleanup => cleanup?.());
  };
}, [items]);

  const verificarCambiosPrecio = () => {
    items.forEach(async (item) => {
      try {
        // Obtener precio actual del producto desde el backend
        const response = await fetch(`/api/v1/productos/${item.producto_id}`);
        const data = await response.json();
        const precioActual = data.data.precio_actual;
        
        const precioGuardado = localStorage.getItem(`precio_${item.id}`);
        if (precioGuardado && parseFloat(precioGuardado) !== precioActual) {
          setMensajeCambioPrecio({
            itemId: item.id,
            nombre: item.nombre,
            precioAnterior: parseFloat(precioGuardado),
            precioNuevo: precioActual
          });
          // Actualizar el precio en el store (opcional)
          localStorage.setItem(`precio_${item.id}`, precioActual.toString());
          setTimeout(() => setMensajeCambioPrecio(null), 8000);
        }
      } catch (error) {
        console.error('Error verificando precio:', error);
      }
    });
  };

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
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Alerta de cambio de precio - Debe estar DENTRO del div del carrito, antes de los items */}
            {mensajeCambioPrecio && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💰 <strong>{mensajeCambioPrecio.nombre}</strong>: El precio cambió de 
                  S/ {mensajeCambioPrecio.precioAnterior.toFixed(2)} a 
                  S/ {mensajeCambioPrecio.precioNuevo.toFixed(2)}
                </p>
              </div>
            )}
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
                      {item.stock_disponible !== undefined && item.stock_disponible < 5 && (
                        <p className="text-xs text-orange-500 mt-1">
                          ⚠️ ¡Solo quedan {item.stock_disponible} unidades!
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateItem(item.id, item.cantidad - 1)}
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
                          onClick={() => updateItem(item.id, 0)}
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

          {/* Cupón */}
          {items.length > 0 && (
            <div className="border-t border-b p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Tienes un cupón?
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ingresa tu código"
                    value={codigoCupon}
                    onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                    disabled={!!cuponAplicado}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                {!cuponAplicado ? (
                  <button
                    onClick={aplicarCupon}
                    disabled={aplicandoCupon || !codigoCupon.trim()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 transition"
                  >
                    {aplicandoCupon ? '...' : 'Aplicar'}
                  </button>
                ) : (
                  <button
                    onClick={quitarCupon}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {mensajeCupon && (
                <p className={`text-xs mt-2 ${mensajeCupon.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {mensajeCupon.text}
                </p>
              )}
              {cuponAplicado && cuponAplicado.tipo === 'porcentaje' && (
                <p className="text-xs text-gray-500 mt-1">
                  {cuponAplicado.valor}% de descuento en toda la compra
                </p>
              )}
            </div>
          )}

          {/* Footer con totales */}
          {items.length > 0 && (
            <div className="p-4 space-y-3 bg-white">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento:</span>
                    <span>- S/ {descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuesto (18%):</span>
                  <span>S/ {impuesto.toFixed(2)}</span>
                </div>
                {ahorro > 0 && (
                  <div className="flex justify-between text-xs text-green-500 pt-1 border-t">
                    <span>Ahorro total:</span>
                    <span>S/ {ahorro.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-blue-600">S/ {totalConDescuento.toFixed(2)}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    if (confirm('¿Vaciar todo el carrito?')) {
                      await clearCart();
                      quitarCupon();
                      onClose();
                    }
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Vaciar
                </button>
                <button 
                  onClick={() => {
                    onClose(); // Cerrar el drawer
                    navigate('/checkout');
                  }}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                >
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