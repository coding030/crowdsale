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
	uint256 public minContribution;
	uint256 public maxContribution;
	uint256 public creationTime;
    mapping(address => bool) public whiteListMap;
    mapping(address => uint256) public totalBought;

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
		minContribution = 10 * 1e18;
		maxContribution = 100000 * 1e18;
		creationTime = block.timestamp;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Caller is not the owner");
		_;
	}

	modifier withinTimeWindow() {
		require(block.timestamp >= creationTime);
		require(block.timestamp <= creationTime + 4 weeks);
		_;
	}

	receive() external payable withinTimeWindow {
		require(whiteListMap[msg.sender] == true);
//		require(timeWindow(block.timestamp) == true);
		require(
			msg.value * price / 1e18 >= minContribution, 
			"Must purchase at least 10 tokens"
		);
		require(
			msg.value * price / 1e18 <= maxContribution, 
			"Can purchase max 100000 tokens"
		);
		require(
			(totalBought[msg.sender] + msg.value * price / 1e18) <= maxContribution, 
			"Limit of 100000 for token purchase reached"
		);
		uint256 amount = msg.value * price;
		buyTokens(amount / 1e18);	
	}

	function addAddressToMapping(address _address) public onlyOwner {
    	require(_address != address(0));

    	whiteListMap[_address] = true;

    	emit AddedAddress(_address);
	}

	function getTime() public view returns (uint256) {
		return block.timestamp;
	}


///	function addAddress(address _address) public onlyOwner {
///    	require(_address != address(0));
///    	require(contained(_address) == false);
///
///		whiteList.push(_address);
///
///		emit AddedAddress(_address);
///	}

///	function contained(address _address) public view returns (bool) {
///		for (uint256 i = 0; i < whiteList.length; i++) {
///			if (whiteList[i] == _address) {
///				return true;
///			}
///		} 
///		return false;
///	}

//	function tokenAmount(address _address) public view returns (uint256 _amount) {
//
//	}

//	function timeWindow(uint256 _timestamp) public view returns (bool) {
//		if ((_timestamp >= creationTime - 1 days) && 
//			(_timestamp <= creationTime + 4 weeks)) {
//			return true;
//		}
//		return false;
//	}


//    function transfer(address _to, uint256 _value) 
//	  balanceOf comes also from Token.sol (mapping)
//	  sender is the person who is calling the function
	function buyTokens(uint256 _amount) public payable {
		require(msg.value == (_amount * 1e18) / price);
		require(token.balanceOf(address(this)) >= _amount);
		require(token.transfer(msg.sender, _amount),'failed to transfer tokens');

		tokensSold += _amount;
		totalBought[msg.sender] += _amount;

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
