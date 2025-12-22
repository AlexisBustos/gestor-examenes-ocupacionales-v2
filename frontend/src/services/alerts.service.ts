import axios from '@/lib/axios';

export interface AlertItem {
    type: 'PRESCRIPCION' | 'EXAMENES_GES' | 'DOCUMENTACION' | 'EXAMEN_TRABAJADOR';
    id: string;
    title: string;       
    company: string;     
    date: string;        
    daysLeft: number;    
    status: 'VENCIDO' | 'POR_VENCER' | 'VIGENTE';
    details: string;
    // 👇 NUEVO CAMPO OPCIONAL
    redirectData?: {
        companyId?: string;
        action?: string;
        reportId?: string;
        gesId?: string;
        workerRut?: string;
        tab?: string;
    };
}

export interface AlertsSummary {
    summary: {
        total: number;
        expired: number;
        warning: number;
    };
    items: AlertItem[];
}

export const getDashboardAlerts = async (): Promise<AlertsSummary> => {
    const response = await axios.get('/alerts/dashboard');
    return response.data;
};