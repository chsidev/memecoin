import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import Web3 from 'web3';
import getBlockchain from '../lib/ethereum.js';
import styles from './home.module.css';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [claimMessage, setClaimMessage] = useState({
    payload: undefined,
    type: undefined
  });
  const [airdrop, setAirdrop] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);

  useEffect(() => {
    const init = async () => {
      try { 
        const { airdrop, accounts } = await getBlockchain();
        setAirdrop(airdrop);
        setAccounts(accounts);
        setLoading(false);
      } catch(e) {
        setLoadingMessage(e);
      }
    };
    init();
  }, []);

  const claimTokens = async e => {
    e.preventDefault();
    const address = e.target.elements[0].value.trim().toLowerCase();
    setClaimMessage({
      type: 'primary',
      payload: 'Checking your address in whitelist...'
    });
    try {
      const response = await axios.post(
        // '/api/authorization', 
        '/api/auth', 
        {
          address: address
        }
      );
      setClaimMessage({
        type: 'primary',
        payload: `
        Claiming token from Airdrop contract...
        Address: ${response.data.address}
        SHIB Amount: ${Web3.utils.fromWei(response.data.shibBalance.toString())} SHIB
        -> Meme allocation: ${Web3.utils.fromWei(response.data.memeAllocation.toString())} MEME
        -> Signature: ${Web3.utils.fromWei(response.data.signature.toString())} MEME
        `
      });
      
      const receipt = await airdrop
        .methods
        .signClaimTokens(
          response.data.address, 
          response.data.memeAllocation.toString(),
          response.data.signature
        )
        .send({from: accounts[0], gas:5000000});
      setClaimMessage({
        type: 'primary',
        payload: `Airdrop success!
Tokens successfully in tx ${receipt.transactionHash} 
Address: ${response.data.address}
-> Meme allocation: ${Web3.utils.fromWei(response.data.memeAllocation.toString())} MEME
        `
      });
    } catch(e) {
      if(e.message === 'Request failed with status code 401') {
        setClaimMessage({
          type: 'danger',
          payload: `Airdrop failed
Reason: Address not registered`
        });
        return;
      }
      setClaimMessage({
        type: 'danger',
        payload: `${e.message} Airdrop failed
Reason" Airdrop already sent to ${address}`
      });
    }
  };

  return (
    <div className='container'>
      <Head>
        <title>MEME Tokens Airdrop</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className='row mt-4'>
        <div className='col-sm-12'>
          <div className={styles.jumbotron}>
            <h1 className='text-center'>MEME Tokens Airdrop For SHIB Holders</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className='row'>
          <div className='col-sm-12'>
            {loadingMessage}
          </div>
        </div>
      ) : null}

      {loading ? null : (
      <div className='row'>

        <div className='col-sm-6'>
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">How to claim your meme tokens?</h5>
              <div className="card-text">
                <ul>
                  <li>Step 1: Make sure you have configured the BSC network with Metamask</li>
                  <li>Step 2: Make sure you have some BNB to pay for transaction fees (~1-2 USD worth of BNB, paid to the network</li>
                  <li>Step 3: Enter your BSC address and click on submit. This will fetch an authorization signature from the list of whitelisted address</li>
                  <li>Step 4: Confirm the transaction to claim your MEME tokens. This will send a transaction to the Airdrop smart contract</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className='col-sm-6'>
          <form className="form-inline" onSubmit={e => claimTokens(e)}>
            <input 
              type="text" 
              className="form-control mb-2 mr-sm-2 col-sm-12" 
              placeholder="BSC Address"
            />
            <button 
              type="submit" 
              className="btn btn-primary mb-2 col-sm-12"
            >
              Submit
            </button>
          </form>
          <div>
            {typeof claimMessage.payload !== 'undefined' ?  (
              <div className={`alert alert-${claimMessage.type}`} role="alert">
                <span style={{ whiteSpace: 'pre' }}>
                  {claimMessage.payload}
                </span>
              </div>
            ) : ''}
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
# Change 0 on 2023-12-26
