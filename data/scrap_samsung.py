import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json
import re

# Configuration
BASE_URL = "https://www.gsmarena.com/samsung-phones-9.php"
OUTPUT_FILE = "samsung_flagship_phones.json"

# Galaxy S, Note, Fold, and Flip series
SERIES_PATTERNS = {
    'Galaxy S': r'\bgalaxy\s+s\d+',
    'Galaxy Note': r'\bgalaxy\s+note',
    'Galaxy Z Fold': r'\bgalaxy\s+z?\s*fold',
    'Galaxy Z Flip': r'\bgalaxy\s+z?\s*flip'
}

def identify_series(phone_title):
    """Identify if phone is Galaxy S, Note, Fold, or Flip."""
    title_lower = phone_title.lower()
    
    for series_name, pattern in SERIES_PATTERNS.items():
        if re.search(pattern, title_lower):
            return series_name
    
    return None

def scrape_samsung_flagship():
    """Scrape Samsung Galaxy S, Note, Fold, and Flip phones."""
    
    session = requests.Session()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    phones_data = []
    seen_pages = set()
    current_url = BASE_URL
    page_num = 1
    
    print("🔍 Scraping Samsung Galaxy S, Note, Fold, and Flip models...\n")
    
    while True:
        print(f"📄 Page {page_num}...")
        
        try:
            response = session.get(current_url, headers=headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")
            
            page_count = 0
            
            for link in soup.select("div.makers li > a"):
                title = link.get_text(strip=True)
                href = link.get("href")
                img_tag = link.find("img")
                img_src = img_tag.get("src") if img_tag else None
                
                series = identify_series(title)
                
                if series:
                    phone_data = {
                        "title": title,
                        "series": series,
                        "url": urljoin(BASE_URL, href) if href else None,
                        "image": img_src,
                        "page": page_num
                    }
                    
                    phones_data.append(phone_data)
                    page_count += 1
                    print(f"  ✅ {title} [{series}]")
            
            print(f"  Found {page_count} flagship phones on this page\n")
            
            # Find next page
            nav_pages = soup.find("div", class_="nav-pages")
            
            if not nav_pages:
                break
            
            page_links = nav_pages.find_all("a")
            
            if not page_links:
                break
            
            last_link = page_links[-1]
            
            if "prevnextbuttondis" in last_link.get("class", []):
                break
            
            next_href = last_link.get("href")
            
            if not next_href:
                break
            
            next_url = urljoin(current_url, next_href)
            
            if next_url in seen_pages:
                break
            
            seen_pages.add(next_url)
            current_url = next_url
            page_num += 1
            
        except requests.RequestException as e:
            print(f"❌ Error: {e}")
            break
    
    return phones_data, page_num

def save_results(phones_data, pages_scraped):
    """Save results to JSON."""
    
    # Separate by series
    galaxy_s = [p for p in phones_data if p['series'] == 'Galaxy S']
    galaxy_note = [p for p in phones_data if p['series'] == 'Galaxy Note']
    galaxy_fold = [p for p in phones_data if p['series'] == 'Galaxy Z Fold']
    galaxy_flip = [p for p in phones_data if p['series'] == 'Galaxy Z Flip']
    
    # Save all phones
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(phones_data, f, indent=2, ensure_ascii=False)
    
    # Save summary with breakdown
    summary = {
        "total_phones": len(phones_data),
        "pages_scraped": pages_scraped,
        "galaxy_s_count": len(galaxy_s),
        "galaxy_note_count": len(galaxy_note),
        "galaxy_fold_count": len(galaxy_fold),
        "galaxy_flip_count": len(galaxy_flip),
        "galaxy_s_phones": galaxy_s,
        "galaxy_note_phones": galaxy_note,
        "galaxy_fold_phones": galaxy_fold,
        "galaxy_flip_phones": galaxy_flip
    }
    
    summary_file = "samsung_flagship_summary.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # Print results
    print("\n" + "="*60)
    print("✅ SCRAPING COMPLETE!")
    print("="*60)
    print(f"📱 Total phones: {len(phones_data)}")
    print(f"   • Galaxy S: {len(galaxy_s)} phones")
    print(f"   • Galaxy Note: {len(galaxy_note)} phones")
    print(f"   • Galaxy Z Fold: {len(galaxy_fold)} phones")
    print(f"   • Galaxy Z Flip: {len(galaxy_flip)} phones")
    print(f"\n📄 Pages scraped: {pages_scraped}")
    print(f"💾 Data saved to: {OUTPUT_FILE}")
    print(f"📊 Summary saved to: {summary_file}")
    print("="*60)

if __name__ == "__main__":
    phones, pages = scrape_samsung_flagship()
    save_results(phones, pages)