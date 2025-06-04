//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
	string public name ="Crowdsale";
	Token public token;

	constructor(Token _token) {
		token = _token;
	}

	function buyToken(uint256 _amount) public {
		token.transfer(msg.sender, _amount);
	}

}
