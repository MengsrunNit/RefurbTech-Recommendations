import requests
import json
import pandas as pd
import os
import time

# 1. --- PASTE YOUR PRODUCTION APP ID HERE ---
APP_ID = "Mengsrun-K-PRD-ec58ce9b1-1f188ea9"
# APP_ID = "Mengsrun-K-SBX-ec563f627-043d4c4b"


# 2. --- SET THE PRODUCT YOU WANT TO RESEARCH ---
search_keywords = 'iPhone 14 Pro'

# Immediately exit if the API key is not found
if not APP_ID:
    print("❌ Error: EBAY_APP_ID environment variable not set.")
    exit()

# Construct the API request URL using an f-string for clarity
url = (
    f"http://svcs.ebay.com/services/search/FindingService/v1"
    f"?OPERATION-NAME=findCompletedItems"
    f"&SERVICE-VERSION=1.0.0"
    f"&SECURITY-APPNAME={APP_ID}"
    f"&RESPONSE-DATA-FORMAT=JSON"
    f"&REST-PAYLOAD"
    f"&keywords={search_keywords}"
    f"&itemFilter(0).name=SoldItemsOnly"
    f"&itemFilter(0).value=true"
    f"&sortOrder=EndTimeSoonest"
    f"&paginationInput.entriesPerPage=100"
)

# Send the request to the eBay API
response = requests.get(url)

# --- ADD THESE TWO LINES TO SEE THE REAL ERROR ---
print(f"Status Code: {response.status_code}")
print(f"Raw Response Text: {response.text}")
# ---------------------------------------------------

# --- Process the response ---
# This part will likely fail, but the print statements above will tell us why.
data = response.json()
results = []

# Safely process the response
response_data = data.get('findCompletedItemsResponse', [{}])[0]
ack_status = response_data.get('ack', ['Failure'])[0]

if ack_status == 'Success':
    search_results = response_data.get('searchResult', [{}])[0].get('item', [])
    
    print(f"Found {len(search_results)} sold listings for '{search_keywords}':\n")
    
    for item in search_results:
        title = item.get('title', ['N/A'])[0]
        price_info = item.get('sellingStatus', [{}])[0].get('currentPrice', [{}])[0]
        price = price_info.get('__value__', 'N/A')
        currency = price_info.get('@currencyId', '')
        end_time = item.get('listingInfo', [{}])[0].get('endTime', ['N/A'])[0]
        
        results.append({
            'title': title, 'sold_price': price,
            'currency': currency, 'date_sold': end_time
        })
        
        print(f"Title: {title}\nSold Price: {price} {currency}\nDate Sold: {end_time}\n" + "-" * 20)
    
    if results:
        df = pd.DataFrame(results)
        df['date_sold'] = pd.to_datetime(df['date_sold'])
        output_filename = f"ebay_sold_data_{search_keywords.replace(' ', '_')}.csv"
        df.to_csv(output_filename, index=False)
        print(f"\n✅ Data successfully saved to {output_filename}")

else:
    print("❌ Error: Could not retrieve data from eBay API.")
    error_message = response_data.get('errorMessage', [{}])[0].get('error', [{}])[0].get('message', ['Unknown error'])[0]
    print(f"Reason: {error_message}")