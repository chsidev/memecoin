const BSCToken = artifacts.require('BEP20MintToken');

module.exports = async done => {
  const [recipient, _] = await web3.eth.getAccounts();
  const bscToken = await BSCToken.deployed();
  const balance = await bscToken.balanceOf(recipient);
  console.log(balance.toString());
  done();
}# Change 0 on 2023-11-28
# Change 1 on 2023-11-28
