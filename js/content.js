// content.js - Final Version with All Fixes

console.log("✅ content.js loaded successfully!");

window.browser = window.browser || window.chrome;

const Bitcointalk = {
    init: function (key, value, event) {
        this.setStorage(key, value);
        switch (key) {
            case "signature":
                this.toggleSignature(value);
                break;
            case "avatar":
                this.toggleAvatar(value);
                break;
            case "theme":
                this.toggleTheme(value);
                break;
            case "price":
                this.displayBitcoinPrice(value);
                break;
            case "zoom":
                this.zoomFontSize(value, event);
                break;
            case "pins":
                this.pinsPost(value);
                break;
        }
    },
    setStorage: function (key, value) {
        browser.storage.local.get('bitcointalk', function (storage) {
            let newStorage = {};
            if (storage && storage.bitcointalk && typeof storage.bitcointalk === 'object') {
                newStorage = storage.bitcointalk;
            }
            newStorage[key] = value;
            browser.storage.local.set({ 'bitcointalk': newStorage });
        });
    },
    getAnStorage: function (key, callback) {
        browser.storage.local.get('bitcointalk', function (storage) {
            callback(storage.bitcointalk && storage.bitcointalk[key] !== undefined ? storage.bitcointalk[key] : {});
        });
    },
    clearStorege: function () {
        browser.storage.local.clear(function () {
            console.log("Storage cleared.");
        });
    },
    httpGet: function (theUrl, callback) {
        fetch(theUrl).then(response => response.text()).then(html => {
            callback(html);
        });
    },
    externalLink: function () {
        let externalLink = document.getElementsByTagName("a");
        for (let i = 0; i < externalLink.length; i++) {
            if (!externalLink[i].href.includes("bitcointalk.org") && externalLink[i].href.includes("http")) {
                externalLink[i].setAttribute('target', "_blank");
            }
        }
    },
    toggleTheme: function (value) {
        let styleOld = document.getElementsByClassName("bitcointalk-css-inject");
        if (styleOld.length > 0) {
            styleOld[0].remove();
        }
        if (value !== "on" && !isNaN(parseInt(value))) {
            let urlCss = browser.runtime.getURL(`css/bitcointalk/${value}.css`);
            fetch(urlCss).then(response => response.text()).then(css => {
                let style = document.createElement("style");
                let head = document.querySelector("head") || document.head || document.documentElement;
                style.className = "bitcointalk-css-inject";
                style.innerHTML = css;
                head.appendChild(style);
            });
        }
    },
    toggleSignature: function (value) {
        let signature = document.getElementsByClassName("signature");
        for (let i = 0; i < signature.length; i++) {
            signature[i].style.display = (value === "on" ? "none" : "block");
        }
    },
    toggleAvatar: function (value) {
        let img = document.getElementsByTagName("img");
        for (let i = 0; i < img.length; i++) {
            if (img[i].src.includes('useravatars')) {
                img[i].style.display = (value === "on" ? "none" : "block");
            }
        }
    },
    zoomFontSize: function (value, event) {
        let newFontSize;

        if (event === 0) {
            newFontSize = !isNaN(parseInt(document.body.style.zoom)) ? parseInt(document.body.style.zoom) : 100;
            if (value === "plus") {
                newFontSize += 5;
            } else if (value === "minus") {
                newFontSize -= 5;
            } else {
                newFontSize = 100;
            }
            this.setStorage('zoom', newFontSize);
            document.body.style.zoom = newFontSize + "%";
            
            browser.runtime.sendMessage({ action: "updateZoom", value: newFontSize }).catch(error => {
                if (error.message.includes("Could not establish connection")) {
                    console.log("No popup open to receive zoom update.");
                    return;
                }
                console.error("Unexpected error sending message:", error);
            });
        } else {
            newFontSize = !isNaN(parseInt(value)) ? parseInt(value) : 100;
            document.body.style.zoom = newFontSize + "%";
            
            browser.runtime.sendMessage({ action: "updateZoom", value: newFontSize }).catch(error => {
                if (error.message.includes("Could not establish connection")) {
                    console.log("No popup open to receive zoom update.");
                    return;
                }
                console.error("Unexpected error sending message:", error);
            });
        }
    },
    displayBitcoinPrice: function (value) {
        const priceContainerId = 'btc-eth-price-container';
        let priceContainer = document.getElementById(priceContainerId);

        if (value === 'off') {
            if (priceContainer) {
                priceContainer.remove();
            }
            return;
        }

        if (!priceContainer) {
            priceContainer = document.createElement('div');
            priceContainer.id = priceContainerId;
            priceContainer.style.cssText = `
                position: fixed;
                top: 0;
                right: 0;
                background: #333;
                color: white;
                padding: 10px 15px;
                z-index: 10000;
                font-size: 14px;
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            document.body.appendChild(priceContainer);
        }

        const priceText = document.createElement('span');
        priceText.className = 'price-text';
        priceText.textContent = '🔄 Loading...';
        priceContainer.insertBefore(priceText, priceContainer.querySelector('button'));
        setInterval(() => {
            this.updatePrices(priceContainer);
        }, 1000);
    },
    updatePrices: function (container) {
        const priceText = container.querySelector('span.price-text');

        browser.runtime.sendMessage({ action: "fetchPrices" }).then(response => {
            if (response.success) {
                const btcPrice = response.prices.btc;
                const ethPrice = response.prices.eth;
                if (priceText) {
                    priceText.innerHTML = `₿ $${btcPrice.toLocaleString()} | Ξ $${ethPrice.toLocaleString()}`;
                }
            } else {
                throw new Error(response.error || "Unknown error");
            }
        }).catch(err => {
            console.error('Error fetching crypto prices:', err);
            if (priceText) {
                priceText.textContent = '⚠️ Prices unavailable. May be blocked in your region.';
            }
        });
    },
    scrollToTop: function () {
        if (document.getElementById('scroll-to-top-btn')) {
            return;
        }

        const btn = document.createElement('button');
        btn.id = 'scroll-to-top-btn';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background-color: transparent;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            padding: 0;
            margin: 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            display: none;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
        `;

        const img = document.createElement('img');
        img.src = browser.runtime.getURL('icons/to-top.png');
        img.alt = 'Scroll to top';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
        `;
        btn.appendChild(img);

        document.body.appendChild(btn);

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });

        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        console.log("ScrollIndicator created.");
    },
    toggleMerit: function () {
        if (window.location.href.includes("index.php?topic=")) {
            let sesc = document.querySelectorAll("td.maintab_back a[href*='index.php?action=logout;']");
            if (sesc.length === 0) {
                return;
            }
            sesc = /;sesc=(.*)/.exec(sesc[0].getAttribute("href"))[1];
            let merit = document.querySelectorAll("td.td_headerandpost div[id^=ignmsgbttns] a[href*='index.php?action=merit;msg=']");
            if (merit.length === 0) {
                return;
            }
            let sMerit = 0, totalMerit = 0;
            this.httpGet(merit[0].getAttribute('href'), html => {
                sMerit = /You have <b>([0-9]+)<\/b> sendable/.exec(html)[1];
                totalMerit = /You have received a total of <b>([0-9]+)<\/b> merit./.exec(html)[1];
                for (let i = 0; i < merit.length; i++) {
                    let msgId = /msg=([0-9]+)/.exec(merit[i].href)[1];
                    merit[i].setAttribute('data-href', merit[i].getAttribute('href'));
                    merit[i].setAttribute('href', "javascript:void(0)");
                    merit[i].getElementsByTagName("span")[0].setAttribute("class", "openMerit");
                    merit[i].getElementsByTagName("span")[0].setAttribute("id", "open" + msgId);
                    merit[i].getElementsByTagName("span")[0].addEventListener("click", function (e) {
                        e.preventDefault();
                        let meritForm = document.getElementById('merit' + msgId);
                        if (!meritForm) return;
                        let resultDiv = meritForm.querySelector("div.result");
                        if (resultDiv) resultDiv.style.display = "none";
                        if (meritForm.style.display === "block") {
                            meritForm.style.display = "none";
                        } else {
                            meritForm.style.display = "block";
                        }
                    });
                    let nodeForm = document.createElement('tr');
                    nodeForm.innerHTML = [
                        '<td colspan="3" align="right">',
                        `<div id="merit${msgId}" style="display: none; margin-top: 5px; padding: 3px;">`,
                        '<form>',
                        '<div class="form">',
                        '<div>',
                        `Total merit: <b>${totalMerit}</b> / sMerit: <b>${sMerit}</b> `,
                        '</div>',
                        '<div style="margin-bottom: 6px;">',
                        'Merit points: <input size="6" name="merits" step="1" value="0" type="number" autocomplete="off"/>',
                        '</div>',
                        '<div style="margin-bottom: 6px;">',
                        '<input style="margin-right: 5px" class="sendButton" value="Send" type="submit">',
                        '<button type="button">Close</button>',
                        '</div>',
                        '</div>',
                        '<div class="result" style="display: none"></div>',
                        '<div class="loading" style="display: none"><span>Loading...</span></div>',
                        '</form>',
                        '</div>',
                        '</td>'
                    ].join("");
                    merit[i].parentNode.parentNode.parentNode.parentNode.appendChild(nodeForm);
                    let formEl = nodeForm.querySelector("form");
                    let meritDiv = nodeForm.querySelector(`#merit${msgId}`);
                    formEl.addEventListener("submit", function (e) {
                        e.preventDefault();
                        let formDiv = meritDiv.querySelector("div.form");
                        let resultDiv = meritDiv.querySelector("div.result");
                        let loadingDiv = meritDiv.querySelector("div.loading");
                        if (formDiv) formDiv.style.display = "none";
                        if (resultDiv) resultDiv.style.display = "none";
                        if (loadingDiv) loadingDiv.style.display = "block";
                        let xhttp = new XMLHttpRequest();
                        xhttp.onreadystatechange = function () {
                            if (this.readyState === 4 && this.status === 200) {
                                let msgResult = "Error, please check again.";
                                let responseResult = this.response.match(/<tr class="windowbg">([\s\S]*?)<\/tr>/);
                                if (responseResult !== null && responseResult[1] !== undefined) {
                                    msgResult = responseResult[1].replace(/<(.||\s|\r)*?>/g, '').trim();
                                }
                                if (formDiv) formDiv.style.display = "block";
                                if (resultDiv) {
                                    resultDiv.style.display = "block";
                                    if (this.response.includes("<title>An Error Has Occurred!</title>")) {
                                        resultDiv.innerHTML = "<span>" + msgResult + "</span>";
                                    } else if (this.response.includes("#msg" + msgId)) {
                                        resultDiv.innerHTML = "<span>Merit added.</span>";
                                        let url = new URL(window.location);
                                        let topicId = url.searchParams.get("topic");
                                        topicId = (topicId && topicId.includes(".") ? topicId.split(".")[0] : topicId);
                                        window.location.href = `${window.location.origin}/index.php?topic=${topicId}.msg${msgId}#msg${msgId}`;
                                    } else {
                                        resultDiv.innerHTML = "<span>Server response indeterminate.</span>";
                                    }
                                }
                                if (loadingDiv) loadingDiv.style.display = "none";
                            }
                        };
                        xhttp.open("POST", `${window.location.origin}/index.php?action=merit`, true);
                        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                        xhttp.send("msgID=" + msgId + "&sc=" + sesc + "&merits=" + e.target.elements["merits"].value);
                    });
                    let closeBtn = nodeForm.querySelector("button[type='button']");
                    if (closeBtn) {
                        closeBtn.addEventListener("click", function () {
                            meritDiv.style.display = "none";
                            let resultDiv = meritDiv.querySelector("div.result");
                            if (resultDiv) resultDiv.style.display = "none";
                        });
                    }
                }
            });
        }
    },
    pinsPost: function (value) {
        console.log("Pins Post feature toggled to: " + value);
    }
};

browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message && message.key !== undefined && message.value !== undefined) {
        Bitcointalk.init(message.key, message.value, 0);
    }
});

browser.storage.local.get('bitcointalk', function (storage) {
    Bitcointalk.externalLink();
    Bitcointalk.scrollToTop();
    Bitcointalk.toggleMerit && Bitcointalk.toggleMerit();

    if (storage && storage.bitcointalk && typeof storage.bitcointalk === 'object') {
        Object.keys(storage.bitcointalk).forEach(function (key) {
            Bitcointalk.init(key, storage.bitcointalk[key], 1);
        });
    }
});