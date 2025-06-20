// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "../eth/ERC20MintToken.sol";

/// @dev The token controller contract must implement these functions
abstract contract TokenController {
    ERC20MintToken public memeToken;
    address public SALE; // address where sale tokens are located
    /// @notice needed for hodler handling
    function addHodlerStake(address _beneficiary, uint _stake) virtual public;
    function setHodlerStake(address _beneficiary, uint256 _stake) virtual public;
    function setHodlerTime(uint256 _time) virtual public;
    /// @notice Called when `_owner` sends ether to the MiniMe Token contract
    /// @param _owner The address that sent the ether to create tokens
    /// @return True if the ether is accepted, false if it throws
    function proxyPayment(address _owner) virtual public payable returns(bool);
    /// @notice Notifies the controller about a token transfer allowing the
    ///  controller to react if desired
    /// @param _from The origin of the transfer
    /// @param _to The destination of the transfer
    /// @param _amount The amount of the transfer
    /// @return False if the controller does not authorize the transfer
    function onTransfer(address _from, address _to, uint _amount) virtual public returns(bool);
    /// @notice Notifies the controller about an approval allowing the
    ///  controller to react if desired
    /// @param _owner The address that calls `approve()`
    /// @param _spender The spender in the `approve()` call
    /// @param _amount The amount in the `approve()` call
    /// @return False if the controller does not authorize the approval
    function onApprove(address _owner, address _spender, uint _amount) virtual public returns(bool);
}