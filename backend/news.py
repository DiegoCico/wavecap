from newsapi import NewsApiClient
import sentiment
import os

DATA_DIR = "data/"
newsapi = NewsApiClient(api_key=os.getenv("NEWS_API"))

import json

def check_news(company):
    try:
        with open(DATA_DIR + f'{company.lower()}.json') as json_file:
            data = json.load(json_file)
            print("News found")
            return True
    except:
        print("No news found")
        return False
    
def get_news(company):
    if (not check_news(company)):
        articles = newsapi.get_everything(q=company,
                                        language='en',
                                        sort_by='relevancy',
                                        )              
                
        with open(DATA_DIR + f'{company.lower()}.json', 'w') as outfile:
            json.dump(articles, outfile)

        return articles
    else:
        print("No news found")
        return None

def get_sentiment(company):
    get_news(company)
    out = []
   
    with open(DATA_DIR + f'{company.lower()}.json') as json_file:
        data = json.load(json_file)

        articles = data['articles']
        for article in articles:
            try:
                out.append(article['title'] + ". " + article['description'] + ". " + article['content'])
            except:
                pass
            
    for article in out:
        out[out.index(article)] = sentiment.get_sentiment(article)

    return out

    
        
   