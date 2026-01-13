from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from decimal import Decimal
from typing import List, Optional
import yfinance as yf  # New import
from datetime import datetime  # New import
import pandas as pd
from models.models import *
from datetime import timedelta
from utils.cache import cache

class StockService:
    def __init__(self, db: Session):
        self.db = db


    # Using yahoo finance to create a stock and related sector object
    def create_stock(self, symbol : str) -> Stock:
        """
        Create a new stock object using the stock symbol and fetch additional information using Yahoo Finance.
        """
        # first check if the stock exists
        stock = self.db.query(Stock).filter(Stock.stock_symbol == symbol).first()

        if stock:
            raise ValueError(f"Stock with symbol {symbol} already exists")
        
        # add .IS to the end of the stock symbol since yahoo finance excepts that
        symbol += ".IS"
        stock = yf.Ticker(symbol)
        info = stock.info

        sector_info = info.get("industry", None)
        if sector_info is None:
            raise ValueError(f"No sector information available for stock {symbol}")
        
        # then check sector exists if not create
        sector_obj = self.db.query(Sector).filter(Sector.name == sector_info).first()
        if not sector_obj:
            sector_obj = Sector(name=sector_info)
            self.db.add(sector_obj)
            self.db.commit()
            self.db.refresh(sector_obj)
        
        # then create the stock object
        stock = Stock(
            stock_symbol= symbol[:-3], # remove .IS from the end since we keep the symbol without .IS in the db
            name=info.get("longName", None),
            sector_id= sector_obj.sector_id,
            market_cap=  Decimal(info.get("marketCap", 0))
        )
        self.db.add(stock)
        self.db.commit()
        self.db.refresh(stock)

        # after the creation of a stock, we need to extract the financials and add them to the db
        self.add_income_statement(stock.stock_symbol)
        self.add_balance_sheet(stock.stock_symbol)
        self.add_cash_flow(stock.stock_symbol)
        return stock

    # Create stock manually without using yahoo finance
    def create_stock_2(self, symbol: str, name: str, sector: str, market_cap: Decimal) -> Stock:
        # First get or create sector
        sector_obj = self.db.query(Sector).filter(Sector.name == sector).first()
        if not sector_obj:
            sector_obj = Sector(name=sector)
            self.db.add(sector_obj)
            self.db.commit()
            self.db.refresh(sector_obj)

        # Check if stock with same symbol or name exists
        stock_exists = self.db.query(Stock).filter(
            (Stock.stock_symbol == symbol) | (Stock.name == name)
        ).first()
        if stock_exists:
            if stock_exists.stock_symbol == symbol:
                raise ValueError(f"Stock with symbol {symbol} already exists")
            else:
                raise ValueError(f"Stock with name {name} already exists")

        # create the stock object 
        stock = Stock(
            stock_symbol=symbol,
            name=name,
            sector_id=sector_obj.sector_id,
            market_cap=market_cap
        )
        self.db.add(stock)
        self.db.commit()
        self.db.refresh(stock)
        return stock
    
    # function to get basic info about a stock from db
    def get_stock(self, symbol: str) -> Optional[Stock]:
        # make upper case
        symbol = symbol.upper()
        return self.db.query(Stock).filter(Stock.stock_symbol == symbol).first()

    
    # function to get detailed info about a stock using yahoo finance
    def get_stock_info(self, symbol: str) -> dict:
        #check if the stock exists in the db
        stock = self.db.query(Stock).filter(Stock.stock_symbol == symbol).first()

        stock_symbol = symbol.upper()
        # add .IS to the end of the stock symbol since yahoo finance excepts that
        stock_symbol += ".IS"

        # Check cache first
        cache_key = f"stock_info:{stock_symbol}"
        cached_info = cache.get_cache(cache_key)
        if cached_info:
            print(f"✓ Cache hit for {cache_key}")
            return cached_info

        # Cache miss - fetch from Yahoo Finance
        stock = yf.Ticker(stock_symbol)
        info = stock.info

        # Store in cache with 10-minute TTL
        cache.set_cache(cache_key, info, ttl=600)
        return info

    def get_sector_of_stock(self, symbol: str) -> Optional[Sector]:
        symbol = symbol.upper() # Ensure symbol is uppercase
        stock = self.db.query(Stock).filter(Stock.stock_symbol == symbol).first()
        if stock:
            return self.db.query(Sector).filter(Sector.sector_id == stock.sector_id).first()
        return None
    

    # it returns all stocks in the db in a basic manner, 3 field
    def get_all_stocks(self) -> List[Stock]:
        return self.db.query(Stock).all()
    
    # bu function returns all stocks in detail, using yahoo finance
    def get_all_stocks_in_detail(self):
        """
            Retrieve the stock symbols and names of all stocks in the database.
            Then using yahoo finance, fetch detailed information about each stock.
        """
        stocks = self.db.query(Stock).all()
        stock_info = []
        for stock in stocks:
            stock_symbol = stock.stock_symbol
            stock_symbol += ".IS"
            stock = yf.Ticker(stock_symbol)
            info = stock.info

            info["stock_symbol"] = stock_symbol[:-3]  # remove .IS from the end
            stock_info.append(info)
        return stock_info
         
    
    # search for stocks by symbol or name
    def search_stocks(self, query: str) -> List[Stock]:
        print(f"Searching for stocks with query: {query}")
        results = self.db.query(Stock).filter(
            (Stock.stock_symbol.ilike(f"%{query}%")) | (Stock.name.ilike(f"%{query}%"))
        ).all()
        print(f"Found {len(results)} stocks")

        # return first 5 if length is greater than 5
        if len(results) > 5:
            return results[:5]

        return results

    # services related to stock prices
    def add_stock_price(self, stock_symbol: str, start_date: str, end_date: str):
        try:    
            # first check stock is in stocks db
            stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
            if stock is None:
                raise ValueError(f"Stock with symbol {stock_symbol} does not exists")

            # date, symbol comb uniqueness satisfied thorugh db definition
            # then, start adding data
            stock_symbol = stock_symbol.upper()

            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"
            # Fetch stock data using yfinance 
            stock_data = yf.download(stock_symbol, start=start_date, end=end_date)

            # Check if data is available
            if stock_data.empty:
                print(f"No data available for {stock_symbol} from {start_date} to {end_date}")
                return
            
            prices = []
            dates = []

            # Iterate through the data and add closing prices
            for date, row in stock_data.iterrows():
                # check whether the las

                # Extract the Close price explicitly using multi-index handling
                if 'Close' in row.index:
                    close_price_series = row['Close']
                    # Ensure close_price is the specific value for the stock
                    if isinstance(close_price_series, pd.Series):
                        close_price = close_price_series.get(stock_symbol, None)
                    else:
                        close_price = close_price_series
                else:
                    close_price = None

                #print(date)
                #print(close_price)
                prices.append(close_price)
                dates.append(date)

            stock_symbol = stock_symbol[:-3]
            for price, date in zip(prices, dates):
                # there is no null data in prices

                # Convert to Decimal for compatibility with DECIMAL(10, 2)
                close_price = Decimal(f"{price:.2f}")

                # Add the stock price record to the database
                stock_price = StockPrice(
                    stock_symbol=stock_symbol,
                    date=date.date(),  # Convert timestamp to date
                    close_price=close_price,  # Store as Decimal
                )
                self.db.add(stock_price)
            
            # Commit all new records to the database
            self.db.commit()  # Moved this line to commit after adding all prices
            print(f"Closing prices for {stock_symbol} added successfully.")

        except Exception as e:
            self.db.rollback()  # Rollback in case of an error
            print(f"An error occurred while adding stock prices: {e}")

    # following to adds to db and extract from db
    def get_stock_price_on_date(self, stock_symbol: str, date: str) -> Optional[Decimal]:
        """Retrieve the stock price for a given stock symbol on a specific date."""
        stock_price = self.db.query(StockPrice).filter(
            StockPrice.stock_symbol == stock_symbol,
            StockPrice.date == date
        ).first()
        
        if stock_price:
            return stock_price.close_price
        return None
    
    def get_stock_prices(self, stock_symbol: str, start_date: str, end_date: str) -> List[StockPrice]:
        """Retrieve the stock prices for a given stock symbol and date range."""
        return self.db.query(StockPrice).filter(
            StockPrice.stock_symbol == stock_symbol,
            StockPrice.date >= start_date,
            StockPrice.date <= end_date
        ).all()
    
    # Function to get the current stock price for a given stock symbol using yahoo finance, no db interaction
    def get_current_stock_price(self, stock_symbol: str) -> StockPrice:
        """
            Using the yahoo finance api, get the current stock price for the given stock symbol
        """
        try:
            stock_symbol = stock_symbol.upper()
            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"

            # Check cache first
            cache_key = f"stock_price:{stock_symbol}"
            cached_price = cache.get_cache(cache_key)
            if cached_price is not None:
                print(f"✓ Cache hit for {cache_key}")
                return cached_price

            # Cache miss - fetch from Yahoo Finance
            stock = yf.Ticker(stock_symbol)
            info = stock.info
            current_price = info.get("currentPrice", None)

            # Store in cache with 10-minute TTL
            if current_price is not None:
                cache.set_cache(cache_key, current_price, ttl=600)

            return current_price
        except Exception as e:
            print(f"An error occurred while fetching stock price: {e}")

    # Function to get close price of a stock for a given date range using yahoo finance
    def get_stock_price_in_range(self, stock_symbol: str, start_date: str, end_date: str) -> List[StockPrice]:
        """
        Retrieve the stock prices for a given stock symbol and date range using Yahoo Finance.
        """
        try:
            stock_symbol = stock_symbol.upper()
            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"
            stock = yf.Ticker(stock_symbol)
            stock_data = stock.history(start=start_date, end=end_date)
            stock_prices = []
            for date, row in stock_data.iterrows():
                close_price = Decimal(row['Close'])
                stock_price = StockPrice(
                    stock_symbol=stock_symbol[:-3],  # remove .IS from the end
                    date=date.date(),
                    close_price=close_price
                )
                stock_prices.append(stock_price)
            return stock_prices
        except Exception as e:
            print(f"An error occurred while fetching stock prices: {e}")

    def get_prices_of_stock_in_predefined_dates(self, stock_symbol: str) -> List[StockPrice]:
        stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
        if stock is None:
            raise ValueError(f"Stock with symbol {stock_symbol} does not exist")

        stock_symbol += ".IS"
        stock = yf.Ticker(stock_symbol)
        stock_data = stock.history(period="5y")

        # Ensure stock_data index is timezone-naive
        stock_data.index = stock_data.index.tz_localize(None)

        stock_prices = []
        date_intervals = {
            "current": date.today(),
            "one_week" : date.today() - timedelta(days=7),
            "one_month" : date.today() - timedelta(days=30),
            "three_months" : date.today() - timedelta(days=90),
            "six_months" : date.today() - timedelta(days=180),
            "one_year" : date.today() - timedelta(days=365),
            "three_years" : date.today() - timedelta(days=3*365),
            "five_years" : date.today() - timedelta(days=5*365)
        }

        for target_date in date_intervals.values():
            # Convert target_date to timezone-naive Timestamp
            target_timestamp = pd.Timestamp(target_date).tz_localize(None)
            
            # find the closest date in the stock data
            closest_date = min(stock_data.index, key=lambda x: abs(x - target_timestamp))
            closest_price = stock_data.loc[closest_date]['Close']
            stock_price = StockPrice(
                stock_symbol=stock_symbol[:-3],  # remove .IS from the end
                date=closest_date.date(),
                close_price=closest_price
            )
            stock_prices.append(stock_price)

        return stock_prices


        
    # services related to income, balance sheet, cash flow and dividend data 
    def add_income_statement(self, stock_symbol: str):
        """
        Fetch and add quarterly income statement data for the given stock symbol.
        """
        try:
            # check if the stock exists
            stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
            if stock is None:
                raise ValueError(f"Stock with symbol {stock_symbol} does not exists")
            
            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"

            stock = yf.Ticker(stock_symbol)
            income_statement = stock.quarterly_financials

            if income_statement.empty:
                print(f"No income statement data available for {stock_symbol}.")
                return

            for quarter, data in income_statement.items():
                # Strip timestamp from the quarter if it exists
                quarter_date = datetime.fromisoformat(str(quarter).split()[0]).date()

                # check if revenue is null, if it is, do not add the record
                if data.get("Total Revenue", 0) is None:
                    continue

                financial = Financial(
                    stock_symbol=stock_symbol[:-3], # remove .IS from the end
                    quarter=quarter_date,
                    revenue=Decimal(data.get("Total Revenue", 0)) if not pd.isna(data.get("Total Revenue", 0)) else None,
                    gross_profit=Decimal(data.get("Gross Profit", 0)) if not pd.isna(data.get("Gross Profit", 0)) else None,
                    operating_income=Decimal(data.get("Operating Income", 0)) if not pd.isna(data.get("Operating Income", 0)) else None,
                    net_profit=Decimal(data.get("Net Income", 0)) if not pd.isna(data.get("Net Income", 0)) else None,
                    eps=data.get("Earnings Per Share", None),
                    operating_margin=(
                        Decimal(data.get("Operating Income", 0)) / Decimal(data.get("Total Revenue", 1)) * 100
                        if not pd.isna(data.get("Operating Income", 0)) and not pd.isna(data.get("Total Revenue", 1))
                        else None
                    ),
                )
                self.db.add(financial)

            self.db.commit()
            print(f"Income statement data for {stock_symbol[:-3]} added successfully.")
        except Exception as e:
            self.db.rollback()
            print(f"An error occurred while adding income statement data: {e}")

    def add_balance_sheet(self, stock_symbol: str):
        """
        Fetch and add quarterly balance sheet data for the given stock symbol.
        """
        try:    
            # check if the stock exists
            stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
            if stock is None:
                raise ValueError(f"Stock with symbol {stock_symbol} does not exists")
            
            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"

            stock = yf.Ticker(stock_symbol)
            balance_sheet = stock.quarterly_balancesheet

            if balance_sheet.empty:
                print(f"No balance sheet data available for {stock_symbol}.")
                return

            for quarter, data in balance_sheet.items():
                # Strip timestamp from the quarter if it exists
                quarter_date = datetime.fromisoformat(str(quarter).split()[0]).date()

                # check if total assets is null, if it is, do not add the record
                if data.get("Total Assets", 0) is None:
                    continue

                balance = BalanceSheet(
                    stock_symbol=stock_symbol[:-3],  # remove .IS from the end
                    quarter=quarter_date,
                    total_assets=Decimal(data.get("Total Assets", 0)) if not pd.isna(data.get("Total Assets", 0)) else None,
                    total_liabilities=Decimal(data.get("Total Liabilities Net Minority Interest", 0)) if not pd.isna(data.get("Total Liabilities Net Minority Interest", 0)) else None,
                    total_equity=Decimal(data.get("Ordinary Shares Number", 0)) if not pd.isna(data.get("Ordinary Shares Number", 0)) else None,
                    current_assets=Decimal(data.get("Current Assets", 0)) if not pd.isna(data.get("Current Assets", 0)) else None,
                    current_liabilities=Decimal(data.get("Current Liabilities", 0)) if not pd.isna(data.get("Current Liabilities", 0)) else None,
                )
                self.db.add(balance)

            self.db.commit()
            print(f"Balance sheet data for {stock_symbol[:-3]} added successfully.")
        except Exception as e:
            self.db.rollback()
            print(f"An error occurred while adding balance sheet data: {e}")

    def add_cash_flow(self, stock_symbol: str):
        """
        Fetch and add quarterly cash flow data for the given stock symbol.
        """
        try:
            # check if the stock exists
            stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
            if stock is None:
                raise ValueError(f"Stock with symbol {stock_symbol} does not exists")

            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"

            stock = yf.Ticker(stock_symbol)
            cash_flow = stock.quarterly_cashflow

            if cash_flow.empty:
                print(f"No cash flow data available for {stock_symbol}.")
                return

            for quarter, data in cash_flow.items():
                quarter_date = datetime.fromisoformat(str(quarter).split()[0]).date()

                # check if operating cash flow is null, if it is, do not add the record
                if data.get("free_cash_flow", 0) is None:
                    continue 

                flow = CashFlow(
                    stock_symbol=stock_symbol[:-3],  # remove .IS from the end
                    quarter=quarter_date,
                    operating_cash_flow=Decimal(data.get("Net Cash Provided by Operating Activities", 0)) if not pd.isna(data.get("Net Cash Provided by Operating Activities", 0)) else None,
                    investing_cash_flow=Decimal(data.get("Net Cash Used for Investing Activities", 0)) if not pd.isna(data.get("Net Cash Used for Investing Activities", 0)) else None,
                    financing_cash_flow=Decimal(data.get("Net Cash Used Provided by Financing Activities", 0)) if not pd.isna(data.get("Net Cash Used Provided by Financing Activities", 0)) else None,
                    free_cash_flow=Decimal(data.get("Free Cash Flow", 0)) if not pd.isna(data.get("Free Cash Flow", 0)) else None,
                    capital_expenditures=Decimal(data.get("Capital Expenditure", 0)) if not pd.isna(data.get("Capital Expenditure", 0)) else None,
                )
                self.db.add(flow)

            self.db.commit()
            print(f"Cash flow data for {stock_symbol[:-3]} added successfully.")
        except Exception as e:
            self.db.rollback()
            print(f"An error occurred while adding cash flow data: {e}")

    def add_dividend(self, stock_symbol: str):
        """
        Fetch and add dividend data for the given stock symbol.
        """
        try:
            # check if the stock exists
            stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()
            if stock is None:
                raise ValueError(f"Stock with symbol {stock_symbol} does not exists")

            # add .IS to the end of the stock symbol since yahoo finance excepts that
            stock_symbol += ".IS"

            stock = yf.Ticker(stock_symbol)
            dividends = stock.dividends

            if dividends.empty:
                print(f"No dividend data available for {stock_symbol}.")
                return

            for date, amount in dividends.items():
                dividend = Dividend(
                    stock_symbol=stock_symbol[:-3],  # remove .IS from the end
                    payment_date=date.date(),
                    amount=Decimal(amount),
                )
                self.db.add(dividend)

            self.db.commit()
            print(f"Dividend data for {stock_symbol[:-3]} added successfully.")
        except Exception as e:
            self.db.rollback()
            print(f"An error occurred while adding dividend data: {e}")

    # services related to returning them

    # Function to return all financial data for a given stock symbol
    def get_financial_data(self, stock_symbol: str) -> List[Financial]:
        # check if the stock exists
        stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()

        return self.db.query(Financial).filter(Financial.stock_symbol == stock_symbol).all()

    # Function to return all balance sheet data for a given stock symbol
    def get_balance_sheet_data(self, stock_symbol: str) -> List[BalanceSheet]:
        # check if the stock exists
        stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()

        return self.db.query(BalanceSheet).filter(BalanceSheet.stock_symbol == stock_symbol).all()
    
    # Function to return all cash flow data for a given stock symbol
    def get_cash_flow_data(self, stock_symbol: str) -> List[CashFlow]:
        # check if the stock exists
        stock = self.db.query(Stock).filter(Stock.stock_symbol == stock_symbol).first()

        return self.db.query(CashFlow).filter(CashFlow.stock_symbol == stock_symbol).all()


    # SERVICES RELATED TO PORTFOLIO MANAGEMENT      
    def create_portfolio(self, user_id: int, name: str) -> Portfolio:
        portfolio = Portfolio(
            user_id=user_id,
            name=name
        )
        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return portfolio

    def add_holding(self, portfolio_id: int, symbol: str, quantity: int, price: Decimal) -> PortfolioHolding:
        # no need to check if the stock exists since user can buy existing stocks in the frontend

        # check if the stock exists in the portfolio
        holding = self.db.query(PortfolioHolding).filter(
            PortfolioHolding.portfolio_id == portfolio_id,
            PortfolioHolding.stock_symbol == symbol
        ).first()

        if holding:
            # we need to update the holding if it exists like quantity and the average bought price
            new_weighted_avg_price = (holding.quantity * holding.average_price + quantity * price) / (holding.quantity + quantity)
            new_quantity = holding.quantity + quantity

            holding.quantity = new_quantity
            holding.average_price = new_weighted_avg_price

            self.db.commit()
            self.db.refresh(holding)
            return holding

        # else: create a new holding record in the db
        holding = PortfolioHolding(
            portfolio_id=portfolio_id,
            stock_symbol=symbol,
            quantity=quantity,
            average_price=price
        )
        self.db.add(holding)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    # to return a portfolio by portfolio id but in this holdings are not included
    def get_portfolio(self, portfolio_id: int) -> Optional[Portfolio]:
        return self.db.query(Portfolio).filter(Portfolio.portfolio_id == portfolio_id).first()

    # to return all portfolios of a specific user
    def get_user_portfolios(self, user_id: int) -> List[Portfolio]:
        return self.db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
    
    # to return all holding of a portfolio
    def get_portfolio_holdings(self, portfolio_id: int) -> List[PortfolioHolding]:
        # check if the portfolio exists
        portfolio = self.db.query(Portfolio).filter(Portfolio.portfolio_id == portfolio_id).first()
        if portfolio is None:
            raise ValueError(f"Portfolio with id {portfolio_id} does not exists")

        # otherwise return all holdings of the portfolio
        return self.db.query(PortfolioHolding).filter(PortfolioHolding.portfolio_id == portfolio_id).all()

    # it allows us to decrease the quantity of a holding in a portfolio but not delete
    def decrease_holding(self, holding_id: int, quantity: int) -> Optional[PortfolioHolding]:
        holding = self.db.query(PortfolioHolding).filter(PortfolioHolding.holding_id == holding_id).first()
        if holding:
            holding.quantity -= quantity
            self.db.commit()
            self.db.refresh(holding)
        return holding

    # to delete a holding in a portfolio by holding id -> user will need this when they sell a stock
    def delete_holding(self, holding_id: int) -> bool:
        holding = self.db.query(PortfolioHolding).filter(PortfolioHolding.holding_id == holding_id).first()
        if holding:
            self.db.delete(holding)
            self.db.commit()
            return True
        return False
    

    # services related to sectors
    def get_sector_info(self, sector_id: int): 
        sector = self.db.query(Sector).filter(Sector.sector_id == sector_id).first()
        if not sector:
            raise ValueError(f"No sector with id {sector_id} exists")
        
        # we will collect some info about the sector
        number_of_companies_from_that_sector = self.db.query(Stock).filter(Stock.sector_id == sector_id).count()
        
        total_market_cap = self.db.query(Stock).filter(Stock.sector_id == sector_id).with_entities(Stock.market_cap).all()
        total_market_cap = sum([float(x[0]) for x in total_market_cap])

        # first three companies with the highest market cap
        top_3_companies = self.db.query(Stock).filter(Stock.sector_id == sector_id).order_by(Stock.market_cap.desc()).limit(3).all()

        return {
            "sector": sector,
            "number_of_companies": number_of_companies_from_that_sector,
            "total_market_cap": total_market_cap,
            "top_3_companies": top_3_companies
        }        

    # function to get all stocks in a sector
    def get_stocks_in_sector(self, sector: str) -> List[Stock]:
        sector_obj = self.db.query(Sector).filter(Sector.name == sector).first()
        if sector_obj == None:
            raise ValueError(f"No sector with name {sector} exists")
        if sector_obj:
            return self.db.query(Stock).filter(Stock.sector_id == sector_obj.sector_id).all()
        return []
    
    # function to get all sectors
    def get_all_sectors(self) -> List[Sector]:
        result = self.db.query(Sector).all()
        print(result)
        return result
        
    
    
