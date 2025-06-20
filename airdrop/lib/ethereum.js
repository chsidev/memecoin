import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import Airdrop from '../../build/contracts/TokenAirdrop.json';

const networks = {
  '4': 'Rinkeby Testnet', 
  '56': 'Binance Smart Chain Mainnet', 
  '97': 'Binance Smart Chain Testnet', 
  '5777': 'Local development blockchain' 
}

const getBlockchain = () =>
  new Promise( async (resolve, reject) => {
    const provider = await detectEthereumProvider();
    if(provider) {
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const networkId = await provider.request({ method: 'net_version' });
      console.log(networkId);
      if(networkId !== process.env.NEXT_PUBLIC_NETWORK_ID) {
        const targetNetwork = networks[process.env.NEXT_PUBLIC_NETWORK_ID];
        reject(`Wrong network, please switch to ${process.env.NEXT_PUBLIC_NETWORK_ID}`);
        //reject(`Wrong network, please switch to ${targetNetwork}`);
        return;
      }
      const web3 = new Web3(provider);
      const airdrop = new web3.eth.Contract(
        Airdrop.abi,
        Airdrop.networks[networkId].address,
      );
      resolve({airdrop, accounts});
      return;
    }
    reject('Install Metamask');
  });

export default getBlockchain;
# Change 0 on 2023-11-29
# Change 1 on 2023-12-07
