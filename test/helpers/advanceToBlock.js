module.exports = {
  advanceBlock: function () {
    return new Promise((resolve, reject) => {
      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: Date.now(),
      }, (err, res) => {
        return err ? reject(err) : resolve(res)
      })
    })
  },

  // Advances the block number so that the last mined block is `number`.
  advanceToBlock: async function (number) {
    if (web3.eth.getBlockNumber() > number) {
      throw Error(`block number ${number} is in the past (current is ${web3.eth.getBlockNumber()})`)
    }
  
    while (web3.eth.getBlockNumber() < number) {
      await advanceBlock()
    }
  }
}