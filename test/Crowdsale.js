const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}
const ether = tokens

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1
  let pricePerEth

  beforeEach(async () => {
  	//load contracts
    const Crowdsale = await ethers.getContractFactory('Crowdsale')
    const Token = await ethers.getContractFactory('Token')
    pricePerEth = tokens(10000)

    //deploy token
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')
// only in deploy script    
//    await token.deployed()
    //deploy crowdsale
    crowdsale = await Crowdsale.deploy(token.address, pricePerEth, 1000000)
//    await crowdsale.deployed()

    //configure accouts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 = accounts[1]

    //send tokens to crowdsale
    let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
    await transaction.wait()
  })

  describe('Deployment', () => {

  	it('has correct name', async() => {
  	  expect(await crowdsale.name()).to.equal('Crowdsale')
  	})

  	it('log', async () => {
  	  console.log(await `${crowdsale.price()}`)
// this is supposed to return a function
  	  console.log(crowdsale.price)
// this is supposed to return a promise
  	  console.log(crowdsale.price())
// this also is supposed to return a function
  	  console.log(await crowdsale.price)
// this is supposed to return the price in wei
  	  console.log(await crowdsale.price())
// this is supposed to return the price in Eth
  	  console.log(ethers.utils.formatUnits(await crowdsale.price()), 'ether')
    })

  	it('returns the price', async() => {
  	  expect(await crowdsale.price()).to.equal(pricePerEth)
  	})

  	it('sends tokens to the Crowdsale contract', async() => {
  	  expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000))
  	})

  	it('returns token address', async() => {
  	  expect(await crowdsale.token()).to.equal(token.address)
  	})

  })

  describe('Buying Tokens', () => {
  	let transaction, result
	let amount = tokens(10000)
  	
  	describe('Success', () => {
  	  beforeEach(async() => {
  	  	transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(1) })
  	  	result = await transaction.wait()
  	  })  	    

  	  it('transfers tokens', async() => {
  	    expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(990000))
  	    expect(await token.balanceOf(user1.address)).to.equal(amount)
  	  })

  	  it('updates contracts ether balance', async() => {
  	    expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(ether(1))
  	  })

  	  it('updates tokens sold', async() => {
  	    expect(await crowdsale.tokensSold()).to.equal(amount)
  	  })

  	  it('emits a buy event', async() => {
//  	    console.log(result)
//	    https://hardhat.org/hardhat-chai-matchers/docs/reference#.emit
  	    await expect(transaction).to.emit(crowdsale, 'Buy').withArgs(amount, user1.address)
  	  })
  	})

  	describe('Failure', () => {

  	  it('rejects insufficient ETH', async () => {
  	  	await expect(crowdsale.connect(user1).buyTokens(amount, { value: 0})).to.be.reverted
  	  })

  	  it('rejects buying more than available', async () => {
  	  	await expect(crowdsale.connect(user1).buyTokens(tokens(2000000), { value: ether(200) })).to.be.reverted
  	  })
  	})
  })

  describe('Sending ETH', () => {
  	let transaction, result
	let amount = ether(10)

  	describe('Success', () => {
  	  beforeEach(async() => {
  	  	transaction = await user1.sendTransaction({ to: crowdsale.address, value: amount})
  	  	result = await transaction.wait()
  	  })  	    

  	  it('updates contracts ether balance', async() => {
  	    expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
  	  })

  	  it('updates user token balance', async() => {
  	    expect(await token.balanceOf(user1.address)).to.equal(tokens(100000))
//  	    expect(await token.balanceOf(user1.address)).to.equal(amount)
//        const expectedAmount = ether(10).mul(pricePerEth)
//		expect(await token.balanceOf(user1.address)).to.equal(expectedAmount)
  	  })

  	})
  })
})
