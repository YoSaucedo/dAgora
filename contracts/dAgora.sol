/**
 * @title dAgora
 * @author Paul Szczesny
 * A decentralized marketplace
 */
contract dAgora {
	enum OrderStatus { New, Pending, Shipped, Cancelled, Refunded, Complete }

	// Data structure representing a generic product
	struct Product {
		uint price;
		uint stock;
	}
	struct Order {
		uint id;
		address customer;
		uint totalCost;
		uint productId;
		OrderStatus status;
	}

	address public admin;
	mapping (uint => Product) public productList;
	uint public productCount;
	mapping (address => mapping (uint => Order) ) public orderList;
	mapping (address => uint) public orderCount; // Maintains an order counter for each customer so that the orderList mapping can be iterated

	// Check whether the current transaction is coming from the administrator
	modifier isAdmin() {
		if(msg.sender != admin) throw;
		_
	}

	function dAgora() {
		admin = msg.sender;
		productCount = 0;
	}

	/**
	 * Add a new product to the marketplace
	 * @param price The price of this product in Wei
	 * @param stock The beginning level of stock for this product
	 */
	function addProduct(uint price, uint stock) isAdmin returns (bool success) {
		uint nextIndex = productCount + 1;
		productCount = nextIndex;
		productList[nextIndex] = Product(price, stock);
		return true;
	}

	/**
	 * Purchase a product via it's ID
	 * @param index The product ID associated with the product to purchase
	 */
	function buy(uint index) {
		uint price = productList[index].price;
		if(msg.value < price) throw;
		if(msg.value > price) {
			if(!msg.sender.send(msg.value - price)) throw;
		}
		uint nextId = orderCount[msg.sender] + 1;
		orderList[msg.sender][nextId] = Order(nextId, msg.sender, price, index, OrderStatus.New);
		orderCount[msg.sender]++;
		productList[index].stock--;
	}

	/**
	 * Withdraw funds from the contract
	 * @param recipient The Address to withdraw funds to
	 * @param amount The amount of funds to withdraw in Wei
	 */
	function withdraw(address recipient, uint amount) isAdmin {
		if(!recipient.send(amount)) throw;
	}

	/**
	 * TODO
	 */
	function updateProductStock(bytes32 dphCode, uint newStock) isAdmin {

	}

	/**
	 * TODO
	 */
	function updateOrderStatus(bytes32 dphCode, OrderStatus status) isAdmin {

	}

	/**
	 * TODO
	 * @dev Need to deal with the fact that sequential numbered indexes are being used
	 */
	function removeProduct() isAdmin {

	}
}
