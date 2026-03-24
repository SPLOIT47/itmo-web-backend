declare const _default: () => {
    port: number;
    jwt: {
        accessTokenSecret: string;
    };
    gateway: {
        secret: string;
    };
    services: {
        auth: string;
        profile: string;
        content: string;
        social: string;
        media: string;
        feed: string;
    };
};
export default _default;
