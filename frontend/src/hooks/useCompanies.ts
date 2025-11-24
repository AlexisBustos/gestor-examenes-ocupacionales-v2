import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CompaniesService } from '@/services/companies.service';

export function useCompanies() {
    return useQuery({
        queryKey: ['companies'],
        queryFn: CompaniesService.findAll,
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: CompaniesService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
        },
    });
}

export function useCompany(id: string | null) {
    return useQuery({
        queryKey: ['company', id],
        queryFn: () => CompaniesService.findById(id!),
        enabled: !!id,
    });
}

export function useUpdateCompany() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => CompaniesService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            queryClient.invalidateQueries({ queryKey: ['company'] });
        },
    });
}
