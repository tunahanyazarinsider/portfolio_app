import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Fade,
  useTheme
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';

const NewsSection = ({ news, loading = false }) => {
  const [showMore, setShowMore] = useState(false);
  const theme = useTheme();

  if (!news || news.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <Typography variant="body1" color="text.secondary">
          No news available at the moment.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <Typography variant="body1" color="text.secondary">
          Loading news...
        </Typography>
      </Box>
    );
  }

  const visibleNews = showMore ? news : news.slice(0, 3);

  return (
    <Box sx={{ py: 2 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 24,
            borderRadius: 2,
            bgcolor: 'warning.main',
          }}
        />
        Latest News
      </Typography>

      <Grid container spacing={2}>
        {visibleNews.map((article, index) => (
          <Grid item xs={12} key={index}>
            <Fade in={true} timeout={300 + index * 100}>
              <Card
                elevation={0}
                sx={{
                  display: 'flex',
                  height: { xs: 'auto', sm: 180 },
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                {article.image && (
                  <CardMedia
                    component="img"
                    sx={{
                      width: { xs: 100, sm: 200 },
                      flexShrink: 0,
                      objectFit: 'cover',
                      borderRadius: '12px 0 0 12px',
                    }}
                    image={article.image}
                    alt={article.title}
                  />
                )}
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    py: 2,
                    px: 2.5,
                    '&:last-child': { pb: 2 },
                  }}
                >
                  <Box
                    component="a"
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      color: 'inherit',
                      textDecoration: 'none',
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        flexGrow: 1,
                        lineHeight: 1.3,
                        transition: 'color 0.2s',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {article.title}
                    </Typography>
                    <OpenInNew
                      sx={{ ml: 1, fontSize: 16, color: 'text.secondary', flexShrink: 0, mt: 0.5 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                    {article.source} &middot; {new Date(article.publishedAt).toLocaleDateString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {article.description}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {news.length > 3 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Button
            onClick={() => setShowMore(!showMore)}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '8px', px: 3 }}
          >
            {showMore ? 'Show Less' : `Show More (${news.length - 3})`}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default NewsSection;
