import { useQuery } from '@tanstack/react-query';
import { CompaniesService } from '@/services/companies.service';

export function useCompanies() {
    return useQuery({
        queryKey: ['companies'],
        queryFn: CompaniesService.findAll,
    });
}
