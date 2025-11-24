import axios from '@/lib/axios';

export interface CompanyStats {
    workersCount: number;
    gesCount: number;
    riskCount: number;
}

export interface Company {
    id: string;
    rut: string;
    name: string;
    contactEmail?: string;
    address?: string;
    phone?: string;
    stats?: CompanyStats;
}

export interface UpdateCompanyDto {
    rut?: string;
    name?: string;
    contactEmail?: string;
    address?: string;
    phone?: string;
}

export const CompaniesService = {
    async findAll() {
        const response = await axios.get<Company[]>('/companies');
        return response.data;
    },

    async findById(id: string) {
        const response = await axios.get<Company>(`/companies/${id}`);
        return response.data;
    },

    async update(id: string, data: UpdateCompanyDto) {
        const response = await axios.put<Company>(`/companies/${id}`, data);
        return response.data;
    },

    async delete(id: string) {
        await axios.delete(`/companies/${id}`);
    },
};
