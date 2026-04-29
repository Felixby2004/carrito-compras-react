import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { notify } from '../../utils/notify';
import { getSocket } from '../../socket';
import apiClient from '../../api/client';

type Step = 1 | 2 | 3 | 4 | 5;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, impuesto, total, clearCart, loadCart } = useCartStore();
  const { isAuthenticated, login, checkAuth, user } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  
  // Paso 1: Identificación
  const [identificacion, setIdentificacion] = useState({
    tipo: 'login',
    email: '',
    password: '',
    nombre: '',
    apellido: '',
  });
  
  // Paso 2: Dirección de envío
  const [direcciones, setDirecciones] = useState<any[]>([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>('nueva');
  const [nuevaDireccion, setNuevaDireccion] = useState({
    nombre: '',
    apellido: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    telefono: '',
  });
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  
  // Paso 3: Método de envío
  const [metodosEnvio] = useState([
    { id: 1, nombre: 'Estándar', costo: 10, tiempo: '3-5 días', activo: true },
    { id: 2, nombre: 'Express', costo: 25, tiempo: '1-2 días', activo: true },
    { id: 3, nombre: 'Recojo en tienda', costo: 0, tiempo: '24 horas', activo: true },
  ]);
  const [envioSeleccionado, setEnvioSeleccionado] = useState<number | null>(null);
  
  // Paso 4: Método de pago
  const [metodosPago] = useState([
    { id: 1, nombre: 'Tarjeta de crédito/débito', icon: '💳', simulada: true },
    { id: 2, nombre: 'Transferencia bancaria', icon: '🏦', simulada: true },
    { id: 3, nombre: 'Contra entrega', icon: '💵', simulada: true },
  ]);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<number | null>(null);
  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: '',
  });

  // Verificar autenticación al cargar la página
  useEffect(() => {
    const verificarAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Error verificando auth:', error);
      } finally {
        setAuthChecked(true);
      }
    };
    verificarAuth();
  }, [checkAuth]);

  // Escuchar eventos del socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNuevaOrden = (data: any) => {
      console.log('Nueva orden creada (evento socket):', data);
    };

    const handleCambioEstado = (data: any) => {
      console.log('Cambio de estado de orden (evento socket):', data);
    };

    socket.on('nueva-orden', handleNuevaOrden);
    socket.on('cambio-estado-orden', handleCambioEstado);

    return () => {
      socket.off('nueva-orden', handleNuevaOrden);
      socket.off('cambio-estado-orden', handleCambioEstado);
    };
  }, []);

  // Si está autenticado, saltar al paso 2
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      setCurrentStep(2);
      setIdentificacion(prev => ({ ...prev, tipo: 'autenticado' })); // Indicar al backend que use el token
      cargarDirecciones();
      cargarPerfilAutocompletado();
    }
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    const cupon = sessionStorage.getItem('checkoutCupon');
    if (cupon) {
      try {
        setCuponAplicado(JSON.parse(cupon));
      } catch {
        setCuponAplicado(null);
      }
    }
  }, []);

  // Verificar que el carrito no esté vacío
  useEffect(() => {
    if (items.length === 0 && authChecked) {
      navigate('/carrito');
    }
  }, [items, navigate, authChecked]);

  const cargarDirecciones = async () => {
    try {
      const response = await apiClient.get('/clientes/direcciones');
      setDirecciones(response.data.data || []);
    } catch (error) {
      console.error('Error cargando direcciones:', error);
    }
  };

  const cargarPerfilAutocompletado = async () => {
    try {
      const response = await apiClient.get('/perfil');
      const perfil = response.data?.data;
      const nombreCompleto = perfil?.cliente?.direcciones?.find((d: any) => d.es_principal)?.destinatario || '';
      const [nombre = '', apellido = ''] = nombreCompleto.split(' ');
      setIdentificacion((prev) => ({ ...prev, email: perfil?.email || prev.email }));
      setNuevaDireccion((prev) => ({
        ...prev,
        nombre: perfil?.nombre || nombre || prev.nombre,
        apellido: perfil?.apellido || apellido || prev.apellido,
        telefono: perfil?.cliente?.telefono || prev.telefono,
      }));
    } catch (error) {
      console.error('No se pudo autocompletar perfil', error);
    }
  };

  const handleLogin = async () => {
    setErrorLogin('');
    try {
      await login({ email: identificacion.email, password: identificacion.password });
      setCurrentStep(2);
      await cargarDirecciones();
    } catch (error) {
      setErrorLogin('Credenciales inválidas');
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && identificacion.tipo === 'login') {
      handleLogin();
    } else if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let direccionFinal = null;
      if (direccionSeleccionada === 'nueva') {
        direccionFinal = nuevaDireccion;
      } else {
        const dir = direcciones.find(d => d.id === parseInt(direccionSeleccionada));
        direccionFinal = dir;
      }

      const API_URL = import.meta.env.VITE_API_URL;
      
      const ordenData = {
        items: items.map(item => ({
          producto_id: item.producto_id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        })),
        subtotal,
        impuesto,
        total: totalFinalConCupon,
        costo_envio: getCostoEnvio(),
        cupon_codigo: cuponAplicado?.codigo,
        direccion: {
          nombre: direccionFinal.nombre || direccionFinal.destinatario?.split(' ')[0] || '',
          apellido: direccionFinal.apellido || direccionFinal.destinatario?.split(' ')[1] || '',
          direccion: direccionFinal.direccion_completa || direccionFinal.direccion,
          ciudad: direccionFinal.ciudad,
          departamento: direccionFinal.departamento || '',
          codigo_postal: direccionFinal.codigo_postal || '',
          telefono: direccionFinal.telefono,
        },
        metodo_envio_id: envioSeleccionado,
        metodo_pago: pagoSeleccionado,
        identificacion: {
          tipo: identificacion.tipo,
          email: identificacion.email || user?.email || '',
          password: identificacion.password,
          nombre: identificacion.nombre,
          apellido: identificacion.apellido,
        },
      };
      
      const token = localStorage.getItem('accessToken');
      
      // Permitir continuar si es registro o invitado, o si tiene token
      if (!token && identificacion.tipo === 'login') {
        notify('Debes iniciar sesión para continuar', 'error');
        setLoading(false);
        return;
      }
      
      const response = await apiClient.post('/ordenes', ordenData);
      
      const data = response.data;
      
      if (data.success) {
        notify('Orden completada con exito', 'success');
        sessionStorage.removeItem('checkoutCupon');
        clearCart();
        await loadCart();
        navigate('/mis-ordenes');
      } else {
        notify(data.message || 'Error al procesar la orden', 'error');
      }
    } catch (error: any) {
      console.error('Error:', error);
      const message = error.response?.data?.message || 'Error al procesar la orden';
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (identificacion.tipo === 'login') {
          return identificacion.email && identificacion.password;
        } else if (identificacion.tipo === 'registro') {
          return identificacion.email && identificacion.password && identificacion.nombre && identificacion.apellido;
        }
        return false;
      case 2:
        if (direccionSeleccionada === 'nueva') {
          return nuevaDireccion.direccion && nuevaDireccion.ciudad && nuevaDireccion.telefono;
        }
        return direccionSeleccionada !== '';
      case 3:
        return envioSeleccionado !== null;
      case 4:
        return pagoSeleccionado !== null;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getCostoEnvio = () => {
    return metodosEnvio.find(m => m.id === envioSeleccionado)?.costo || 0;
  };

  const totalFinal = total + getCostoEnvio();
  const totalFinalConCupon = totalFinal - Number(cuponAplicado?.descuento || 0);

  // Si aún está verificando autenticación, mostrar loading
  if (!authChecked) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2">Verificando sesión...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
      
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step}
              </div>
              <span className="text-xs mt-1 hidden sm:block">
                {step === 1 && 'Identificación'}
                {step === 2 && 'Dirección'}
                {step === 3 && 'Envío'}
                {step === 4 && 'Pago'}
                {step === 5 && 'Revisión'}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full rounded">
            <div className="h-1 bg-blue-600 rounded transition-all duration-300" style={{ width: `${(currentStep - 1) * 25}%` }}></div>
          </div>
        </div>
      </div>

      {/* Step Content - igual que antes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Paso 1: Identificación */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Identificación</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="login"
                    checked={identificacion.tipo === 'login'}
                    onChange={() => setIdentificacion({ ...identificacion, tipo: 'login', nombre: '', apellido: '' })}
                  />
                  <span>Iniciar sesión</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="registro"
                    checked={identificacion.tipo === 'registro'}
                    onChange={() => setIdentificacion({ ...identificacion, tipo: 'registro', email: '', password: '' })}
                  />
                  <span>Registrarme</span>
                </label>
              </div>
              
              <div className="space-y-3 mt-4">
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={identificacion.email}
                  onChange={(e) => setIdentificacion({ ...identificacion, email: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={identificacion.password}
                  onChange={(e) => setIdentificacion({ ...identificacion, password: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                {identificacion.tipo === 'registro' && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={identificacion.nombre}
                      onChange={(e) => setIdentificacion({ ...identificacion, nombre: e.target.value })}
                      className="border rounded-lg p-2"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={identificacion.apellido}
                      onChange={(e) => setIdentificacion({ ...identificacion, apellido: e.target.value })}
                      className="border rounded-lg p-2"
                    />
                  </div>
                )}
              </div>
              
              {errorLogin && (
                <p className="text-red-500 text-sm">{errorLogin}</p>
              )}
            </div>
          </div>
        )}

        {/* Paso 2: Dirección de envío */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dirección de envío</h2>
            
            {direcciones.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Seleccionar dirección guardada</label>
                <select
                  value={direccionSeleccionada}
                  onChange={(e) => setDireccionSeleccionada(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="nueva">Usar nueva dirección</option>
                  {direcciones.map((dir) => (
                    <option key={dir.id} value={dir.id}>
                      {dir.alias} - {dir.direccion_completa}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {(direccionSeleccionada === 'nueva' || direcciones.length === 0) && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={nuevaDireccion.nombre}
                    onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, nombre: e.target.value })}
                    className="border rounded-lg p-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Apellido"
                    value={nuevaDireccion.apellido}
                    onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, apellido: e.target.value })}
                    className="border rounded-lg p-2"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Dirección"
                  value={nuevaDireccion.direccion}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, direccion: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={nuevaDireccion.ciudad}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, ciudad: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Departamento"
                  value={nuevaDireccion.departamento}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, departamento: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="Código Postal"
                  value={nuevaDireccion.codigo_postal}
                  onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, codigo_postal: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (9 dígitos)"
                  value={nuevaDireccion.telefono}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                    setNuevaDireccion({ ...nuevaDireccion, telefono: value });
                  }}
                  className="w-full border rounded-lg p-2"
                  required
                  maxLength={9}
                />
              </div>
            )}
          </div>
        )}

        {/* Paso 3: Método de envío */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Método de envío</h2>
            <div className="space-y-3">
              {metodosEnvio.map((metodo) => (
                <label key={metodo.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="envio"
                      value={metodo.id}
                      checked={envioSeleccionado === metodo.id}
                      onChange={() => setEnvioSeleccionado(metodo.id)}
                    />
                    <div>
                      <p className="font-medium">{metodo.nombre}</p>
                      <p className="text-sm text-gray-500">{metodo.tiempo}</p>
                    </div>
                  </div>
                  <p className="font-semibold">{metodo.costo === 0 ? 'Gratis' : `S/ ${metodo.costo.toFixed(2)}`}</p>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Paso 4: Método de pago */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Método de pago</h2>
            <div className="space-y-3">
              {metodosPago.map((metodo) => (
                <div key={metodo.id}>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="pago"
                      value={metodo.id}
                      checked={pagoSeleccionado === metodo.id}
                      onChange={() => setPagoSeleccionado(metodo.id)}
                    />
                    <span className="text-xl">{metodo.icon}</span>
                    <span className="font-medium">{metodo.nombre}</span>
                  </label>
                  
                  {pagoSeleccionado === metodo.id && metodo.id === 1 && (
                    <div className="mt-3 ml-8 p-3 bg-gray-50 rounded-lg space-y-3">
                      <input
                        type="text"
                        placeholder="Número de tarjeta (16 dígitos)"
                        value={tarjeta.numero}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                          setTarjeta({ ...tarjeta, numero: formatted });
                        }}
                        className="w-full border rounded-lg p-2"
                        maxLength={19}
                      />
                      <input
                        type="text"
                        placeholder="Nombre en la tarjeta"
                        value={tarjeta.nombre}
                        onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value.toUpperCase() })}
                        className="w-full border rounded-lg p-2"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={tarjeta.expiracion}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (value.length > 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2);
                            }
                            setTarjeta({ ...tarjeta, expiracion: value });
                          }}
                          className="border rounded-lg p-2"
                          maxLength={5}
                        />
                        <input
                          type="text"
                          placeholder="CVV (3 dígitos)"
                          value={tarjeta.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                            setTarjeta({ ...tarjeta, cvv: value });
                          }}
                          className="border rounded-lg p-2"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 5: Revisión */}
        {currentStep === 5 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Revisión de la orden</h2>
            
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Productos</h3>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2">
                    <span>{item.cantidad}x {item.nombre}</span>
                    <span>S/ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span>{getCostoEnvio() === 0 ? 'Gratis' : `S/ ${getCostoEnvio().toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto (18%):</span>
                  <span>S/ {impuesto.toFixed(2)}</span>
                </div>
                {Number(cuponAplicado?.descuento || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Descuento cupón ({cuponAplicado?.codigo || 'Cupón'}):</span>
                    <span>- S/ {Number(cuponAplicado?.descuento || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">S/ {totalFinalConCupon.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          )}
          <div className="flex-1"></div>
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Confirmar orden'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}