const ether = require('./helpers/ether');
const gwei = require('./helpers/gwei');
const {advanceBlock} = require('./helpers/advanceToBlock');
const {increaseTimeTo, duration} = require('./helpers/increaseTime');
const latestTime = require('./helpers/latestTime');
const EVMThrow = require('./helpers/EVMThrow');

const BN = web3.utils.BN;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BN))
  .should();
const assert = require('assert');

const MemeToken = artifacts.require('ERC20MintToken')
const MemePreSale = artifacts.require('MemePreSale')
const Vault = artifacts.require('RefundVault')

contract('PreSale', function ([deployer, investor, wallet, purchaser, purchaser2, purchaser3, purchaser4]) {

  const rate = new BN(1000)
  const cap = ether(15)
  const softCap = ether(10)
  const softCapTime = duration.hours(120)
  const goal = ether(5)
  const lessThanCap = ether(10)
  const lessThanGoal = ether(2)

  const minContribution = ether(0.1)
  const maxGasPrice = gwei(100)
  const aboveGasLimit = maxGasPrice.add(new BN(1))
  const maxGasPenalty = new BN(80)


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    let lTime = await latestTime();
    this.startTime = duration.weeks(1) + lTime;
    this.endTime =   this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1)
    this.token = await MemeToken.deployed()
    this.memePresale = await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, goal, softCap, softCapTime, cap, maxGasPrice, maxGasPenalty, wallet);

    this.vault_address = await this.memePresale.vault();

    this.vault = Vault.at(await this.memePresale.vault())
    
  })

  describe('creating a valid crowdsale', function () {

    it('should fail with zero rate', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, 0, goal, softCap, softCapTime, cap, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with zero goal', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, 0, softCap, softCapTime, cap, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with zero softCap', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, goal, 0, softCapTime, cap, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with zero cap', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, goal, softCap, softCapTime, 0, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with greater goal than softCap', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, cap, softCap, softCapTime, goal, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with greater softCap than cap', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, goal, cap, softCapTime, softCap, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with zero controller', async function () {
      await MemePreSale.new("0x0000000000000000000000000000000000000000", this.startTime, this.endTime, minContribution, rate, goal, softCap, softCapTime, cap, maxGasPrice, maxGasPenalty, wallet).should.be.rejectedWith(EVMThrow);
    })

    it('should fail with zero wallet', async function () {
      await MemePreSale.new(this.token.address, this.startTime, this.endTime, minContribution, rate, goal, softCap, softCapTime, cap, maxGasPrice, maxGasPenalty, "0x0000000000000000000000000000000000000000").should.be.rejectedWith(EVMThrow);
    })

  });

  describe('modify before sale', function () {

    it('should set valid caps', async function () {
      await this.memePresale.setCaps(goal, softCap, softCapTime, cap).should.be.fulfilled
    })

    it('should fail to set valid caps after start', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.setCaps(goal, softCap, softCapTime, cap).should.be.rejectedWith(EVMThrow);
    })

    it('should fail setting zero goal', async function () {
      await this.memePresale.setCaps(0, softCap, softCapTime, cap).should.be.rejectedWith(EVMThrow);
    })

    it('should fail setting zero softCap', async function () {
      await this.memePresale.setCaps(goal, 0, softCapTime, cap).should.be.rejectedWith(EVMThrow);
    })

    it('should fail setting zero cap', async function () {
      await this.memePresale.setCaps(goal, softCap, softCapTime, 0).should.be.rejectedWith(EVMThrow);
    })

    it('should fail setting greater goal than softCap', async function () {
      await this.memePresale.setCaps(softCap, goal, softCapTime, cap).should.be.rejectedWith(EVMThrow);
    })

    it('should fail setting greater softCap than cap', async function () {
      await this.memePresale.setCaps(goal, cap, softCapTime, softCap).should.be.rejectedWith(EVMThrow);
    })

    it('should set valid times', async function () {
      await this.memePresale.setTimes(this.startTime, this.endTime).should.be.fulfilled
    })

    it('should fail to set valid times after start', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.setTimes(this.startTime, this.endTime).should.be.rejectedWith(EVMThrow);
    })

    it('should fail to set invalid times', async function () {
      await this.memePresale.setTimes(this.endTime, this.endTime).should.be.rejectedWith(EVMThrow);
      const _lastestTime = await latestTime();
      await this.memePresale.setTimes(_lastestTime, this.endTime).should.be.rejectedWith(EVMThrow);
    })

    it('should set valid rate', async function () {
      await this.memePresale.setRate(rate.add(new BN(1))).should.be.fulfilled
    })

    it('should fail to set valid rate after start', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.setRate(rate.add(new BN(1))).should.be.rejectedWith(EVMThrow);
    })

    it('should fail to set invalid rate', async function () {
      await this.memePresale.setRate(0).should.be.rejectedWith(EVMThrow);
    })

  })

 
  describe('ending', function () {

    it('should be ended after end time', async function () {
      let ended = await this.memePresale.hasEnded()
      ended.should.equal(false)
      await increaseTimeTo(this.afterEndTime)
      ended = await this.memePresale.hasEnded()
      ended.should.equal(true)
    })

    it('should be ended after soft cap reached', async function () {
      await increaseTimeTo(this.startTime)
      let res = await this.memePresale.send(softCap).should.be.fulfilled
      let ended = await this.memePresale.hasEnded()
      //console.log('res=', res)
      //console.log('ended=', ended)
      ended.should.equal(false)

      let lTime = await latestTime();
      let newEndTime = lTime + softCapTime + duration.seconds(1)
      await increaseTimeTo(newEndTime)
      ended = await this.memePresale.hasEnded()
      ended.should.equal(true)
    })

    it('should not end sooner if softCap is not reached', async function () {
      await increaseTimeTo(this.startTime)
      await this.memePresale.send(goal).should.be.fulfilled
      let ended = await this.memePresale.hasEnded()
      ended.should.equal(false)

      let lTime = await latestTime();
      let newEndTime = lTime + softCapTime + duration.seconds(1)
      await increaseTimeTo(newEndTime)
      ended = await this.memePresale.hasEnded()
      ended.should.equal(false)

      await increaseTimeTo(this.afterEndTime)
      ended = await this.memePresale.hasEnded()
      ended.should.equal(true)
    })

  })


  describe('accepting payments', function () {

    it('should reject payments before start', async function () {
      await this.memePresale.send(minContribution).should.be.rejectedWith(EVMThrow)
      await this.memePresale.buyTokens(investor, {from: purchaser, value: minContribution}).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments smaller than min contribution', async function () {
      await increaseTimeTo(this.startTime)
      await this.memePresale.send(minContribution.sub(new BN(1))).should.be.rejectedWith(EVMThrow)
      await this.memePresale.buyTokens(investor, {value: minContribution.sub(new BN(1)), from: purchaser}).should.be.rejectedWith(EVMThrow)
    })

    it('should accept payments after start', async function () {
      await increaseTimeTo(this.startTime)
      await this.memePresale.send(minContribution).should.be.fulfilled
      await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser}).should.be.fulfilled
    })

    it('should measure buyTokens tx costs', async function () {
        await increaseTimeTo(this.startTime)
        let tx = await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser}).should.be.fulfilled
        console.log("*** BUY TOKENS: " + tx.receipt.gasUsed + " gas used.");
    })

    it('should reject payments after end', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.send(minContribution).should.be.rejectedWith(EVMThrow)
      await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser}).should.be.rejectedWith(EVMThrow)
    })

    it('should reject payments outside cap', async function () {
      await increaseTimeTo(this.startTime)

      await this.memePresale.sendTransaction({value: cap, from: purchaser2}).should.be.fulfilled
      await this.memePresale.send(1).should.be.rejectedWith(EVMThrow)
    })

    it('should refund payments that exceed cap', async function () {
      await increaseTimeTo(this.startTime)
      const pre = await web3.eth.getBalance(purchaser4)
    //   console.log('pre balance', pre)

      await this.memePresale.sendTransaction({value: lessThanCap, from: purchaser3}).should.be.fulfilled
      await this.memePresale.sendTransaction({value: cap, from: purchaser4, gasPrice:0}).should.be.fulfilled
      
      const post = await web3.eth.getBalance(purchaser4)
    //   console.log('post balance', post)
      
    //   console.log('pre.sub(new BN(post))=', new BN(pre).sub(new BN(post)).toString())
    //   console.log('cap.sub(new BN(lessThanCap))=', cap.sub(lessThanCap).toString())

      assert.equal(new BN(pre).sub(new BN(post)).toString(), cap.sub(lessThanCap).toString()); 
    })

  })

  describe('high-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })

    it('should log purchase', async function () {
      const {logs} = await this.memePresale.sendTransaction({value: minContribution, from: investor})

      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)

      // console.log('event.args = ', event.args)
      // console.log('minContribution = ', minContribution.toString())
      // console.log('rate = ', rate.toString())
      // console.log('investor = ', investor)

      assert.equal(event.args._purchaser, investor)
      assert.equal(event.args._beneficiary, investor)
      assert.equal(event.args._value.toString(), minContribution.toString())
      assert.equal(event.args._amount.toString(), minContribution.mul(new BN(rate)).toString())
    })

    it('should assign stake to sender', async function () {
      await this.memePresale.sendTransaction({value: minContribution, from: investor})
      let balance = await this.memePresale.stakes(investor);
      assert.equal(balance, minContribution.toString())
    })

    it('should assign lower stake to sender above max gas limit', async function () {
      await this.memePresale.sendTransaction({value: minContribution, from: investor, gasPrice: aboveGasLimit})
      let balance = await this.memePresale.stakes(investor);
      
      //console.log('maxGasPenalty=', maxGasPenalty.toString())
      assert.equal(balance.toString(), minContribution.mul(maxGasPenalty).div(new BN(100)).toString())
    })

    it('should forward funds to vault', async function () {
      const pre = await web3.eth.getBalance(this.vault_address)
      await this.memePresale.sendTransaction({value: minContribution, from: investor})
      const post = await web3.eth.getBalance(this.vault_address)
      assert.equal(new BN(post).sub(new BN(pre)).toString(), minContribution.toString())
    })

  })

  describe('low-level purchase', function () {

    beforeEach(async function() {
      await increaseTimeTo(this.startTime)
    })
    
    it('should log purchase', async function () {
      const {logs} = await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser})
    
      const event = logs.find(e => e.event === 'TokenPurchase')

      should.exist(event)

      assert.equal(event.args._purchaser, purchaser)
      assert.equal(event.args._beneficiary, investor)
      assert.equal(event.args._value.toString(), minContribution.toString())
      assert.equal(event.args._amount.toString(), minContribution.mul(new BN(rate)).toString())
    })
    
    it('should assign stakes to beneficiary', async function () {
      await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser})
      const balance = await this.memePresale.stakes(investor)
      assert.equal(balance.toString(), minContribution.toString())
    })

    it('should assign lower stake to sender above max gas limit', async function () {
      await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser, gasPrice: aboveGasLimit})
      let balance = await this.memePresale.stakes(investor);
      //console.log('maxGasPenalty=', maxGasPenalty.toString())
      assert.equal(balance.toString(),minContribution.mul(maxGasPenalty).div(new BN(100)).toString())
    })
    
    it('should forward funds to vault', async function () {
      const pre = await web3.eth.getBalance(this.vault_address)
      await this.memePresale.buyTokens(investor, {value: minContribution, from: purchaser})
      const post = await web3.eth.getBalance(this.vault_address)
      assert.equal(new BN(post).sub(new BN(pre)).toString(), minContribution.toString())
    })

  })


  describe('refund', function () {
    
    it('should deny refunds before end', async function () {
      await this.memePresale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
      await increaseTimeTo(this.startTime)
      await this.memePresale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should deny refunds after end if goal was reached', async function () {
      await increaseTimeTo(this.startTime)
      await this.memePresale.sendTransaction({value: goal, from: investor})
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.claimRefund({from: investor}).should.be.rejectedWith(EVMThrow)
    })

    // it('should allow refunds after end if goal was not reached', async function () {
    //   await increaseTimeTo(this.startTime)
    //   await this.memePresale.sendTransaction({value: lessThanGoal, from: investor})
    //   await increaseTimeTo(this.afterEndTime)

    //   await this.memePresale.finalize({from: deployer})

    //   const pre = await web3.eth.getBalance(investor)
    //   console.log('pre===', pre)
    //   await this.memePresale.claimRefund({from: investor, gasPrice: 0}).should.be.fulfilled
    //   const post = await web3.eth.getBalance(investor)
    //   console.log('post===', post)
    //   assert.equal(new BN(post).sub(new BN(pre)).toString(), lessThanGoal.toString())
    // })

    // it('should get full refund even when max gas penalty was applied', async function () {
    //   await increaseTimeTo(this.startTime)
    //   await this.memePresale.sendTransaction({value: lessThanGoal, from: investor, gasPrice:aboveGasLimit})
    //   await increaseTimeTo(this.afterEndTime)

    //   await this.memePresale.finalize({from: deployer})

    //   const pre = await web3.eth.getBalance(investor)
    //   await this.memePresale.claimRefundsFor([investor],{gasPrice: 0}).should.be.fulfilled
    //   const post = await web3.eth.getBalance(investor)

    //   assert.equal(new BN(post).sub(new BN(pre)).toString(), lessThanGoal.toString())
    // })

    // it('should forward funds to wallet after end if goal was reached', async function () {
    //   const pre = await web3.eth.getBalance(wallet)

    //   await increaseTimeTo(this.startTime)
    //   await this.memePresale.sendTransaction({value: goal, from: investor})
    //   await increaseTimeTo(this.afterEndTime)
      
    //   await this.memePresale.finalize({from: deployer})
    //   const post = await web3.eth.getBalance(wallet)

    //   assert.equal(new BN(post).sub(new BN(pre)).toString(), goal.toString())
    // })

    it('should forward funds to wallet when getting at least goal amount of funds', async function () {
      const pre = await web3.eth.getBalance(wallet)

      await increaseTimeTo(this.startTime)
      await this.memePresale.sendTransaction({value: goal, from: investor})
      
      const post = await web3.eth.getBalance(wallet)

      assert.equal(new BN(post).sub(new BN(pre)).toString(), goal.toString())
    })

    it('should not forward funds until getting goal amount of funds', async function () {
      const pre = await web3.eth.getBalance(wallet)
      const preVault = await web3.eth.getBalance(this.vault_address)

      await increaseTimeTo(this.startTime)
      await this.memePresale.sendTransaction({value: goal.sub(new BN(1)), from: investor})
      
      const post = await web3.eth.getBalance(wallet)
      const postVault = await web3.eth.getBalance(this.vault_address)

      assert.equal(new BN(post).sub(new BN(pre)).toString(), 0)
      assert.equal(new BN(postVault).sub(new BN(preVault)).toString(), goal.sub(new BN(1)).toString())
    })

    it('should fail to extract ether from vault if failed to reach goal', async function () {
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.extractVaultTokens("0x0000000000000000000000000000000000000000", wallet).should.be.rejectedWith(EVMThrow)
    })

  })


  describe('claim token', function () {
    
    it('should deny claim token before end', async function () {
      await this.memePresale.claimToken({from: investor}).should.be.rejectedWith(EVMThrow)
      await increaseTimeTo(this.startTime)
      await this.memePresale.claimToken({from: investor}).should.be.rejectedWith(EVMThrow)
    })

    it('should deny claim token after end if goal was not reached', async function () {
      await increaseTimeTo(this.startTime)
      await this.memePresale.sendTransaction({value: lessThanGoal, from: investor})
      await increaseTimeTo(this.afterEndTime)
      await this.memePresale.claimToken({from: investor}).should.be.rejectedWith(EVMThrow)
    })

    // it('should allow claim token after end if goal was reached', async function () {
    //   await increaseTimeTo(this.startTime)
    //   await this.memePresale.sendTransaction({value: goal, from: investor})
    //   await increaseTimeTo(this.afterEndTime)

    //   //no claim before finalize
    //   await this.memePresale.claimToken({from: investor, gasPrice: 0}).should.be.rejectedWith(EVMThrow)

    //   //valid claim after finalize
    //   await this.memePresale.finalize({from: deployer})
    //   const pre = await this.token.balanceOf(investor)
    //   await this.memePresale.claimTokensFor([investor],{gasPrice: 0}).should.be.fulfilled
    //   const post = await this.token.balanceOf(investor)

    //   assert.equal(new BN(post).sub(new BN(pre)).toString(), goal.mul(rate).toString())

    //   //invalid claim after finalize
    //   await this.memePresale.claimToken({from: purchaser, gasPrice: 0}).should.be.rejectedWith(EVMThrow)
    // })

    // it('should calculate with max gas penalty when claiming tokens', async function () {
    //   await increaseTimeTo(this.startTime)
    //   await this.memePresale.sendTransaction({value: goal, from: investor, gasPrice:aboveGasLimit})
    //   await increaseTimeTo(this.afterEndTime)

    //   //valid claim after finalize
    //   await this.memePresale.finalize({from: deployer})
    //   const pre = await this.token.balanceOf(investor)
    //   await this.memePresale.claimToken({from: investor, gasPrice: 0}).should.be.fulfilled
    //   const post = await this.token.balanceOf(investor)

    //   assert.equal(new BN(post).sub(new BN(pre)).toString(), goal.mul(rate).mul(maxGasPenalty).div(new BN(100)).toString())
    // })
  })

  describe('whitelist', function () {

    it('should allow to set whitelist until start', async function () {
      await this.memePresale.setWhitelist([investor,purchaser],[],[ether(1),ether(2)]).should.be.fulfilled
    })

    it('should not allow to set whitelist after start', async function () {
      await this.memePresale.setWhitelist([investor,purchaser],[],[ether(1),ether(2)]).should.be.fulfilled
      await increaseTimeTo(this.startTime)
      await this.memePresale.setWhitelist([investor,purchaser],[],[ether(1),ether(2)]).should.be.rejectedWith(EVMThrow)
    })

    it('should allow to delete from the whitelist', async function () {
      // add
      await this.memePresale.setWhitelist([investor,purchaser],[],[ether(1),ether(2)]).should.be.fulfilled

      let ok = await this.memePresale.whitelist(investor)
      ok.should.equal(true)

      ok = await this.memePresale.whitelist(purchaser)
      ok.should.equal(true)

      let wlDays = await this.memePresale.whitelistDayCount()
      assert.equal(wlDays.toString(), '2')

      // remove
      await this.memePresale.setWhitelist([],[purchaser],[]).should.be.fulfilled

      ok = await this.memePresale.whitelist(investor)
      ok.should.equal(true)

      ok = await this.memePresale.whitelist(purchaser)
      ok.should.equal(false)

      wlDays = await this.memePresale.whitelistDayCount()
      assert.equal(wlDays.toString(), '2')
    })

    it('should allow to modify whitelist days', async function () {
      // set to 2 days with 1 and 2 ether stake limits
      await this.memePresale.setWhitelist([investor],[],[ether(1),ether(2)]).should.be.fulfilled

      let ok = await this.memePresale.whitelist(investor)
      ok.should.equal(true)

      let wlDays = await this.memePresale.whitelistDayCount()
      assert.equal(wlDays.toString(), '2')

      let limit = await this.memePresale.whitelistDayMaxStake(0)
      assert.equal(limit.toString(), ether(0).toString())
      
      limit = await this.memePresale.whitelistDayMaxStake(1)
      assert.equal(limit.toString(), ether(1).toString())
      
      limit = await this.memePresale.whitelistDayMaxStake(2)
      assert.equal(limit.toString(), ether(2).toString())

      // set to 1 day with 2 ether stake limit
      await this.memePresale.setWhitelist([],[],[ether(2)]).should.be.fulfilled

      ok = await this.memePresale.whitelist(investor)
      ok.should.equal(true)

      wlDays = await this.memePresale.whitelistDayCount()
      assert.equal(wlDays.toString(), '1')

      limit = await this.memePresale.whitelistDayMaxStake(0)
      assert.equal(limit.toString(), ether(0).toString())
      
      limit = await this.memePresale.whitelistDayMaxStake(1)
      assert.equal(limit.toString(), ether(2).toString())
      
      // should be 2 ether, since it is overwriting till the new length
      limit = await this.memePresale.whitelistDayMaxStake(2)
      assert.equal(limit.toString(), ether(2).toString())
    })

    it('should not allow unwhitelisted contribution during whitelist period', async function () {
      await this.memePresale.setWhitelist([investor],[],[minContribution.mul(new BN(2)),minContribution.mul(new BN(3))]).should.be.fulfilled
      await increaseTimeTo(this.startTime)

      await this.memePresale.sendTransaction({value: minContribution, from: purchaser3}).should.be.rejectedWith(EVMThrow)
    })

    it('should allow contribution during whitelist period for whitelist addresses', async function () {
      await this.memePresale.setWhitelist([investor],[],[minContribution.mul(new BN(2)),minContribution.mul(new BN(3))]).should.be.fulfilled
      await increaseTimeTo(this.startTime)

      await this.memePresale.sendTransaction({value: minContribution, from: investor}).should.be.fulfilled
      await this.memePresale.sendTransaction({value: minContribution, from: purchaser}).should.be.rejectedWith(EVMThrow)

      await increaseTimeTo(this.startTime+duration.days(2))
      await this.memePresale.sendTransaction({value: minContribution, from: purchaser}).should.be.fulfilled
    })

    it('should apply max gas price penalty during whitelist period', async function () {
      await this.memePresale.setWhitelist([investor],[],[minContribution.mul(new BN(2)),minContribution.mul(new BN(3))]).should.be.fulfilled
      await increaseTimeTo(this.startTime)

      await this.memePresale.sendTransaction({value: minContribution.mul(new BN(2)).div(maxGasPenalty).mul(new BN(100)), from: investor, gasPrice:aboveGasLimit}).should.be.fulfilled
      
      const stake = await this.memePresale.stakes(investor)
      //console.log('stake.toString()=', stake.toString())
      //console.log('minContribution.mul(new BN(2)).toString()=', minContribution.mul(new BN(2)).toString())
      assert.equal(stake.toString(), minContribution.mul(new BN(2)).toString())
    })

    it('should refund excess contribution during whitelist period', async function () {
      await this.memePresale.setWhitelist([investor],[],[minContribution.mul(new BN(2)),minContribution.mul(new BN(3))]).should.be.fulfilled
      await increaseTimeTo(this.startTime)

      const pre = await web3.eth.getBalance(investor)
      await this.memePresale.sendTransaction({value: minContribution.mul(new BN(5)), from: investor, gasPrice:0}).should.be.fulfilled
      const post = await web3.eth.getBalance(investor)

      assert.equal(new BN(pre).sub(new BN(post)), minContribution.mul(new BN(2)).toString())
    })

    it('should deny contribution above whitelist limit during whitelist period', async function () {
      await this.memePresale.setWhitelist([investor],[],[minContribution.mul(new BN(2)),minContribution.mul(new BN(3))]).should.be.fulfilled
      await increaseTimeTo(this.startTime)

      await this.memePresale.sendTransaction({value: minContribution.mul(new BN(2)), from: investor}).should.be.fulfilled
      await this.memePresale.sendTransaction({value: 1, from: investor}).should.be.rejectedWith(EVMThrow)
    })
  })
})