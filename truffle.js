module.exports = {
  build: {
    "index.html": "index.html",
    "add.html": "add.html",
    "withdraw.html": "withdraw.html",
    "update.html": "update.html",
    "app.js": [
      "javascripts/app.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/",
    "json/": "javascripts/json/"
  },
  deploy: [
    "dAgora",
  ],
  rpc: {
    host: "localhost",
    port: 8545
  }
};
