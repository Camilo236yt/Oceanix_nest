import * as Joi from "joi";

export const configValidationSchema = Joi.object({
    // Database (updated for multi-tenant)
    DATABASE_HOST: Joi.string().default('localhost'),
    DATABASE_PORT: Joi.number().default(5432),
    DATABASE_USER: Joi.string().default('oceanix_user'),
    DATABASE_PASSWORD: Joi.string().default('oceanix_password_dev'),
    DATABASE_NAME: Joi.string().default('oceanix_db'),

    // Environment
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    APP_PORT: Joi.number().default(3000),

    // JWT & Cookies
    JWT_SECRET: Joi.string().default('your-super-secret-jwt-key-change-in-production'),
    JWT_EXPIRATION: Joi.string().default('24h'),
    JWT_ACTIVATION_SECRET: Joi.string().default('your-activation-secret-key-change-in-production'),
    JWT_ACTIVATION_EXPIRATION: Joi.string().default('5m'),
    COOKIE_DOMAIN: Joi.string().optional(),

    // Redis
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().optional(),
    REDIS_DB: Joi.number().default(0),
    REDIS_TTL: Joi.number().default(300),

    // Firebase
    FIREBASE_TYPE: Joi.string().optional(),
    FIREBASE_PROJECT_ID: Joi.string().optional(),
    FIREBASE_PRIVATE_KEY_ID: Joi.string().optional(),
    FIREBASE_PRIVATE_KEY: Joi.string().optional(),
    FIREBASE_CLIENT_EMAIL: Joi.string().optional(),
    FIREBASE_CLIENT_ID: Joi.string().optional(),
    FIREBASE_AUTH_URI: Joi.string().optional(),
    FIREBASE_TOKEN_URI: Joi.string().optional(),
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: Joi.string().optional(),
    FIREBASE_CLIENT_X509_CERT_URL: Joi.string().optional(),
    FIREBASE_UNIVERSE_DOMAIN: Joi.string().optional(),
    FIREBASE_BUCKET: Joi.string().optional(),
})