# Install dependencies
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import re

url = "https://www.gsmarena.com/oneplus-phones-95.php"
session = requests.Session()
headers = {"User-Agent": "Mozilla/5.0"}
seen_pages = set()
page_num = 1

# List to store all phone data
phones_data = []

# Patterns to exclude (tablets, watches, other devices)
EXCLUDE_PATTERNS = [
    r'\bpad\b',              # OnePlus Pad (tablet)
    r'\btablet\b',
    r'\bwatch\b',            # OnePlus Watch
    r'\bbuds\b',             # OnePlus Buds (earbuds)
    r'\bmonitor\b',
    r'\btv\b'
]

def is_oneplus_phone(title):
    """Check if the device is a OnePlus phone (not tablet, watch, etc.)"""
    title_lower = title.lower()
    
    # Check if it should be excluded
    for exclude_pattern in EXCLUDE_PATTERNS:
        if re.search(exclude_pattern, title_lower):
            return False
    
    # Since we're already on the OnePlus page, all non-excluded devices are phones
    return True

# --- Main scraping loop ---
while True:
    print(f"📄 Scraping page {page_num}...")
    
    # Request and parse the page
    r = session.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    
    page_devices = 0
    page_phones = 0
    
    # 1️⃣ Extract all phone entries
    for a in soup.select("div.makers li > a"):
        title = a.get_text(strip=True)
        href = a.get("href")
        img = (a.find("img") or {}).get("src")
        
        page_devices += 1
        
        # Check if it's a OnePlus phone
        if is_oneplus_phone(title):
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
            page_phones += 1
            
            print(f"  ✅ {title}")
        else:
            print(f"  ⏭️  Skipped: {title}")
    
    print(f"  📊 Page {page_num}: {page_phones}/{page_devices} devices included\n")
    
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
output_file = "oneplus_phones.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(phones_data, f, indent=2, ensure_ascii=False)

print(f"\n" + "="*60)
print("✅ Scraping complete!")
print("="*60)
print(f"📱 Total OnePlus phones scraped: {len(phones_data)}")
print(f"📄 Pages scraped: {page_num}")
print(f"💾 Data saved to: {output_file}")

# Optional: Save a summary as well
summary = {
    "total_phones": len(phones_data),
    "pages_scraped": page_num,
    "phones": phones_data
}

summary_file = "oneplus_phones_summary.json"
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"📊 Summary saved to: {summary_file}")

# Print all phone names
if phones_data:
    print("\n📱 OnePlus Phones Found:")
    for i, phone in enumerate(phones_data, 1):
        print(f"  {i}. {phone['title']}")
else:
    print("\n⚠️  No phones found - there might be an issue with the scraping.")

print("="*60)