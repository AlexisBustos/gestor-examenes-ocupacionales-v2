import axios from '@/lib/axios';

export interface Company {
    id: string;
    name: string;
}

export const CompaniesService = {
    async findAll() {
        const response = await axios.get<Company[]>('/companies');
        return response.data;
    },
};
