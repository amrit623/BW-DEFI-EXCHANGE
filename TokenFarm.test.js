const { assert } = require('chai')
const { default: Web3 } = require('web3')

const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
.use(require('chai-as-promised'))
.should()

//helper func hook
function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}


contract('TokenFarm', ([owner, investor]) => {

     let daiToken, dappToken, tokenFarm 

     before(async () => {
         //load
         daiToken =await DaiToken.new()
         dappToken =await DappToken.new()
         tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

         //transfer
         await dappToken.transfer(tokenFarm.address, tokens('1000000'))

         //send to investor
         await daiToken.transfer(investor, tokens('100'), { from: owner })


     })




    describe('Mock DAI deployment', async () => {
        it('it has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token deployment', async () => {
        it('it has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'Dapp Token')
        })
    })

    describe('BW Token Farm deployment', async () => {
        it('it has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'BW Token Farm')
        })

        it('contract has tokens', async() => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })



    describe('Farming tokens', async () => {
       
        it('rewards investors for staking mDai tokens', async () => {
            let result
            // check investor balance
            result =await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')

            //stake mock dai
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor})
            await tokenFarm.stakeTokens(tokens('100'), { from: investor })

            //check result of staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Token Farm Mock Dai balance correct after staking')
            
            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')
   
            // Issue tokens
            await tokenFarm.issueToken({ from: owner })

            // check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor DApp Token wallet balance correct issuance')
   
            // make sure only owner can issue tokens.
            await tokenFarm.issueToken({ from: investor }).should.be.rejected;

            //unstake tokensinvestor Mock DAi
            await tokenFarm.unstakeTokens({ from: investor})


            //check results after unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking')
            
            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after staking')
   
        })


    })

})