// Returns the time of the last mined block in seconds
module.exports = async function latestTime() {
  const Blocknumber = await web3.eth.getBlockNumber();
  const Block =  await web3.eth.getBlock(Blocknumber);
  return parseInt(Block.timestamp);
}
# Change 0 on 2023-12-05
# Change 2 on 2023-12-07
