import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    try {
      await axios.post('/auth/forgot-password', data);
      setIsEmailSent(true);
      toast.success('Si el correo existe, recibirás instrucciones.');
    } catch (error) {
      toast.error('Ocurrió un error al procesar la solicitud.');
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">¡Correo enviado!</h2>
          <p className="text-slate-600">
            Revisa tu bandeja de entrada. Hemos enviado un enlace para restablecer tu contraseña.
          </p>
          <div className="pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Recuperar Contraseña</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ingresa tu correo y te enviaremos un enlace temporal.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@empresa.com"
              {...register('email', { 
                required: 'El correo es obligatorio',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido"
                }
              })}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar enlace'}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}