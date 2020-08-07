if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const {
    DBHOST,
    DBNAME,
    DBUSER,
    DBPASS,
    PORT,
    SENDGRID_API_KEY,
    JWTSECRET,
    CAPTCHAKEY,
    GCLOUD_STORAGE_BUCKET,
    ALYPAY_API_KEY
} = process.env

// Constante que define si el server es de produccion
const PRODUCTION = (process.env.NODE_ENV === "production")

module.exports = {
    DBHOST,
    DBNAME,
    DBUSER,
    DBPASS,
    PORT,
    SENDGRID_API_KEY,
    JWTSECRET,
    CAPTCHAKEY,
    GCLOUD_STORAGE_BUCKET,
    ALYPAY_API_KEY,
    PRODUCTION,
}