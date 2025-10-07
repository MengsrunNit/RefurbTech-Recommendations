# Install dependencies
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json

url = "https://www.gsmarena.com/results.php3"
params = {
    "sMakers": "48",  # Apple
    "sAvailabilities": "1,3",  # Available and Discontinued
    "idOS": "3"  # iOS
}

request = requests.Request('GET', url, params=params)
prepared_request = request.prepare()
print(prepared_request.url)

session = requests.Session()
headers = {"User-Agent": "Mozilla/5.0"}
seen_pages = set()
page_num = 1
count = 0

# List to store all phone data
phones_data = []

# --- Main scraping loop ---
while True:
    count += 1
    print(count)
    print(f"Scraping page {page_num}...")
    
    # Request and parse the page
    r = session.get(prepared_request.url, headers=headers, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    
    # 1️⃣ Extract all phone entries
    for a in soup.select("div.makers li > a"):
        title = a.get_text(strip=True)
        href = a.get("href")
        img = (a.find("img") or {}).get("src")
        
        # Create a dictionary for each phone
        phone_entry = {
            "title": title,
            "link": href,
            "full_url": urljoin(url, href) if href else None,
            "image": img,
            "page_number": page_num
        }
        
        # Add to the list
        phones_data.append(phone_entry)
        
        print(f"Title: {title}")
        print(f"Link: {href}")
        print(f"Image: {img}")
        print("-" * 50)
    
    count += 1
    print(count)
    
    # 2️⃣ Find pagination
    nav_pages = soup.find("div", class_="nav-pages")
    if not nav_pages:
        print("Pagination not found. Exiting loop.")
        break
    
    a_tags = nav_pages.find_all("a")
    last_a = a_tags[-1] if a_tags else None
    
    # 3️⃣ Check if the last button is disabled
    if not last_a or "prevnextbuttondis" in last_a.get("class", []):
        print("No more pages to scrape. Exiting loop.")
        break
    
    # 4️⃣ Build next page URL
    next_href = last_a.get("href")
    if not next_href:
        print("Next link has no href. Exiting loop.")
        break
    
    next_url = urljoin(url, next_href)
    if next_url in seen_pages:
        print("Next URL repeats a previous page. Exiting loop.")
        break
    
    seen_pages.add(next_url)
    url = next_url
    page_num += 1

# Save to JSON file
output_file = "gsmarena_phones.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(phones_data, f, indent=2, ensure_ascii=False)

print(f"\n✅ Scraping complete!")
print(f"Total phones scraped: {len(phones_data)}")
print(f"Data saved to: {output_file}")

# Optional: Save a summary as well
summary = {
    "total_phones": len(phones_data),
    "pages_scraped": page_num,
    "phones": phones_data
}

summary_file = "gsmarena_phones_with_summary.json"
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"Summary saved to: {summary_file}")