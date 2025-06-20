const latestTime = require('./latestTime');
function increaseTime(addSeconds) {
  const id = Date.now();

  return new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: [addSeconds],
      id,
    }, (err1) => {
      if (err1) return reject(err1);

      web3.currentProvider.send({
        jsonrpc: '2.0',
        method: 'evm_mine',
        id: id + 1,
      }, (err2, res) => (err2 ? reject(err2) : resolve(res)));
    });
  });
}
// Increases testrpc time by the passed duration in seconds
module.exports = 
{
  /**
   * Beware that due to the need of calling two separate testrpc methods and rpc calls overhead
   * it's hard to increase time precisely to a target point so design your test to tolerate
   * small fluctuations from time to time.
   *
   * @param target time in seconds
   */
  increaseTimeTo: async function (target) {
    let now = await latestTime();
    now = now.toString();
    if (target < now) throw Error(`Cannot increase current time(${now}) to a moment in the past(${target})`);
    let diff = target - now;
    return await increaseTime(diff);
  },

  duration: {
    seconds: function(val) { return val},
    minutes: function(val) { return val * this.seconds(60) },
    hours:   function(val) { return val * this.minutes(60) },
    days:    function(val) { return val * this.hours(24) },
    weeks:   function(val) { return val * this.days(7) },
    years:   function(val) { return val * this.days(365)} 
  }
}