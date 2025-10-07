# Install dependencies
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import re

url = "https://www.gsmarena.com/google-phones-107.php"
session = requests.Session()
headers = {"User-Agent": "Mozilla/5.0"}
seen_pages = set()
page_num = 1

# List to store all phone data
phones_data = []

# Patterns to identify phones (not tablets, watches, etc.)
PHONE_PATTERNS = [
    r'\bpixel\s+\d+',           # Pixel 6, Pixel 7, Pixel 8, etc.
    r'\bpixel\s+\d+\s*pro',     # Pixel 6 Pro, Pixel 7 Pro, etc.
    r'\bpixel\s+\d+[a-z]',      # Pixel 6a, Pixel 7a, Pixel 8a, etc.
    r'\bpixel\s+\d+\s*xl',      # Pixel 2 XL, Pixel 3 XL, etc.
    r'\bpixel\s+xl$',           # Original Pixel XL
    r'^pixel$'                  # Original Pixel
]

# Patterns to exclude (tablets, watches, other devices)
EXCLUDE_PATTERNS = [
    r'\btablet',
    r'\bwatch',
    r'\bc$',                    # Pixel C (tablet)
    r'\bslate',
    r'\bbuds',
    r'\bearbuds'
]

def is_pixel_phone(title):
    """Check if the device is a Pixel phone (not tablet, watch, etc.)"""
    title_lower = title.lower()
    
    # First check if it should be excluded
    for exclude_pattern in EXCLUDE_PATTERNS:
        if re.search(exclude_pattern, title_lower):
            return False
    
    # Then check if it matches phone patterns
    for phone_pattern in PHONE_PATTERNS:
        if re.search(phone_pattern, title_lower):
            return True
    
    return False

# --- Main scraping loop ---
while True:
    print(f"📄 Scraping page {page_num}...")
    
    # Request and parse the page
    r = session.get(url, headers=headers, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    
    page_phones = 0
    page_filtered = 0
    
    # 1️⃣ Extract all phone entries
    for a in soup.select("div.makers li > a"):
        title = a.get_text(strip=True)
        href = a.get("href")
        img = (a.find("img") or {}).get("src")
        
        page_phones += 1
        
        # Check if it's a Pixel phone
        if is_pixel_phone(title):
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
            page_filtered += 1
            
            print(f"  ✅ {title}")
        else:
            print(f"  ⏭️  Skipped: {title}")
    
    print(f"  📊 Page {page_num}: {page_filtered}/{page_phones} devices included\n")
    
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
output_file = "google_pixel_phones.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(phones_data, f, indent=2, ensure_ascii=False)

print(f"\n" + "="*60)
print("✅ Scraping complete!")
print("="*60)
print(f"📱 Total Pixel phones scraped: {len(phones_data)}")
print(f"📄 Pages scraped: {page_num}")
print(f"💾 Data saved to: {output_file}")

# Optional: Save a summary as well
summary = {
    "total_phones": len(phones_data),
    "pages_scraped": page_num,
    "phones": phones_data
}

summary_file = "google_pixel_phones_summary.json"
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"📊 Summary saved to: {summary_file}")

# Print all phone names
print("\n📱 Pixel Phones Found:")
for i, phone in enumerate(phones_data, 1):
    print(f"  {i}. {phone['title']}")

print("="*60)