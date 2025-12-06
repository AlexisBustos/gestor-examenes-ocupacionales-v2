import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssignCostCenterDialog } from './AssignCostCenterDialog';

interface Area {
    id: string;
    name: string;
    companyId: string;
    costCenterId?: string | null;
    costCenter?: { 
        code: string;
        name: string;
    };
}

// Nueva Prop: Recibimos los centros de costos desde el padre
interface AreasListProps {
    costCenters: any[]; 
}

export function AreasList({ costCenters }: AreasListProps) {
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: areas, isLoading } = useQuery({
        queryKey: ['areas'],
        queryFn: async () => {
            const response = await axios.get('/areas');
            return response.data;
        },
    });

    const handleOpenAssignDialog = (area: Area) => {
        setSelectedArea(area);
        setIsDialogOpen(true);
    };

    if (isLoading) return <div className="p-4 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Cargando áreas...</div>;

    return (
        <div className="mt-8 border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Áreas Operativas (Importadas)</h3>
            <p className="text-sm text-gray-500 mb-4">
                Aquí puedes vincular las áreas importadas del Excel a tus Centros de Costos creados.
            </p>

            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-3">Nombre Área</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {areas?.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="p-4 text-center text-gray-400">
                                No se encontraron áreas importadas.
                            </td>
                        </tr>
                    ) : (
                        areas?.map((area: Area) => (
                            <tr key={area.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{area.name}</td>
                                <td className="p-3">
                                    {area.costCenterId ? (
                                        <span className="text-green-600 font-medium text-xs bg-green-100 px-2 py-1 rounded">
                                            Asignado: {area.costCenter?.code}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Sin vincular</span>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleOpenAssignDialog(area)}
                                    >
                                        <Link2 className="h-4 w-4 mr-2" />
                                        {area.costCenterId ? 'Editar' : 'Vincular'}
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {selectedArea && (
                <AssignCostCenterDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    areaId={selectedArea.id}
                    currentCostCenterId={selectedArea.costCenterId}
                    availableCostCenters={costCenters || []} // <--- ¡AQUÍ PASAMOS LA LISTA!
                />
            )}
        </div>
    );
}