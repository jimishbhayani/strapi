import type { Core } from '@strapi/types';
import { createContentApiRoutesFactory } from '@strapi/utils';

const createContentApiRoutes = createContentApiRoutesFactory((): Core.RouterInput['routes'] => {
  return [
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'audit-log.find',
      config: {
        prefix: '',
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/stats',
      handler: 'audit-log.getStats',
      config: {
        prefix: '',
      },
    },
  ];
});

export default createContentApiRoutes;