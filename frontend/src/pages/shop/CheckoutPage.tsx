import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { ChevronRight, ChevronLeft, CreditCard, Truck, MapPin, User, ShoppingBag, CheckCircle } from 'lucide-react';
import { notify } from '../../utils/notify';
import { getSocket } from '../../socket';
import apiClient from '../../api/client';
import { departamentos, provincias, distritos } from '../../data/ubigeo';
import { Price } from '../../components/Price';

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
    departamento: '',
    provincia: '',
    distrito: '',
    codigo_postal: '',
    telefono: '',
  });
  const [cuponAplicado, setCuponAplicado] = useState<any>(null);
  
  // Paso 3: Método de envío
  const [metodosEnvio] = useState([
    { id: 1, nombre: 'Envío Estándar', costo: 10, tiempo: '3-5 días hábiles', activo: true, icon: '🚚' },
    { id: 2, nombre: 'Envío Express', costo: 25, tiempo: '1-2 días hábiles', activo: true, icon: '⚡' },
    { id: 3, nombre: 'Recojo en Tienda', costo: 0, tiempo: 'Disponible en 24 horas', activo: true, icon: '🏪' },
  ]);
  const [envioSeleccionado, setEnvioSeleccionado] = useState<number | null>(null);
  
  // Paso 4: Método de pago
  const [metodosPago] = useState([
    { id: 1, nombre: 'Tarjeta de crédito/débito', icon: '💳', simulada: true },
    { id: 2, nombre: 'Transferencia bancaria', icon: '🏦', simulada: true },
    { id: 3, nombre: 'Pago contra entrega', icon: '💵', simulada: true },
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
      setIdentificacion(prev => ({ ...prev, tipo: 'autenticado' }));
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
      navigate('/catalogo');
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
          departamento: direccionFinal.departamento || '',
          provincia: direccionFinal.provincia || '',
          distrito: direccionFinal.distrito || '',
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
      
      if (!token && identificacion.tipo === 'login') {
        notify('Debes iniciar sesión para continuar', 'error');
        setLoading(false);
        return;
      }
      
      const response = await apiClient.post('/ordenes', ordenData);
      
      const data = response.data;
      
      if (data.success) {
        notify('¡Orden completada con éxito!', 'success');
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
          return nuevaDireccion.direccion && nuevaDireccion.departamento && nuevaDireccion.telefono;
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

  if (!authChecked) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Verificando sesión...</p>
      </div>
    );
  }

  const steps = [
    { num: 1, title: 'Identificación', icon: User },
    { num: 2, title: 'Dirección', icon: MapPin },
    { num: 3, title: 'Envío', icon: Truck },
    { num: 4, title: 'Pago', icon: CreditCard },
    { num: 5, title: 'Confirmación', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Finalizar Compra</h1>
        <p className="text-gray-500 text-center mb-8">Completa los pasos para realizar tu pedido</p>
        
        {/* Progress Steps */}
        <div className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.num === currentStep;
              const isCompleted = step.num < currentStep;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={step.num} className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 text-white shadow-md' :
                    isActive ? 'bg-[var(--color-primary)] text-white shadow-lg scale-110' : 
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${isActive ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                  {!isLast && (
                    <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                      {isCompleted && (
                        <div className="h-full bg-green-500 transition-all duration-300" style={{ width: '100%' }}></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Paso 1: Identificación */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Inicia sesión o crea una cuenta</h2>
                  <div className="space-y-6">
                    <div className="flex gap-4 bg-gray-50 p-4 rounded-xl">
                      <label className="flex-1 flex items-center gap-3 p-4 rounded-lg cursor-pointer border-2 transition-all hover:border-[var(--color-primary)] bg-white shadow-sm">
                        <input
                          type="radio"
                          value="login"
                          checked={identificacion.tipo === 'login'}
                          onChange={() => setIdentificacion({ ...identificacion, tipo: 'login', nombre: '', apellido: '' })}
                          className="w-5 h-5 text-[var(--color-primary)]"
                        />
                        <div>
                          <span className="font-semibold text-gray-800">Iniciar sesión</span>
                          <p className="text-sm text-gray-500">Ya tienes una cuenta</p>
                        </div>
                      </label>
                      <label className="flex-1 flex items-center gap-3 p-4 rounded-lg cursor-pointer border-2 transition-all hover:border-[var(--color-primary)] bg-white shadow-sm">
                        <input
                          type="radio"
                          value="registro"
                          checked={identificacion.tipo === 'registro'}
                          onChange={() => setIdentificacion({ ...identificacion, tipo: 'registro', email: '', password: '' })}
                          className="w-5 h-5 text-[var(--color-primary)]"
                        />
                        <div>
                          <span className="font-semibold text-gray-800">Registrarme</span>
                          <p className="text-sm text-gray-500">Soy nuevo aquí</p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={identificacion.email}
                        onChange={(e) => setIdentificacion({ ...identificacion, email: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                      />
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={identificacion.password}
                        onChange={(e) => setIdentificacion({ ...identificacion, password: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                      />
                      {identificacion.tipo === 'registro' && (
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Nombre"
                            value={identificacion.nombre}
                            onChange={(e) => setIdentificacion({ ...identificacion, nombre: e.target.value })}
                            className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Apellido"
                            value={identificacion.apellido}
                            onChange={(e) => setIdentificacion({ ...identificacion, apellido: e.target.value })}
                            className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                          />
                        </div>
                      )}
                    </div>
                    
                    {errorLogin && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <span className="text-red-600 font-medium">{errorLogin}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 2: Dirección de envío */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Dirección de envío</h2>
                  
                  {direcciones.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Seleccionar dirección guardada</label>
                      <select
                        value={direccionSeleccionada}
                        onChange={(e) => setDireccionSeleccionada(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
                      >
                        <option value="nueva">+ Usar nueva dirección</option>
                        {direcciones.map((dir) => (
                          <option key={dir.id} value={dir.id}>
                            {dir.alias} - {dir.direccion_completa}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {(direccionSeleccionada === 'nueva' || direcciones.length === 0) && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={nuevaDireccion.nombre}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, nombre: e.target.value })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Apellido"
                          value={nuevaDireccion.apellido}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, apellido: e.target.value })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Dirección completa (calle, número, referencia)"
                        value={nuevaDireccion.direccion}
                        onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, direccion: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                        required
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <select
                          value={nuevaDireccion.departamento}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, departamento: e.target.value, provincia: '', distrito: '' })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
                        >
                          <option value="">Departamento</option>
                          {departamentos.map(dep => (
                            <option key={dep.id} value={dep.nombre}>{dep.nombre}</option>
                          ))}
                        </select>
                        <select
                          value={nuevaDireccion.provincia}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, provincia: e.target.value, distrito: '' })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
                          disabled={!nuevaDireccion.departamento}
                        >
                          <option value="">Provincia</option>
                          {provincias[departamentos.find(d => d.nombre === nuevaDireccion.departamento)?.id || '']?.map(prov => (
                            <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
                          ))}
                        </select>
                        <select
                          value={nuevaDireccion.distrito}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, distrito: e.target.value })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none bg-white"
                          disabled={!nuevaDireccion.provincia}
                        >
                          <option value="">Distrito</option>
                          {distritos[Object.values(provincias).flat().find(p => p.nombre === nuevaDireccion.provincia)?.id || '']?.map(dist => (
                            <option key={dist.id} value={dist.nombre}>{dist.nombre}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Código Postal"
                          value={nuevaDireccion.codigo_postal}
                          onChange={(e) => setNuevaDireccion({ ...nuevaDireccion, codigo_postal: e.target.value })}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Teléfono (9 dígitos)"
                          value={nuevaDireccion.telefono}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                            setNuevaDireccion({ ...nuevaDireccion, telefono: value });
                          }}
                          className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                          required
                          maxLength={9}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 3: Método de envío */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Método de envío</h2>
                  <div className="space-y-4">
                    {metodosEnvio.map((metodo) => (
                      <label 
                        key={metodo.id} 
                        className={`flex items-center justify-between p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                          envioSeleccionado === metodo.id 
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-lg' 
                            : 'border-gray-200 hover:border-[var(--color-primary)]/50 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="envio"
                            value={metodo.id}
                            checked={envioSeleccionado === metodo.id}
                            onChange={() => setEnvioSeleccionado(metodo.id)}
                            className="w-5 h-5 text-[var(--color-primary)]"
                          />
                          <div className="text-3xl">{metodo.icon}</div>
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">{metodo.nombre}</p>
                            <p className="text-sm text-gray-500">{metodo.tiempo}</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-gray-800">
                          {metodo.costo === 0 ? '🎉 Gratis' : <Price value={metodo.costo} />}
                        </p>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Paso 4: Método de pago */}
              {currentStep === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Método de pago</h2>
                  <div className="space-y-4">
                    {metodosPago.map((metodo) => (
                      <div key={metodo.id}>
                        <label 
                          className={`flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                            pagoSeleccionado === metodo.id 
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-lg' 
                              : 'border-gray-200 hover:border-[var(--color-primary)]/50 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pago"
                            value={metodo.id}
                            checked={pagoSeleccionado === metodo.id}
                            onChange={() => setPagoSeleccionado(metodo.id)}
                            className="w-5 h-5 text-[var(--color-primary)]"
                          />
                          <span className="text-3xl">{metodo.icon}</span>
                          <span className="font-semibold text-gray-800 text-lg">{metodo.nombre}</span>
                        </label>
                        
                        {pagoSeleccionado === metodo.id && metodo.id === 1 && (
                          <div className="mt-4 ml-8 p-6 bg-gray-50 rounded-2xl space-y-4 border border-gray-200">
                            <input
                              type="text"
                              placeholder="Número de tarjeta (16 dígitos)"
                              value={tarjeta.numero}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                                const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                                setTarjeta({ ...tarjeta, numero: formatted });
                              }}
                              className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                              maxLength={19}
                            />
                            <input
                              type="text"
                              placeholder="Nombre en la tarjeta"
                              value={tarjeta.nombre}
                              onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value.toUpperCase() })}
                              className="w-full border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                            />
                            <div className="grid grid-cols-2 gap-4">
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
                                className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
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
                                className="border border-gray-200 rounded-xl p-4 text-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
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
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Revisa tu pedido</h2>
                  
                  <div className="space-y-6">
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" /> Productos
                      </h3>
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between py-3 items-center">
                          <div className="flex items-center gap-4">
                            <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-semibold text-gray-700">
                              {item.cantidad}x
                            </span>
                            <span className="text-gray-700">{item.nombre}</span>
                          </div>
                          <span className="font-semibold text-gray-800"><Price value={item.subtotal} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>
                )}
                <div className="flex-1"></div>
                {currentStep < 5 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
                  >
                    Continuar
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !canProceed()}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Procesando...' : 'Confirmar orden'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Resumen de la compra</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
                  <Price value={subtotal} />
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{getCostoEnvio() === 0 ? 'Gratis' : <Price value={getCostoEnvio()} />}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Impuesto (18%)</span>
                  <Price value={impuesto} />
                </div>
                {Number(cuponAplicado?.descuento || 0) > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Descuento ({cuponAplicado?.codigo || 'Cupón'})</span>
                    <span>- <Price value={Number(cuponAplicado?.descuento || 0)} /></span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 mb-6">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  <Price value={totalFinalConCupon} />
                </span>
              </div>

              {/* Mini cart preview */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-700 mb-4">Tu pedido</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-semibold text-gray-600">
                        {item.cantidad}x
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 truncate">{item.nombre}</p>
                      </div>
                      <Price value={item.subtotal} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}