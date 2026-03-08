import axios from 'axios';

const API_BASE_URL = 'https://newsapi.org/v2';
const API_KEY = process.env.REACT_APP_NEWS_API_KEY || '';

const newsService = {
    // 1. It takes a company name and returns news about it
    getNewsAboutStock: async (companyName) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/everything`, {
                params: {
                    q: `"${companyName}"`,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 5,
                    apiKey: API_KEY,
                },
                timeout: 5000,
            });

            return response.data.articles.map((article) => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.urlToImage,
            }));
        } catch (error) {
            console.error('Error fetching news about stock:', error);
            return [];
        }
    },

    // 2. It returns general news about the Turkish economy
    getNews: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/everything`, {
                params: {
                    q: "turkish economy",
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 10,
                    apiKey: API_KEY,
                },
            });

            return response.data.articles.map((article) => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.urlToImage,
            }));
        } catch (error) {
            console.error('Error fetching general news:', error);
            return [];
        }
    },

    // 3. It takes an array of company names and returns news about all of them
    getNewsAboutPortfolio: async (companies) => {
        try {
            const newsPromises = companies.map((company) =>
                newsService.getNewsAboutStock(company)
            );

            const allNews = await Promise.all(newsPromises);
            return allNews.flat().slice(0, 10);
        } catch (error) {
            console.error('Error fetching news about portfolio:', error);
            return [];
        }
    },

    // 4. Fetch news about the sector by its name
    getNewsAboutSector: async (sector) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/everything`, {
                params: {
                    q: `"${sector}"`,
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: 10,
                    apiKey: API_KEY,
                },
            });
        
            return response.data.articles.map((article) => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                image: article.urlToImage,
            }));
        } catch (error) {
            console.error('Error fetching news about sector:', error);
            return [];
        }
    }   

};

export default newsService;