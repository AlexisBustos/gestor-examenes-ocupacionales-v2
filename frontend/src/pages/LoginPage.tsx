import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
            {/* SECCIÓN IZQUIERDA: IMAGEN INDUSTRIAL / INSTITUCIONAL       */}
            {/* ---------------------------------------------------------- */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-900 relative overflow-hidden text-white p-12">
                {/* Imagen de fondo con filtro azul corporativo */}
                <div className="absolute inset-0 bg-blue-950/50 mix-blend-multiply z-10" />
                
                {/* CAMBIO DE IMAGEN: 
                   Ahora usamos una foto de entorno industrial/planta con profesionales usando EPP.
                */}
                <img 
                    src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop" 
                    alt="Seguridad Industrial y Salud Ocupacional" 
                    // 1. En className dejamos solo las clases estándar de Tailwind
                    className="absolute inset-0 w-full h-full object-cover opacity-60 hover:scale-105 transition-transform"
                    // 2. Pasamos la duración exacta por estilo directo para evitar warnings
                    style={{ transitionDuration: '20s' }}
                />
                
                {/* Logo sobre la imagen */}
                <div className="relative z-20">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <span>GES Ocupacional</span>
                    </div>
                </div>

                {/* Cita Corporativa (La que te gustó) */}
                <div className="relative z-20 max-w-lg">
                    <blockquote className="space-y-4">
                        <p className="text-xl font-medium leading-relaxed text-slate-100 drop-shadow-md">
                            La seguridad de tus colaboradores es nuestro compromiso. Gestionamos la salud ocupacional con precisión y transparencia.
                        </p>
                        <footer className="text-sm text-slate-300 font-medium flex items-center gap-4">
                            <span>&copy; 2025 Vitam Healthcare</span>
                            {/* Badge de versión */}
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs border border-white/20 backdrop-blur-md">
                                v{APP_VERSION}
                            </span>
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* SECCIÓN DERECHA: FORMULARIO                                */}
            {/* ---------------------------------------------------------- */}
            <div className="flex items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-900 relative">
                
                {/* Indicador de Versión discreto */}
                <div className="absolute top-4 right-4 text-[10px] text-muted-foreground flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity cursor-default" title={`Build: ${BUILD_DATE}`}>
                    <GitCommit className="h-3 w-3" />
                    <span>v{APP_VERSION}</span>
                </div>

                <div className="mx-auto w-full max-w-[350px] space-y-8">
                    
                    {/* Encabezado Mobile/Desktop */}
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="lg:hidden flex justify-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <ShieldCheck className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                            Iniciar Sesión
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Plataforma de Gestión Vitam
                        </p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Corporativo</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nombre@empresa.com"
                                    className="pl-9 bg-white dark:bg-slate-950 transition-all focus:ring-2 focus:ring-blue-600"
                                    {...form.register('email')}
                                    disabled={isLoading}
                                />
                            </div>
                            {form.formState.errors.email && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Contraseña</Label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-9 pr-9 bg-white dark:bg-slate-950 transition-all focus:ring-2 focus:ring-blue-600"
                                    {...form.register('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-slate-900 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-xs text-red-500 font-medium">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button className="w-full bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg h-10 font-medium" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Accediendo...
                                </>
                            ) : (
                                'Ingresar al Portal'
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-xs text-muted-foreground mt-4 flex justify-center gap-1">
                        <span>Protected by</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Vitam Security Protocol</span>
                    </div>

                </div>
            </div>
        </div>
    );
}