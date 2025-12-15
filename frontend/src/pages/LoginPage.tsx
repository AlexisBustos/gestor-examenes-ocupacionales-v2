import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom'; 
import * as z from 'zod';
import { Loader2, Eye, EyeOff, Lock, Mail, ShieldCheck, GitCommit } from 'lucide-react';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- CONTROL DE VERSIONES INTERNO ---
const APP_VERSION = "2.1.0"; 
const BUILD_DATE = "Dic 2025"; 

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/auth/login', data);
            const { token, user } = response.data;
            login(token, user);
            toast.success(`Bienvenido, ${user.name || user.email}`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen grid lg:grid-cols-2">
            
            {/* ---------------------------------------------------------- */}
            {/* SECCIÓN IZQUIERDA: IMAGEN CON FILTRO GESTUM                */}
            {/* ---------------------------------------------------------- */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-900 relative overflow-hidden text-white p-12">
                <div className="absolute inset-0 bg-secondary/80 mix-blend-multiply z-10" />
                
                <img 
                    src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop" 
                    alt="Seguridad Industrial" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 hover:scale-105 transition-transform"
                    style={{ transitionDuration: '20s' }}
                />
                
                <div className="relative z-20">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span>GES Ocupacional</span>
                    </div>
                </div>

                <div className="relative z-20 max-w-lg">
                    <blockquote className="space-y-4">
                        <p className="text-xl font-medium leading-relaxed text-slate-100 drop-shadow-md">
                            La seguridad de tus colaboradores es nuestro compromiso. Gestionamos la salud ocupacional con precisión y transparencia.
                        </p>
                        <footer className="text-sm text-slate-300 font-medium flex items-center gap-4">
                            <span>&copy; 2025 Vitam Healthcare</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs border border-white/20 backdrop-blur-md">
                                v{APP_VERSION}
                            </span>
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECCIÓN DERECHA: FORMULARIO REFINADO                       */}
            {/* ---------------------------------------------------------- */}
            <div className="relative flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
                
                {/* Indicador de Versión */}
                <div className="absolute top-6 right-6 text-[10px] text-slate-400 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-default" title={`Build: ${BUILD_DATE}`}>
                    <GitCommit className="h-3 w-3" />
                    <span>v{APP_VERSION}</span>
                </div>

                {/* Contenedor Principal */}
                <div className="w-full max-w-[400px] space-y-8">
                    
                    {/* Encabezado del Formulario */}
                    <div className="flex flex-col items-center text-center">
                        {/* LOGO AJUSTADO: Tamaño h-40 (Notorio pero equilibrado) */}
                        <div className="mb-6">
                            <img 
                                src="/logo.png" 
                                alt="Logo GESTUM" 
                                className="h-60 w-auto object-contain" 
                            />
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Bienvenido de nuevo
                            </h1>
                            <p className="text-sm text-slate-500">
                                Ingresa tus credenciales para acceder al sistema
                            </p>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Corporativo</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-primary focus:border-transparent"
                                    {...form.register('email')}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500 font-medium ml-1">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                                <Link 
                                    to="/forgot-password" 
                                    className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-2 focus:ring-primary focus:border-transparent"
                                    {...form.register('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500 font-medium ml-1">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button className="w-full h-11 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 font-semibold text-base" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...
                                </>
                            ) : (
                                'Ingresar al Portal'
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <div className="absolute bottom-6 w-full text-center">
                    <div className="text-xs text-slate-400 flex justify-center items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Protected by <strong>Vitam Security Protocol</strong></span>
                    </div>
                </div>

            </div>
        </div>
    );
}