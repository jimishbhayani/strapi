export default {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'audit-log.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/stats',
      handler: 'audit-log.getStats',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};