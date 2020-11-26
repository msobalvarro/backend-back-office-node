if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const path = require("path")

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
    JWTSECRETSIGN,
} = process.env

// Constante que define si el server está de produccion
const PRODUCTION = (process.env.NODE_ENV === "production")

/**
 * Constante que define la dirección absoluta dentro del servidor del archivo
 * de credenciales de la cuenta de servicio
 */
const CREDENTIAL_ACCOUNT_SERVICE_PATH = `configuration/${GCLOUD_ACCOUNT_SERVICE_CREDENTIAL}`

// Token de acceso para acceder a las imagenes de correo almacenadas en el bucket
const EMAIL_IMAGE_TOKEN = "jRVFgyxiXKHxAWQL47jVzoMwj2m9DfG6-fLv8j9zBtLDMjpBd4QeLpXdTHM2Mnlyg-zZEfQrPoCn9yPUVaUQEvTl3B904h3xcY"

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
    EMAIL_IMAGE_TOKEN,
    JWTSECRETSIGN
}