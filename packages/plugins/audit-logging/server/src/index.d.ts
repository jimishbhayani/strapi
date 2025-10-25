declare const _default: () => {
    register: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => Promise<void>;
    bootstrap: ({ strapi }: {
        strapi: import("@strapi/types/dist/core").Strapi;
    }) => Promise<void>;
    routes: {
        admin: {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: (string | {
                        name: string;
                        config: {
                            actions: string[];
                        };
                    })[];
                };
            }[];
        };
        'content-api': {
            type: string;
            routes: {
                method: string;
                path: string;
                handler: string;
                config: {
                    policies: never[];
                    middlewares: never[];
                };
            }[];
        };
    };
    controllers: {
        'audit-log': import("@strapi/types/dist/core").Controller;
    };
    contentTypes: {
        'audit-log': {
            schema: {
                kind: string;
                collectionName: string;
                info: {
                    singularName: string;
                    pluralName: string;
                    displayName: string;
                    description: string;
                };
                options: {
                    draftAndPublish: boolean;
                    timestamps: boolean;
                };
                pluginOptions: {
                    "content-manager": {
                        visible: boolean;
                    };
                    "content-type-builder": {
                        visible: boolean;
                    };
                };
                attributes: {
                    contentType: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    recordId: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    action: {
                        type: string;
                        enum: string[];
                        required: boolean;
                        configurable: boolean;
                    };
                    userId: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    payload: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    changedFields: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    timestamp: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    userAgent: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                    ipAddress: {
                        type: string;
                        required: boolean;
                        configurable: boolean;
                    };
                };
            };
        };
    };
    services: {
        'audit-log': ({ strapi }: {
            strapi: import("@strapi/types/dist/core").Strapi;
        }) => {
            createAuditEntry(entry: import("./types").AuditLogEntry): Promise<any>;
            findAuditLogs(query?: import("./types").AuditLogQuery): Promise<{
                data: any[];
                meta: {
                    pagination: {
                        page: number;
                        pageSize: number;
                        pageCount: number;
                        total: number;
                    };
                };
            }>;
            isLoggingEnabled(contentType: string): boolean;
            getAuditLogStats(): Promise<{
                totalLogs: number;
                actionStats: any;
                recentActivity: any[];
            }>;
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map