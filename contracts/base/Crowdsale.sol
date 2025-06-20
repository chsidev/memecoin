// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../lib/SafeMath.sol";
import "../eth/ERC20MintToken.sol";

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale.
 * Crowdsales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Crowdsale {
  using SafeMath for uint256;
  // The token being sold
  ERC20MintToken public token;
  // start and end timestamps where investments are allowed (both inclusive)
  uint256 public startTime;
  uint256 public endTime;
  // address where funds are collected
  address payable public wallet;
  // how many token units a buyer gets per wei
  uint256 public rate;
  // amount of raised money in wei
  uint256 public weiRaised;
  /**
   * event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
  constructor(uint256 _startTime, uint256 _endTime, uint256 _rate, address payable _wallet) {
    require(_startTime >= block.timestamp);
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_wallet != address(0));
    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
  }
  // fallback function can be used to buy tokens
  receive() external payable {
    buyTokens(msg.sender);
  }
  // low level token purchase function
  function buyTokens(address beneficiary) public virtual payable {
    buyTokens(beneficiary, msg.value);
  }
  // implementation of low level token purchase function
  function buyTokens(address beneficiary, uint256 weiAmount) internal {
    require(beneficiary != address(0));
    require(validPurchase(weiAmount));
    // update state
    weiRaised = weiRaised.add(weiAmount);
    transferToken(beneficiary, weiAmount);
    forwardFunds(weiAmount);
  }
  // low level transfer token
  // override to create custom token transfer mechanism, eg. pull pattern
  function transferToken(address beneficiary, uint256 weiAmount) virtual internal {
    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);
    token.transferToken(beneficiary, tokens);
    emit TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
  }
  // send ether to the fund collection wallet
  // override to create custom fund forwarding mechanisms
  function forwardFunds(uint256 weiAmount) virtual internal {
    (bool sent, ) = wallet.call{value: weiAmount}("");
    require(sent, "Failed to forwardFunds");
  }
  // @return true if the transaction can buy tokens
  function validPurchase(uint256 weiAmount) internal virtual view returns (bool) {
    bool withinPeriod = block.timestamp >= startTime && block.timestamp <= endTime;
    bool nonZeroPurchase = weiAmount != 0;
    return withinPeriod && nonZeroPurchase;
  }
  // @return true if crowdsale event has ended
  function hasEnded() public virtual view returns (bool) {
    return block.timestamp > endTime;
  }
  // @return true if crowdsale has started
  function hasStarted() public view returns (bool) {
    return block.timestamp >= startTime;
  }
}