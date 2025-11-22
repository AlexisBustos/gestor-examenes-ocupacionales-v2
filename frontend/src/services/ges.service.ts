import axios from '@/lib/axios';

export interface Ges {
    id: string;
    name: string;
    riskExposures?: {
        examBatteries: {
            id: string;
            name: string;
        }[];
    }[];
}

export const GesService = {
    async findAll() {
        const response = await axios.get<Ges[]>('/ges');
        return response.data;
    },
};
