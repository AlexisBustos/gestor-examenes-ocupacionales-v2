import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Trash2, Shield } from 'lucide-react';

// Roles disponibles según tu schema
const ROLES = [
  { value: 'ADMIN_VITAM', label: 'Admin Vitam (Super)' },
  { value: 'USER_VITAM', label: 'Equipo Vitam' },
  { value: 'ADMIN_EMPRESA', label: 'Admin Empresa (Gerente)' },
  { value: 'USER_EMPRESA', label: 'Usuario Empresa (Operativo)' },
];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Estado para el formulario de nuevo usuario
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER_EMPRESA', // Rol por defecto
  });

  // 1. Cargar Usuarios Existentes
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await axios.get('/users')).data,
  });

  // 2. Crear Usuario
  const createMutation = useMutation({
    mutationFn: async (newUser: any) => await axios.post('/auth/register', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado correctamente');
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'USER_EMPRESA' }); // Reset
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear usuario');
    }
  });

  // 3. Eliminar Usuario
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
    },
    onError: () => toast.error('Error al eliminar usuario')
  });

  const handleSubmit = () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    createMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 container mx-auto py-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600"><Shield className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra el acceso al sistema.</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="border rounded-md bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                        if(confirm('¿Seguro que quieres eliminar este usuario?')) deleteMutation.mutate(user.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* DIALOGO DE CREACIÓN */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Login)</label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                placeholder="usuario@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol de Acceso</label>
              <Select 
                value={formData.role} 
                onValueChange={(val) => setFormData({...formData, role: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}