//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
	string public name ="Crowdsale";
	address public owner;
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokensSold;
	address[] public whiteList;

	event Buy(uint256 _amount, address _buyer);
	event Finalize(uint256 _tokensSold, uint256 _ethRaised);
	event AddedAddress(address _newAddress);

	constructor(
		Token _token, 
		uint256 _price, 
		uint256 _maxTokens
	) {
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Caller is not the owner");
		_;
	}

	receive() external payable {
//		uint256 amount = msg.value / price;
//		buyTokens(amount * 1e18);	
		uint256 amount = msg.value * price;
		buyTokens(amount / 1e18);	
//		buyTokens(amount);	
	}


	function addAddress(address _address) public onlyOwner {
    	require(_address != address(0));
		whiteList.push(_address);

		emit AddedAddress(_address);
	}

//    function transfer(address _to, uint256 _value) 
//	  balanceOf comes also from Token.sol (mapping)
//	  sender is the person who is calling the function
	function buyTokens(uint256 _amount) public payable {
//		require(msg.value == (_amount / 1e18) * price);
		require(msg.value == (_amount * 1e18) / price);
		require(token.balanceOf(address(this)) >= _amount);
		require(token.transfer(msg.sender, _amount),'failed to transfer tokens');

		tokensSold += _amount;
		
		emit Buy(_amount, msg.sender);
	}

	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}

	function finalize() public onlyOwner {
//		uint256 remainingTokens = token.balanceOf(address(this));
//		token.transfer(owner, remainingTokens);
		require(token.transfer(owner, token.balanceOf(address(this))));
// address(this).balance give the ETH balance of this contract
// .call let's you send a message or basically a transaction to a different account
		uint256 value = address(this).balance;
//this send the entire eth balance
//.call returns
		(bool sent, ) = owner.call{value: value }("");
		require(sent);

		emit Finalize(tokensSold, value);
	}
}
