from flask import Flask, request, jsonify
import numpy as np
from scipy.optimize import minimize

app = Flask(__name__)

def calculate_returns(data):
    return data.pct_change().mean() * 252  # Annualized returns

def calculate_covariance(data):
    return data.pct_change().cov() * 252  # Annualized covariance

def portfolio_performance(weights, returns, covariance):
    portfolio_return = np.dot(weights, returns)
    portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(covariance, weights)))
    return portfolio_return, portfolio_volatility

def negative_sharpe_ratio(weights, returns, covariance, risk_free_rate=0.01):
    p_return, p_volatility = portfolio_performance(weights, returns, covariance)
    return -(p_return - risk_free_rate) / p_volatility

@app.route('/optimize', methods=['POST'])
def optimize_portfolio():
    data = request.json
    tickers = data['tickers']
    stock_data = np.array(data['stock_data'])  # Assuming stock_data is a 2D list

    returns = calculate_returns(stock_data)
    covariance = calculate_covariance(stock_data)

    num_assets = len(tickers)
    args = (returns, covariance)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for asset in range(num_assets))
    initial_weights = num_assets * [1. / num_assets,]

    optimal = minimize(negative_sharpe_ratio, initial_weights, args=args,
                       method='SLSQP', bounds=bounds, constraints=constraints)

    return jsonify(optimal_weights=optimal.x.tolist())

if __name__ == '__main__':
    app.run(debug=True)

