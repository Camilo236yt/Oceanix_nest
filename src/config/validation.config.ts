import * as Joi from "joi";

export const configValidationSchema = Joi.object({
    // Database
    TYPE_DB: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),

    // Environment
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('24h'),

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