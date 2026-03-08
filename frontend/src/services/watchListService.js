import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_WATCHLIST_API || 'http://localhost:8002'}/api/watchlists`;

const watchlistService = {
  // Create a new watchlist
  createWatchlist: async (user_id, name) => {
    const watchlistData = { user_id, name };
    try {
      const response = await axios.post(`${API_BASE_URL}/create`, watchlistData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Add a stock to a watchlist
  addToWatchlist: async (watchlistId, stock_symbol) => {
    const itemData = { stock_symbol };
    try {
      const response = await axios.post(`${API_BASE_URL}/add/${watchlistId}/items`, itemData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Get a watchlist by ID
  /*
  example response:
{
  "watchlist_id": 1,
  "user_id": 1,
  "name": "Bilancosu İyi Beklenenler",
  "created_at": "2025-01-27T10:23:30"
}
  */
  getWatchlistById: async (watchlistId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${watchlistId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

    /*
    example url: http://localhost:8002/api/watchlists/user/1
    example response:
    [
        {   
            "watchlist_id": 1,
            "user_id": 1,
            "name": "Bilancosu İyi Beklenenler",
            "created_at": "2025-01-27T10:23:30"
        },
        ...
    ]
    */
  getAllWatchlists: async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Get items in a watchlist
  /*
example response:
[
  {
    "item_id": 1,
    "watchlist_id": 1,
    "stock_symbol": "ORGE",
    "alert_price": null,
    "added_at": "2025-01-27T10:25:02"
  },
  {
    "item_id": 2,
    "watchlist_id": 1,
    "stock_symbol": "THYAO",
    "alert_price": null,
    "added_at": "2025-01-27T10:27:13"
  }
]
*/
  getWatchlistItems: async (watchlistId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${watchlistId}/items`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Delete a watchlist
  deleteWatchlist: async (watchlistId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete/${watchlistId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Remove a stock from a watchlist
  removeWatchlistItem: async (itemId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete-item/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Set an alert price for a watchlist item
  /*    if alert_price: 10.5
  example response:
{
    "item_id": 1,
    "watchlist_id": 1,
    "stock_symbol": "ORGE",
    "alert_price": 10.5,
    "added_at": "2025-01-27T10:25:02"
}
  */
  setAlertPrice: async (itemId, alert_price) => {
    const alertData = { alert_price };
    try {
      const response = await axios.put(`${API_BASE_URL}/${itemId}/alert/create`, alertData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  },

  // Remove alert price from a watchlist item
  /*    
  example response:
    {
        "item_id": 1,
        "watchlist_id": 1,
        "stock_symbol": "ORGE",
        "alert_price": null,
        "added_at": "2025-01-27T10:25:02"
    }
  */
  removeAlertPrice: async (itemId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${itemId}/alert/delete`);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }
};

export default watchlistService;
