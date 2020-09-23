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
    GCLOUD_FILES_STORAGE_BUCKET,
    GCLOUD_ACCOUNT_SERVICE_CREDENTIAL,
    ALYPAY_API_KEY,
    COINMARKETCAP_API,
} = process.env

// Constante que define si el server está de produccion
const PRODUCTION = (process.env.NODE_ENV === "production")

/**
 * Constante que define la dirección absoluta dentro del servidor del archivo
 * de credenciales de la cuenta de servicio
 */
const CREDENTIAL_ACCOUNT_SERVICE_PATH = `${global.appRootDir}/${GCLOUD_ACCOUNT_SERVICE_CREDENTIAL}`

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
    GCLOUD_FILES_STORAGE_BUCKET,
    GCLOUD_ACCOUNT_SERVICE_CREDENTIAL: CREDENTIAL_ACCOUNT_SERVICE_PATH,
    ALYPAY_API_KEY,
    PRODUCTION,
    COINMARKETCAP_API,
}