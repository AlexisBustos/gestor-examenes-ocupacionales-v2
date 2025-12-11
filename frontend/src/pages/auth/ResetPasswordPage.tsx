import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    if (!token) {
        toast.error('Token inválido.');
        return;
    }
    try {
      await axios.post('/auth/reset-password', {
        token,
        newPassword: data.password
      });
      setSuccess(true);
      toast.success('Contraseña actualizada correctamente');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'El enlace ha expirado.');
    }
  };

  const password = watch("password");

  if (!token) return <div className="min-h-screen flex items-center justify-center text-red-600">Enlace inválido o incompleto.</div>;

  if (success) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-4">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">¡Listo!</h2>
                <p className="text-slate-600">Tu contraseña ha sido actualizada.</p>
                <Button onClick={() => navigate('/login')} className="w-full">Ir al Login</Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Nueva Contraseña</h2>
          <p className="mt-2 text-sm text-slate-600">Crea una contraseña segura.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Nueva Contraseña</Label>
                    <Input id="password" type="password" 
                        {...register('password', { required: 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres'} })} 
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password.message as string}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmar</Label>
                    <Input id="confirm" type="password" 
                        {...register('confirm', { validate: v => v === password || "No coinciden" })} 
                    />
                    {errors.confirm && <p className="text-sm text-red-500">{errors.confirm.message as string}</p>}
                </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Cambiar Contraseña'}
            </Button>
        </form>
      </div>
    </div>
  );
}