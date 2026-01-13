import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001/api/stocks';


const stockService = {
  getStock: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  createStock: async (stock) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/`, stock);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Updated service to fetch stock general info using the /info endpoint
  /*
    Example request: http://localhost:8001/api/stocks/aghol/info
    Example response:
    {
     "maxAge": 86400,
  "priceHint": 2,
  "previousClose": 313.25,
  "open": 313.5,
  "dayLow": 311.5,
  "dayHigh": 317,
  "regularMarketPreviousClose": 313.25,
  "regularMarketOpen": 313.5,
  "regularMarketDayLow": 311.5,
  "regularMarketDayHigh": 317,
  "dividendRate": 2.87,
  "dividendYield": 0.0091,
  "exDividendDate": 1716940800,
  "payoutRatio": 0.116000004,
  "fiveYearAvgDividendYield": 0.94,
  "beta": 0.206,
  "trailingPE": 12.722133,
  "forwardPE": 2.0841603,
  "volume": 606892,
  "regularMarketVolume": 606892,
  "averageVolume": 827643,
  "averageVolume10days": 776644,
  "averageDailyVolume10Day": 776644,
  "bid": 314.5,
  "ask": 314,
  "marketCap": 76713525248,
  "fiftyTwoWeekLow": 227.5,
  "fiftyTwoWeekHigh": 477.5,
  "priceToSalesTrailing12Months": 0.19654344,
  "fiftyDayAverage": 334.585,
  "twoHundredDayAverage": 342.1325,
  "currency": "TRY",
  "enterpriseValue": 258303164416,
  "profitMargins": 0.01544,
  "floatShares": 76352957,
  "sharesOutstanding": 243535008,
  "heldPercentInsiders": 0.53755003,
  "heldPercentInstitutions": 0.13204001,
  "impliedSharesOutstanding": 247848000,
  "bookValue": 367.557,
  "priceToBook": 0.8570099,
  "lastFiscalYearEnd": 1703980800,
  "nextFiscalYearEnd": 1735603200,
  "mostRecentQuarter": 1727654400,
  "earningsQuarterlyGrowth": -0.239,
  "netIncomeToCommon": 6016836096,
  "trailingEps": 24.76,
  "forwardEps": 151.14,
  "lastSplitFactor": "130:100",
  "lastSplitDate": 1171238400,
  "enterpriseToRevenue": 0.662,
  "enterpriseToEbitda": 10.56,
  "52WeekChange": 0.3478819,
  "SandP52WeekChange": 0.23809385,
  "lastDividendValue": 2.874336,
  "lastDividendDate": 1716940800,
  "exchange": "IST",
  "quoteType": "EQUITY",
  "symbol": "AGHOL.IS",
  "underlyingSymbol": "AGHOL.IS",
  "shortName": "ANADOLU GRUBU HOLDING",
  "longName": "AG Anadolu Grubu Holding A.S.",
  "firstTradeDateEpochUtc": 957940200,
  "timeZoneFullName": "Europe/Istanbul",
  "timeZoneShortName": "TRT",
  "uuid": "7c88d8eb-7086-33ec-b5e8-417838d9c214",
  "messageBoardId": "finmb_6523430",
  "gmtOffSetMilliseconds": 10800000,
  "currentPrice": 315,
  "targetHighPrice": 554,
  "targetLowPrice": 486.83,
  "targetMeanPrice": 520.415,
  "targetMedianPrice": 520.415,
  "recommendationMean": 1,
  "recommendationKey": "strong_buy",
  "numberOfAnalystOpinions": 2,
  "totalCash": 82623127552,
  "totalCashPerShare": 339.267,
  "ebitda": 24459929600,
  "totalDebt": 108534816768,
  "quickRatio": 0.656,
  "currentRatio": 1.069,
  "totalRevenue": 390313345024,
  "debtToEquity": 44.265,
  "revenuePerShare": 1605.42,
  "returnOnAssets": 0.0207,
  "returnOnEquity": 0.13712,
  "grossProfits": 109019947008,
  "freeCashflow": 636330112,
  "operatingCashflow": 35237277696,
  "earningsGrowth": -0.239,
  "revenueGrowth": 0.438,
  "grossMargins": 0.27931,
  "ebitdaMargins": 0.06267,
  "operatingMargins": 0.06564,
  "financialCurrency": "TRY",
  "trailingPegRatio": null
}
  */
  getStockInfo: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${symbol}/info`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // to fetch the current stock price
  /*
    It returns a dictionary like this:
      {
        "stock_symbol": "AGHOL",
        "date": "2025-01-20",
        "close_price": "314.5"
      }
  */
  getStockPrice: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${symbol}/price`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // example url: http://localhost:8001/api/stocks/sector/aghol
  // example response: { "name": "Conglomerates", "sector_id": 1}
  getSectorOfStock: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sector/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },
  
  // to fetch the stock price in a date range 
  // requested url: http://localhost:8001/api/stocks/prices-range
  // requested body: { "stock_symbol": "AGHOL", "start_date": "2025-01-01", "end_date": "2025-01-20" }
  getStockPriceInDateRange: async (request) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/prices-range`, request);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // http://localhost:8001/api/stocks/aghol/prices/
  // example response:
  /*
    [
  {
    "stock_symbol": "aghol",
    "date": "2025-01-24",
    "close_price": "315.0"
  },
  {
    "stock_symbol": "aghol",
    "date": "2025-01-17",
    "close_price": "309.0"
  },
  {
    "stock_symbol": "aghol",
    "date": "2024-12-26",
    "close_price": "363.0"
  },
  {
    "stock_symbol": "aghol",
    "date": "2024-10-28",
    "close_price": "287.5"
  },
  {
    "stock_symbol": "aghol",
    "date": "2024-07-29",
    "close_price": "427.25"
  },
  {
    "stock_symbol": "aghol",
    "date": "2024-01-26",
    "close_price": "227.0554656982422"
  },
  {
    "stock_symbol": "aghol",
    "date": "2022-01-26",
    "close_price": "33.286109924316406"
  },
  {
    "stock_symbol": "aghol",
    "date": "2020-01-27",
    "close_price": "19.25945472717285"
  }
]
  */
  getStockPriceInPredefinedDateRange: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${symbol}/prices`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getFinancialData: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/financials/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getBalanceSheetData: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/balance-sheet/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  getCashFlowData: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cash-flow/${symbol}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  /*
    example request url: http://localhost:8001/api/stocks/search/ag
    example output:
    [
      {
        "stock_symbol": "AGHOL",
        "name": "Anadolu Grubu Holding",
        "sector_id": 1,
        "market_cap": 73000000000,
        "last_updated": "2025-01-15T10:52:07"
      },
      {
        "stock_symbol": "MPARK",
        "name": "MLP Saglik Hizmetleri A.S.",
        "sector_id": 4,
        "market_cap": 75449737216,
        "last_updated": "2025-01-19T15:42:55"
      }
    ]

  */
  searchStocks: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/search/${query}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // requested url: http://localhost:8001/api/stocks/stocks-all/{symbol}
  getAllStocksDetailed: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks-all/x`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Get paginated stocks with current prices (combined endpoint)
  // response: { data: [...], total: N, page: N, pages: N, limit: N }
  getStocksWithPrices: async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/with-prices`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // http://localhost:8001/api/stocks/sectors-all/{symbol}
  /*
    example response:
      [
        {
          "sector_id": 2,
          "name": "Airlines"
        },
        {
          "sector_id": 7,
          "name": "Banks - Regional"
        },
        {
          "sector_id": 3,
          "
          name": "Asset Management"
        },
      ]

  */
  getAllSectors: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sectors-all/x`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  /*
  // to fetch detailed sector information

    here is an example request: http://localhost:8001/api/stocks/sector-info/1
    here is an example response:
    {
      "sector": {
        "name": "Conglomerates",
        "sector_id": 1
      },
      "number_of_companies": 3,
      "total_market_cap": 732000000000,
      "top_3_companies": [
        {
          "stock_symbol": "KCHOL",
          "market_cap": 450000000000,
          "name": "Koc Holding",
          "sector_id": 1,
          "last_updated": "2025-01-19T13:44:09"
        },
        {
          "stock_symbol": "SAHOL",
          "market_cap": 209000000000,
          "name": "Sabanci Holding",
          "sector_id": 1,
          "last_updated": "2025-01-19T15:30:37"
        },
        {
          "stock_symbol": "AGHOL",
          "market_cap": 73000000000,
          "name": "Anadolu Grubu Holding",
          "sector_id": 1,
          "last_updated": "2025-01-15T10:52:07"
        }
      ]
    }
  */
  getSectorInfo: async (sectorId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sector-info/${sectorId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

};

export default stockService;
