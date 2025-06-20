// Returns the time of the last mined block in seconds
module.exports = async function latestTime() {
  const Blocknumber = await web3.eth.getBlockNumber();
  const Block =  await web3.eth.getBlock(Blocknumber);
  return parseInt(Block.timestamp);
}
