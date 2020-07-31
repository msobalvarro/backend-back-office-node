if (process.env.NODE_ENV !== 'production') require('dotenv').config()

const { DBHOST, DBNAME, DBUSER, DBPASS, PORT, SENDGRID_API_KEY, JWTSECRET, CAPTCHAKEY } = process.env

module.exports = { DBHOST, DBNAME, DBUSER, DBPASS, PORT, SENDGRID_API_KEY, JWTSECRET, CAPTCHAKEY }