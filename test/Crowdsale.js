const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}
const ether = tokens

describe('Crowdsale', () => {
  let crowdsale, token
  let accounts, deployer, user1
  let pricePerEth
  let startTime

  beforeEach(async () => {
  	//load contracts
    const Crowdsale = await ethers.getContractFactory('Crowdsale')
    const Token = await ethers.getContractFactory('Token')
    pricePerEth = tokens(10000)

    //deploy token
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')
    await token.deployed()
    //deploy crowdsale
    crowdsale = await Crowdsale.deploy(token.address, pricePerEth, 1000000)
    await crowdsale.deployed()
    startTime = await crowdsale.creationTime()
//    let provid = new ethers.JsonRpcProvider('http://localhost:8545')

    //configure accouts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    //send tokens to crowdsale
    let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
    await transaction.wait()
  })

  describe('Deployment', () => {

//  	it('has correct name', async() => {
//  	  expect(await crowdsale.name()).to.equal('Crowdsale')
//  	})

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

  describe('Adding Address to Whitelist', () => {
    let add, added

    beforeEach(async () => {
//      add = await crowdsale.connect(deployer).addAddress(user2.address)
      add = await crowdsale.connect(deployer).addAddressToMapping(user2.address)
      added = await add.wait()
    })

    describe('Success', () => {
//      beforeEach(async () => {
//        add = await crowdsale.connect(deployer).addAddress(user2.address)
//        added = await add.wait()
//      })

      it('added address', async () => {
//        expect(await crowdsale.whiteList(0)).to.equal(user2.address)
        expect(await crowdsale.whiteListMap(user2.address)).to.equal(true)
      })

      it('emits AddedAddress event', async () => {
        await expect(add).to.emit(crowdsale, "AddedAddress").withArgs(user2.address)
      })
    })

    describe('Failure', async() => {
//      beforeEach(async () => {
//        add = await crowdsale.connect(deployer).addAddress(user2.address)
//        added = await add.wait()
//      })

      it('rejects other user from adding address', async () => {
//        await expect(crowdsale.connect(user1).addAddress(user2.address)).to.be.reverted
        await expect(crowdsale.connect(user1).addAddressToMapping(user2.address)).to.be.reverted
      })      

//      it('rejects adding address twice', async () => {
//        await expect(crowdsale.connect(deployer).addAddress(user2.address)).to.be.reverted
//      })      
    })
  })

  describe('MerkleTree', () => {
    let addresses = []
    let element
    let leaves, tree, root

    beforeEach(async () => {
      accounts.forEach(element => {
        addresses.push(element.address)
      })
      leaves = addresses.map((add) => SHA256(add))
      tree = new MerkleTree(leaves, SHA256)
      root = tree.getRoot().toString('hex')
    })    

    it('shows array content', () => {
      console.log(addresses)
    })

    it('verifies addresses', () => {
      const verifyAddress = (add) => {
        const hashedAddress = SHA256(add)
        const proof = tree.getProof(hashedAddress)
        const verified = tree.verify(proof, hashedAddress, root)
        console.log(`${add} is ${verified ? "whitelisted" : "not whitelisted"}.`)
      }
      verifyAddress(accounts[0].address)
    })
  })

  describe('Checking for time window', () => {
    let add, added
    describe('Success', () => {
      it('current timestamp is after release timestamp', async() => {
//        const currentBlock = await provid.getBlock('latest')
        const currentTime = await crowdsale.getTime()
//        console.log(currentBlock)
        console.log(currentTime)
        expect(currentTime).to.be.gte(startTime)
      })
//      it('current time within time window', async () => {
//        current = await provid.getBlock('latest')
//        expect(await crowdsale.timeWindow(current)).to.equal(true)
//      })
    })

    describe('Failure', () => {
//  increase time by 4 weeks + 1 second      
      const timeIncrease = (60*60*24*7*4)+1
      let newTime

      beforeEach(async() => {
        add = await crowdsale.connect(deployer).addAddressToMapping(user1.address)
        added = await add.wait()
      }) 

      it('cannot receive ETH after timewindow', async () => {
        newTime = await ethers.provider.send("evm_increaseTime", [timeIncrease])
        const currentTime = await crowdsale.getTime()
        console.log(currentTime)
        console.log(newTime)
        await expect(user1.sendTransaction({ to: crowdsale.address, value: ether(1)})).to.be.reverted
      })
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
	  let amountTokens = tokens(100000)
    let insufficientAmount = ether(0.0009)
    let add, added

  	describe('Success', () => {

  	  beforeEach(async() => {
//        add = await crowdsale.connect(deployer).addAddress(user1.address)
        add = await crowdsale.connect(deployer).addAddressToMapping(user1.address)
        added = await add.wait()
  	  	transactionEth = await user1.sendTransaction({ to: crowdsale.address, value: amount})
  	  	resultEth = await transactionEth.wait()
//  	  	transactionToken = await crowdsale.connect(user1).buyTokens(amountTokens, { value: amount })
//  	  	resultToken = await transactionToken.wait()
  	  })  	    

  	  it('updates contracts ether balance', async() => {
  	    expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
  	  })

  	  it('updates user token balance', async() => {
  	    expect(await token.balanceOf(user1.address)).to.equal(tokens(100000))
  	  })

  	})

    describe('Failure', () => {

      beforeEach(async() => {
//        add = await crowdsale.connect(deployer).addAddress(user1.address)
        add = await crowdsale.connect(deployer).addAddressToMapping(user1.address)
        added = await add.wait()
      })        

      it('rejects non-whitelisted user from sending ETH', async() => {
        await expect(user2.sendTransaction({ to: crowdsale.address, value: amount})).to.be.reverted
      })

      it('rejects insufficient token purchase', async() => {
        await expect(user1.sendTransaction({ to: crowdsale.address, value: insufficientAmount})).to.be.reverted
      })

      it('rejects purchase of more than max tokens at once', async() => {
        await expect(user1.sendTransaction({ to: crowdsale.address, value: ether(10.1)})).to.be.reverted
      })

      it('rejects purchase of more than max tokens in total', async() => {
        transactionEth = await user1.sendTransaction({ to: crowdsale.address, value: ether(10)})
        resultEth = await transactionEth.wait()
        console.log(await token.balanceOf(user1.address))
        console.log(await crowdsale.totalBought(user1.address))
        await expect(user1.sendTransaction({ to: crowdsale.address, value: ether(0.1)})).to.be.reverted
      })


    })
  })

  describe('Updating Price', () => {
  	let transaction, result
  	let price = ether(2)

  	describe('Success', () => {

  	  beforeEach(async () => {
  	  	transaction = await crowdsale.connect(deployer).setPrice(ether(2))
  	  	result = await transaction.wait()
  	  })

  	  it('updates the price', async () => {
  	  	expect(await crowdsale.price()).to.equal(ether(2))
  	  })

  	})

  	describe('Failure', () => {
  	
  	  it('prevents non-owner from updating price', async() => {
  	  	await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
  	  })
  	})


  })


  describe('Finalizing Sale', () => {
  	let transaction, result
  	let amount = tokens(10000)
  	let value = ether(1)

  	describe('Success', () => {
  	  beforeEach(async () => {
  		transaction = await crowdsale.connect(user1).buyTokens(amount, { value: value})
  		result = await transaction.wait()

  		transaction = await crowdsale.connect(deployer).finalize()
  	    result = await transaction.wait()
  	  })

  	  it('transfers remaining tokens to owner', async () => {
  	  	expect(await token.balanceOf(crowdsale.address)).to.equal(0)
  	  	expect(await token.balanceOf(deployer.address)).to.equal(tokens(990000))
  	  })

  	  it('transfers ETH balance to owner', async () => {
  	  	expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
  	  })

  	  it('emits Finalize event', async () => {
  	  	await expect(transaction).to.emit(crowdsale, "Finalize")
  	  	  .withArgs(amount, value)
  	  })
  	})

  	describe('Failure', () => {
  	  it('prevents non-owner from finalizing', async () => {
  	  	await expect(crowdsale.connect(user1).finalize()).to.be.reverted
  	  })
  	})
  })
})
