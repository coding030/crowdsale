//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
	string public name ="Crowdsale";
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokensSold;

	event Buy(uint256 _amount, address _buyer);

	constructor(
		Token _token, 
		uint256 _price, 
		uint256 _maxTokens
	) {
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
	}

	receive() external payable {
		uint256 amount = msg.value / price;
		buyTokens(amount * 1e18);	
	}

//    function transfer(address _to, uint256 _value) 
//	  balanceOf comes also from Token.sol (mapping)
//	  sender is the person who is calling the function
	function buyTokens(uint256 _amount) public payable {
//		require(msg.value == (_amount / 1e18) * price);
		require(msg.value >= 1);
		require(token.balanceOf(address(this)) >= _amount);
		require(token.transfer(msg.sender, _amount),'failed to transfer tokens');

		tokensSold += _amount;
		
		emit Buy(_amount, msg.sender);

	}
}
