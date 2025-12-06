// background.js - Fetch crypto prices from background script

console.log("Background script loaded.");


// connect to cmc websocket and update prices
prices = {
    btc: 0,
    eth: 0,
}

connected = false;

function connectWebSocket() {
    try {
        ws = new WebSocket("wss://push.coinmarketcap.com/ws?device=web&client_source=home_page");

        ws.onopen = function () {
            console.log("WebSocket connection established.");
            // Subscribe to desired currencies
            const subscribeMessage = {
                "method": "RSUBSCRIPTION",
                "params": ["main-site@crypto_price_5s@{}@normal", "1,1027"]
            };
            ws.send(JSON.stringify(subscribeMessage));
            connected = true;
        };

        // Handle incoming WebSocket messages
        ws.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);

                if (data.d) {
                    if (data.d.id === 1) { // BTC price update
                        prices.btc = data.d.p;
                    } else if (data.d.id === 1027) { // ETH price update
                        prices.eth = data.d.p;
                    }
                }
            } catch (err) {
                console.error("Error parsing WebSocket message:", err);
            }
        };

        ws.onerror = function (error) {
            console.error("WebSocket Error:", error);
        };


        ws.onclose = function (event) {
            console.warn("WebSocket connection closed:", event.code, event.reason);
            attemptReconnect();
        };

    } catch (error) {
        console.error("Couldn't connect to CMC WebSocket:", error);
        attemptReconnect();
    }
}
// reconnect
function attemptReconnect() {
    console.log("Attempting to reconnect to WebSocket...");
    setTimeout(() => {
        connectWebSocket();
    }, 5000);
}

// Listen for fetchPrices request from content.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchPrices") {
        if (!connected) {
            try {
                connectWebSocket()
            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        }
        sendResponse({ success: true, prices: { btc: prices.btc, eth: prices.eth }, source: "coinmarketcap.com" });
        return true;
    }
});