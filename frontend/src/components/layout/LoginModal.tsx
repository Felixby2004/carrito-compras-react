import { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { notify } from '../../utils/notify';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const { login, register } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        const user = await register({
          email,
          password,
          password_confirmacion: passwordConfirmacion,
          nombre,
          apellido,
        });
        notify('Registro exitoso', 'success');
        onClose();
        
        // Redirigir según el rol
        const roles = (user as any)?.roles || [];
        const isPanelRole = roles.some((r: string) =>
          ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(r),
        );
        navigate(isPanelRole ? '/admin' : '/');
      } else {
        const user = await login({ email, password });
        notify('Login exitoso', 'success');
        onClose();
        
        // Redirigir según el rol
        const roles = user.roles || [];
        const isPanelRole = roles.some((r) =>
          ['administrador', 'admin', 'gerente', 'gerente_ventas', 'gerente_inventario', 'vendedor'].includes(r),
        );
        navigate(isPanelRole ? '/admin' : '/');
      }
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setPasswordConfirmacion('');
    } catch (error) {
      notify(isRegister ? 'Error en registro' : 'Error en login', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notify('Ingresa tu correo para recuperar contraseña.', 'info');
      return;
    }
    try {
      await authApi.forgotPassword(email);
      notify('Si el correo existe, te enviamos un enlace de recuperación.', 'success');
    } catch (error) {
      notify('No se pudo enviar la recuperación en este momento.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister 
              ? 'Regístrate para comenzar a comprar' 
              : 'Ingresa tus credenciales'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />

          {isRegister && (
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={passwordConfirmacion}
              onChange={(e) => setPasswordConfirmacion(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (isRegister ? 'Registrarse' : 'Ingresar')}
          </button>
        </form>

        <div className="text-center mt-4">
          {!isRegister && (
            <button
              onClick={handleForgotPassword}
              className="text-sm text-gray-600 hover:underline mr-3"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline text-sm"
          >
            {isRegister 
              ? '¿Ya tienes cuenta? Inicia sesión' 
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}