// background.js - Fetch crypto prices from background script

console.log("Background script loaded.");

// Fetch price for a single coin
function fetchPriceForCoin(coin) {
    return fetch(`https://cryptoprices.cc/${coin}/`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status} for ${coin}`);
            return response.text();
        })
        .then(text => {
            const price = parseFloat(text.trim());
            if (isNaN(price)) throw new Error(`Invalid price for ${coin}`);
            return price;
        });
}

// Main function to fetch BTC and ETH prices
async function fetchCryptoPrices() {
    try {
        console.log('Fetching BTC price...');
        const btcPrice = await fetchPriceForCoin('BTC');
        
        console.log('Fetching ETH price...');
        const ethPrice = await fetchPriceForCoin('ETH');
        
        return {
            source: 'cryptoprices.cc',
            btc: btcPrice,
            eth: ethPrice
        };
    } catch (error) {
        console.error('Failed to fetch prices from cryptoprices.cc:', error);
        throw new Error('Failed to fetch prices. May be blocked in your region or service is down.');
    }
}

// Listen for fetchPrices request from content.js
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchPrices") {
        fetchCryptoPrices()
            .then(result => {
                sendResponse({ success: true, prices: { btc: result.btc, eth: result.eth }, source: result.source });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});