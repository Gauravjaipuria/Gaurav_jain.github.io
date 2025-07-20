const API_KEY = 'FpcNALgY9NKwHhaBAIEFKBNdnYZ3P1OsV0nbH5yY'; // Your MarketAux API key
const stockList = document.getElementById('stockList');
const stockInput = document.getElementById('stockInput');
const addStockBtn = document.getElementById('addStockBtn');
const historicalChart = document.getElementById('historicalChart').getContext('2d');
const financialTableBody = document.querySelector('#financialTable tbody');
const shareholdingInfo = document.getElementById('shareholdingInfo');
const newsFeed = document.getElementById('newsFeed');
const optimalWeightsDiv = document.getElementById('optimalWeights');

let stocks = [];

// Function to fetch stock data
async function fetchStockData(stockSymbol) {
    try {
        // Fetch historical data
        const historicalResponse = await fetch(`https://api.marketaux.com/v1/stocks/historical?symbol=${stockSymbol}&api_token=${API_KEY}`);
        const historicalData = await historicalResponse.json();

        // Fetch financial ratios
        const financialResponse = await fetch(`https://api.marketaux.com/v1/stocks/financials?symbol=${stockSymbol}&api_token=${API_KEY}`);
        const financialData = await financialResponse.json();

        // Fetch shareholding information
        const shareholdingResponse = await fetch(`https://api.marketaux.com/v1/stocks/shareholding?symbol=${stockSymbol}&api_token=${API_KEY}`);
        const shareholdingData = await shareholdingResponse.json();

        // Fetch stock-related news
        const newsResponse = await fetch(`https://api.marketaux.com/v1/news/all?symbols=${stockSymbol}&api_token=${API_KEY}`);
        const newsData = await newsResponse.json();

        // Update UI
        updateUI(stockSymbol, historicalData, financialData, shareholdingData, newsData);
    } catch (error) {
        console.error('Error fetching stock data:', error);
    }
}

// Function to update the UI
function updateUI(stockSymbol, historicalData, financialData, shareholdingData, newsData) {
    // Update stock list
    const stockItem = document.createElement('li');
    stockItem.textContent = stockSymbol;
    stockList.appendChild(stockItem);

    // Update historical chart
    const labels = historicalData.data.map(item => item.date);
    const prices = historicalData.data.map(item => item.close);
    
    const chart = new Chart(historicalChart, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: stockSymbol,
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Update financial ratios
    financialTableBody.innerHTML = ''; // Clear previous data
    financialData.data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item.year}</td><td>${item.pe_ratio}</td><td>${item.debt_equity}</td>`;
        financialTableBody.appendChild(row);
    });

    // Update shareholding information
    shareholdingInfo.innerHTML = shareholdingData.data.map(info => `<p>${info.shareholder}: ${info.percentage}%</p>`).join('');

    // Update news feed
    newsFeed.innerHTML = newsData.data.map(news => `<p>${news.title} - <a href="${news.url}" target="_blank">Read more</a></p>`).join('');
}

// Function to optimize portfolio weights
async function optimizePortfolio() {
    const stockData = await Promise.all(stocks.map(stock => fetchStockData(stock)));
    const stockReturns = stockData.map(data => data.returns); // Extract returns from fetched data
    const stockCovariance = stockData.map(data => data.covariance); // Extract covariance from fetched data

    const response = await fetch('/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tickers: stocks,
            stock_data: stockReturns // Send the returns data
        })
    });

    const result = await response.json();
    displayOptimalWeights(result.optimal_weights);
}

// Function to display optimal weights
function displayOptimalWeights(weights) {
    optimalWeightsDiv.innerHTML = weights.map((weight, index) => `Stock ${stocks[index]}: ${weight.toFixed(4)}`).join('<br>');
}

// Event listener for adding stocks
addStockBtn.addEventListener('click', () => {
    const stockSymbol = stockInput.value.trim().toUpperCase();
    if (stockSymbol && !stocks.includes(stockSymbol)) {
        stocks.push(stockSymbol);
        fetchStockData(stockSymbol);
        optimizePortfolio(); // Optimize after adding a stock
        stockInput.value = ''; // Clear input
    } else {
        alert('Please enter a valid stock symbol or avoid duplicates.');
    }
});