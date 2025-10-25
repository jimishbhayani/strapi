declare const _default: {
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
export default _default;
//# sourceMappingURL=index.d.ts.map