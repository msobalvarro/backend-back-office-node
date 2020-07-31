const express = require('express')
const router = express.Router()
const SHA256 = require("crypto-js/sha256")
const crypto = require("crypto")

/**
 * * index	`Es un número único que rastrea la posición de cada bloque en toda la cadena de bloques.`
 * * `timestamp	Mantiene un registro del tiempo de ocurrencia de cada transacción completada.`
 * * `data	Proporciona datos sobre las transacciones completadas, como los detalles del remitente, los detalles del destinatario y la cantidad de transacciones.`
 * * `precedingHash	Apunta al hash del bloque anterior en la cadena de bloques, algo importante para mantener la integridad de la cadena de bloques.`
 */
class CryptoBlock {
    constructor(index, timestamp, data, precedingHash = " ") {
        this.index = index
        this.timestamp = timestamp
        this.data = data
        this.precedingHash = precedingHash
        this.hash = this.computeHash()
    }


    computeHash() {
        return SHA256(this.index + this.precedingHash + this.timestamp + JSON.stringify(this.data)).toString()
    }
}

class CryptoBlockchain {
    /**
     * Este método crea instancias de blockchain. Dentro del constructor, 
     * creé la blockchainpropiedad, que se refiere a una matriz de bloques. 
     * Tenga en cuenta que le pasé el startGenesisBlock()método, que crea el bloque inicial en la cadena.
     */
    constructor() {
        this.blockchain = [this.startGenesisBlock()]
    }

    /**
     * En una cadena de bloques, el bloque de génesis se refiere al primer bloque 
     * creado en la red. Siempre que un bloque se integre con el resto de la cadena, 
     * debe hacer referencia al bloque anterior.
     * 
     * Por el contrario, en el caso de este bloque inicial, no tiene ningún bloque anterior al que señalar. 
     * Por lo tanto, un bloque de génesis generalmente está codificado en la cadena de bloques. De esta manera, 
     * se pueden crear bloques posteriores en él. Suele tener un índice de 0.
     * 
     * Usé el startGenesisBlock()método para crear el bloque de génesis. 
     * Tenga en cuenta que he creado usando el creado anteriormente - CryptoBlockclase y pasé los index, timestamp, data, y precedingHashparámetros.
     */
    startGenesisBlock() {
        return new CryptoBlock(0, "01/01/2020", "Initial Block in the Chain", "0")
    }

    /**
     * Obtener el último bloque en la cadena de bloques ayuda a garantizar 
     * que el hash del bloque actual apunte al hash del bloque anterior, manteniendo así la integridad de la cadena. 
     * 
     * Usé el obtainLatestBlock() método para recuperarlo.
     */
    obtainLatestBlock() {
        return this.blockchain[this.blockchain.length - 1]
    }

    /**
     * 
     * Usé el `addNewBlock()` método para agregar un nuevo bloque a la cadena. 
     * Para lograr esto, configuré el hash anterior del nuevo bloque para 
     * que sea igual al hash del último bloque de la cadena, asegurando 
     * así que la cadena sea a prueba de manipulaciones.
     * 
     * Dado que las propiedades del nuevo bloque cambian con cada nuevo cálculo, 
     * es importante calcular su hash criptográfico nuevamente. 
     * Después de actualizar su hash, el nuevo bloque se inserta en la matriz blockchain. 
     * 
     * En realidad, agregar un nuevo bloque a una cadena de bloques no es tan fácil 
     * debido a los diversos controles que se han realizado. Sin embargo, 
     * para esta simple criptomoneda, es suficiente para demostrar 
     * cómo funciona realmente una cadena de bloques.
     */
    addNewBlock(newBlock) {
        newBlock.precedingHash = this.obtainLatestBlock().hash
        newBlock.hash = newBlock.computeHash()
        this.blockchain.push(newBlock)
    }
}

router.post('/', (_, res) => {
    let smashingCoin = new CryptoBlockchain()
    smashingCoin.addNewBlock(new CryptoBlock(1, "01/06/2020", { sender: "Iris Ljesnjanin", recipient: "Cosima Mielke", quantity: 50 }))
    smashingCoin.addNewBlock(new CryptoBlock(2, "01/07/2020", { sender: "Vitaly Friedman", recipient: "Ricardo Gimenes", quantity: 100 }))

    const e = crypto.getHashes()

    res.send({ e })
})

module.exports = router