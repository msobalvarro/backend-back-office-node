const { readFile } = require("fs")
const WriteError = require("../logs/write")

/**
 * Funcion que reemplaza variables de template String
 * 
 * @param {String} str 
 * @param {Object} obj 
 */
const parseTemplate = (str = "", obj = {}) => {
    let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/)
    let args = str.match(/[^{\}]+(?=})/g) || []
    let parameters = args.map(argument => obj[argument] || (obj[argument] === undefined ? "" : obj[argument]))

    return String.raw({ raw: parts }, ...parameters)
}

/**
 * Funciona que retorna un archivo HTML como `Template String`
 * 
 * @param {String} template 
 * @param {Object} variables
 */
const getHTML = async (template = "", vars = {}) => {
    return new Promise((resolve, reject) => {
        readFile(`./templates/${template}`, "utf8", (error, html) => {
            if (error) {
                WriteError(`html.js - ${error.message}`)

                reject(error.message)
            } else {


                resolve(parseTemplate(html, vars))
            }
        })
    })
}

module.exports = { parseTemplate, getHTML }