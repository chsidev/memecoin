var Web3 = require('web3');
const ERC20Token = artifacts.require("ERC20MintToken");
const BEP20Token = artifacts.require('BEP20MintToken');
const PreSale = artifacts.require('MemePreSale');

module.exports = async (deployer, network, addresses) => {

  let deployAddress = addresses[0];

  let startTime = new Date(); // now
  startTime.setSeconds(startTime.getSeconds() + 180); // add 180 seconds
  const _startTime = Math.floor(startTime.getTime() / 1000); // unix timestamp

  let endTime = new Date(); // now
  endTime.setDate(endTime.getDate() + 14); // add 14 days
  const _endTime = Math.floor(endTime.getTime() / 1000); // unix timestamp

  const _minContribution = Web3.utils.toWei('0.1', 'ether');
  const _goal = Web3.utils.toWei('333', 'ether'); //Minimum funding in wei
  const _softCap = Web3.utils.toWei('3600', 'ether'); //Softcap in wei, reaching it ends the sale in _softCapTime seconds
  const _cap = Web3.utils.toWei('7200', 'ether'); //Maximum cap in wei

  let memeToken = await ERC20Token.deployed();
  if(network.includes('bsc_')) {
    memeToken = await BEP20Token.deployed();
  }
  console.log('MemeToken Contract Address:', memeToken.address);

  await deployer.deploy(PreSale, 
    memeToken.address, //memetoken contract addr
    _startTime,
    _endTime,
    _minContribution,
    1250, //_rate: Number of Meme tokens per 1 ETH
    _goal, 
    _softCap, 
    432000, //Seconds until the sale remains open after reaching _softCap 
    _cap, 
    100000000000, //Maximum gas price
    80,  //
    deployAddress, //wallet
    {gas: 5000000, from: deployAddress }
  );
  const presale = await PreSale.deployed();
  console.log('PreSale Contract Address:', presale.address);
};