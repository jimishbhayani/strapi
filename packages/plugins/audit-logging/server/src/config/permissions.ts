const actions = [
  {
    section: 'plugins',
    category: 'Audit Logging',
    subCategory: 'Audit Logs',
    pluginName: 'audit-logging',
    displayName: 'Read audit logs',
    uid: 'read',
  },
];

const registerAuditLoggingActions = async () => {
  const { actionProvider } = strapi.service('admin::permission');
  await actionProvider.registerMany(actions);
};

export default {
  actions,
  registerAuditLoggingActions,
};