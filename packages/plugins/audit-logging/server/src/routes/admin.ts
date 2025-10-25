export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/audit-logs',
      handler: 'audit-log.find',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'plugin::content-manager.hasPermissions',
            config: { actions: ['plugin::audit-logging.read'] },
          },
        ],
      },
    },
    {
      method: 'GET',
      path: '/audit-logs/stats',
      handler: 'audit-log.getStats',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          {
            name: 'plugin::content-manager.hasPermissions',
            config: { actions: ['plugin::audit-logging.read'] },
          },
        ],
      },
    },
  ],
};