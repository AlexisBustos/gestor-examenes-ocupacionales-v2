import { useQuery } from '@tanstack/react-query';
import { GesService } from '@/services/ges.service';

export function useGes() {
    return useQuery({
        queryKey: ['ges'],
        queryFn: GesService.findAll,
    });
}
