export default () => ({
  port: parseInt(process.env.GATEWAY_PORT ?? "4000", 10),
  jwt: {
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET ?? "access-secret",
  },
  gateway: {
    secret: process.env.GATEWAY_SECRET ?? "",
  },
  services: {
    auth: process.env.AUTH_SERVICE_URL ?? "http://localhost:3001",
    profile: process.env.PROFILE_SERVICE_URL ?? "http://localhost:3002",
    content: process.env.CONTENT_SERVICE_URL ?? "http://localhost:3003",
    social: process.env.SOCIAL_SERVICE_URL ?? "http://localhost:3004",
    media: process.env.MEDIA_SERVICE_URL ?? "http://localhost:3005",
    feed: process.env.FEED_SERVICE_URL ?? "http://localhost:3006",
  },
});
