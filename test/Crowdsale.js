const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1

  beforeEach(async () => {
  	//load contracts
    const Crowdsale = await ethers.getContractFactory('Crowdsale')
    const Token = await ethers.getContractFactory('Token')

    //deploy token
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    //conigure accouts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 =accounts[1]

    //deploy crowdsale
    crowdsale = await Crowdsale.deploy(token.address)

    //send tokens to crowdsale
    let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
    await transaction.wait()
  })

  describe('Deployment', () => {

  	it('has correct name', async() => {
  	  expect(await crowdsale.name()).to.equal('Crowdsale')
  	})

  	it('sends tokens to the Crowdsale contract', async() => {
  	  expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
  	})

  	it('returns token address', async() => {
  	  expect(await crowdsale.token()).to.equal(token.address)
  	})

  })

  describe('Buying Tokens', () => {

  	describe('Success', () => {

  	  it('transfers tokens', async() => {


  	  })
  	})

  })

})
