const { readFile } = require("fs")
const WriteError = require("../logs/write.config")

/**
 * Funcion que reemplaza variables de template String
 * 
 * @param {String} str 
 * @param {Object} obj 
 */
const parseTemplate = (str = "", obj = {}) => {
    //let parts = str.split(/\$\{(?!\d)[\wæøåÆØÅ]*\}/)
    //let parameters = args.map(argument => obj[argument] || (obj[argument] === undefined ? "" : obj[argument]))
    let args = str.match(/[^\${\}]+(?=})/g) || []
    

    // Se obtienen las los parámetros y se declaran como variables independientes dentro de la función
    Object.keys(obj).forEach(key => {
        eval(`this.${key} = obj.${key}`)
    })


    // Se recoren los argumentos dentro del template y se reemplazan por su evaluación a nivel de código dentro del contenido del template
    args.forEach(item => {
        // argumento dentro del template
        let templateVar = `\${${item}}`
        
        // Resultado de la evaluación del argumento del template
        let templateVarResult = `${eval('this.'+item+'')}`

        str = str.replace(templateVar, templateVarResult)
    })

    //return String.raw({ raw: parts }, ...parameters)
    return str
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