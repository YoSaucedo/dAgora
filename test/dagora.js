contract('dAgora', function(accounts) {
  it("should put 10000 MetaCoin in the first account", function(done) {
    var da = dAgora.deployed();

    da.getBalance.call(accounts[0]).then(function(balance) {
      assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    }).then(done).catch(done);
  });
});
