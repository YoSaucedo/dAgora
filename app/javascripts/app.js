var accounts;
var account;
var balance;

function setStatus(message, type="info") {
  var status = document.getElementById("status");
  $("#status").removeClass (function (index, css) {
    return (css.match (/(^|\s)alert-\S+/g) || []).join(' ');
  }).addClass("alert-" + type);
  status.innerHTML = message;
};

// Sets the contract address in the footer for reference
function setAddress() {
  document.getElementById("c_address").innerHTML = dAgora.deployed_address;
}

// Refresh the coinbase and contract balances
function refreshBalances() {
  document.getElementById("cb_balance").innerHTML = web3.fromWei(web3.eth.getBalance(web3.eth.coinbase), "ether").toFixed(5)+ " ETH";
  document.getElementById("c_balance").innerHTML = web3.fromWei(web3.eth.getBalance(dAgora.deployed_address), "ether").toFixed(5);
};

function listProducts() {
  var da = dAgora.deployed();
  var dphList = [];
  var products = [];
  da.productCount.call().then(function (result) {
    console.log(parseInt(result));
    for(i = 1; i <= parseInt(result); i++) {
      dphList.push(da.productMap.call(i));
    }
    Promise.all(dphList).then(function(dphArray) {
      dphArray.forEach(function(dphCode) {
        products.push(da.productList.call(dphCode));
      });
      Promise.all(products).then(function(productArray) {
        console.log(productArray);
        productArray.forEach(function(product) {
          $("#products").append("<div class='col-md-4 text-center well'><img src='https://placeimg.com/150/150/any' class='img-rounded'\><h3>" + product[1] + "</h3><h4>"+product[2]+"</h4><h5 class='price'><b>Price</b>: &Xi; " + web3.fromWei(product[4], "ether") + " </h5><h6><b>Stock</b>: "+product[5]+"</h6><p><button type='button' class='btn btn-primary' onclick='buyProduct(\""+product[0]+"\")'>Buy Now</button></p></div>");
        });
      }).catch(function(e) {
        console.error(e);
      });
    }).catch(function(e) {
      console.error(e);
    });
  }).catch(function(e) {
    console.error(e);
  });
}

function addProduct() {
  var da = dAgora.deployed();
  var price = web3.toWei(parseFloat(document.getElementById("price").value), "ether");
  var title = document.getElementById("title").value;
  var description = document.getElementById("description").value;
  var category = parseInt(document.getElementById("category").value);
  var stock = parseInt(document.getElementById("stock").value);

  setStatus("Initiating transaction... (please wait)");
  da.addProduct(title, description, category, price, stock, {from: web3.eth.coinbase, gas: 3000000}).then(function (tx_id) {
    console.log(tx_id);
    setStatus("Product added successfully", "success");
  }).catch(function (e) {
    console.log(e);
    setStatus("Error adding product: " + e, "danger");
  });
}

function buyProduct(dph) {
  setStatus("Initiating purchase... (please wait)");
  var da = dAgora.deployed();
  da.productList.call(dph).then(function(product) {
    console.log(product);
    return da.buy( dph, {from: web3.eth.coinbase, gas: 4000000, value: parseFloat(product[4])} );
  }).then(function(tx_id) {
    console.log(tx_id);
    return web3.eth.getTransactionReceiptMined(tx_id);
  }).then(function(receipt) {
    console.log(receipt);
    setStatus("Transaction complete!", "success");
    refreshBalances();
  }).catch(function (e) {
    console.log(e);
    setStatus("Couldn't Complete Transaction: " + e, "danger");
  });
}

function withdraw() {
  setStatus("Initiating Withdrawal... (please wait)");
  var da = dAgora.deployed();
  da.withdraw(web3.eth.coinbase, web3.eth.getBalance(dAgora.deployed_address), {from: web3.eth.coinbase}).then(function(tx_id) {
    console.log(tx_id);
    return web3.eth.getTransactionReceiptMined(tx_id);
  }).then(function(receipt) {
    console.log(receipt);
    setStatus("Withdrawal complete!", "success");
    refreshBalances();
    return true;
  }).catch(function(e) {
    console.error(e);
    setStatus("Couldn't Complete Withdrawal: " + e, "danger");
    return false;
  });
}

window.onload = function() {
  web3.eth.getAccounts(function(err, accs) {
    if (err != null) {
      alert("There was an error fetching your accounts.");
      return;
    }

    if (accs.length == 0) {
      alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
      return;
    }

    accounts = accs;
    account = accounts[0];

    if(document.getElementById("c_address") !== null) setAddress();
    if(document.getElementById("products") !== null) listProducts();
    refreshBalances();
  });

  web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval |= 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject);
    });
  };
}
