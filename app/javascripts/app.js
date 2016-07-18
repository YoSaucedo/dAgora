var accounts;
var account;
var balance;
var gpcJSON;

/**
 * Set a message in the status bar
 * @param message The Message to place in the status bar
 * @param type The kind of message to place, based on bootstrap alerts (http://getbootstrap.com/components/#alerts)
 */
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

// List all the products from the current contract
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
          $("#products").append("<div class='col-md-4 text-center'><div class='well product product-home'><div class='ribbon'><span>&Xi; " + web3.fromWei(product[4], "ether") + "</span></div><img src='https://placeimg.com/150/150/any' class='img-rounded'\><h3>" + product[1] + "</h3><h4>"+product[2]+"</h4><h5 class='price'><b>Category</b>: " + gpcJSON.segment[product[3]].description + " </h5><h6><b>Stock</b>: "+product[5]+"</h6><p><button type='button' class='btn btn-primary' onclick='buyProduct(\""+product[0]+"\")'>Buy Now</button></p></div></div>");
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

/**
 * Add a new product to the contract.
 * @param title The title of the product
 * @param description A description of the prodcut
 * @param gpcSegment The GPC product segment code (see http://www.gs1.org/gpc)
 * @param price The price of the product in ETH
 * @param stock The amount of starting stock
 */
function addProduct(title, description, gpcSegment, price, stock) {
  var da = dAgora.deployed();
  console.log(title); console.log(description); console.log(gpcSegment); console.log(price); console.log(stock);
  setStatus("Initiating transaction... (please wait)");
  da.addProduct(title, description, gpcSegment, price, stock, {from: web3.eth.coinbase, gas: 3000000}).then(function (tx_id) {
    console.log(tx_id);
    setStatus("Product added successfully", "success");
  }).catch(function (e) {
    console.log(e);
    setStatus("Error adding product: " + e, "danger");
  });
}

/**
 * Update the stock count of a product
 * @param dphCode The DPH code that identifies/indexes the product
 * @param newStock The new stock amount to set for the product.
 */
function updateProductStock(dphCode, newStock) {
  var da = dAgora.deployed();
  setStatus("Updating Product... (please wait)");
  da.updateProductStock(dphCode, newStock, {from: web3.eth.coinbase, gas: 3000000}).then(function (tx_id) {
    console.log(tx_id);
    return web3.eth.getTransactionReceiptMined(tx_id);
  }).then(function(receipt) {
    console.log(receipt);
    setStatus("Product updated successfully", "success");
  }).catch(function (e) {
    console.log(e);
    setStatus("Error updating product: " + e, "danger");
  });
}

/**
 * Purchase a product using the current coinbase
 * @param dph The DPH code of the product to purchase
 */
function buyProduct(dph) {
  setStatus("Initiating purchase... (please wait)");
  var da = dAgora.deployed();
  da.productList.call(dph).then(function(product) {
    console.log(product);
    return da.buy( dph, {from: web3.eth.coinbase, gas: 3000000, value: parseFloat(product[4])} );
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

/**
 * Withdraw funds from the current contract
 * @param address (optional) The address to withdraw to. Defaults to the contract Administrator
 * @param amount (optional) The amount (in ETH) to withdraw. Defaults to the entire balance.
 */
function withdraw(address=false, amount=false) {
  setStatus("Initiating Withdrawal... (please wait)");
  var da = dAgora.deployed();
  amount = (amount !== false ) ? web3.toWei(amount, "ether") : web3.eth.getBalance(dAgora.deployed_address);
  console.log(amount);
  address = (address !== false ) ? address : web3.eth.coinbase;
  console.log(address);

  da.withdraw(address, amount, {from: web3.eth.coinbase}).then(function(tx_id) {
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

  var gpc = $.getJSON("/json/gpcCodes.json", function( data ) {
    gpcJSON = data;
    var items = [];
    if($("#gpcSegment").length > 0) {
      $.each( data.segment, function( key, val ) {
        $("#gpcSegment").append( "<option value='" + key + "'>" + val.description + "</li>" );
      });
    }
  });

  /** Form functions triggered below */

  $("#addProductFormButton").click(function(e) {
    e.preventDefault();
    var price = web3.toWei(parseFloat(document.getElementById("price").value), "ether");
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var gpcSegment = parseInt(document.getElementById("gpcSegment").value);
    var stock = parseInt(document.getElementById("stock").value);
    addProduct(title, description, gpcSegment, price, stock);
  });

  $("#withdrawFormButton").click(function(e) {
    e.preventDefault();
    var recipient = document.getElementById("recipient").value;
    var amount = document.getElementById("amount").value;
    withdraw(recipient, amount);
  });

  $("#updateStockButton").click(function(e) {
    e.preventDefault();
    var dphCode = document.getElementById("dphCode").value;
    var stock = document.getElementById("stock").value;
    updateProductStock(dphCode, stock);
  });
}
