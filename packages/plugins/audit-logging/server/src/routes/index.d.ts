declare const _default: {
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
export default _default;
//# sourceMappingURL=index.d.ts.map