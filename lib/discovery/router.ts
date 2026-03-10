import { discoverMobileApps } from './mobile';
import { discoverSaas } from './saas';
import { searchAll } from '@/lib/search';
import type { Competitor } from '@/types';

export async function discoverCompetitors(
  queries: string[],
  productType: string
): Promise<Competitor[]> {
  switch (productType) {
    case 'Mobile App':
      return discoverMobileApps(queries);
    case 'SaaS':
      return discoverSaas(queries);
    default:
      // Chrome Extension, Dev Tool, AI Tool, or unset — generic Tavily
      return searchAll(queries);
  }
}
