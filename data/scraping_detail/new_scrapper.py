import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time
import sys

# --- Helper Functions for Parsing and Cleaning (No changes here) ---

def find_first_number(text, num_type=float):
    if not text: return None
    match = re.search(r'(\d+\.?\d*)', str(text))
    if match:
        try: return num_type(match.group(1))
        except (ValueError, IndexError): return None
    return None

def parse_name(phone_name):
    parts = phone_name.split()
    manufacturer = parts[0] if parts else None
    if manufacturer == "Apple":
        brand = "iPhone"; model_name = " ".join(parts[1:])
    else:
        brand = parts[1] if len(parts) > 1 else None; model_name = " ".join(parts[2:])
    return manufacturer, brand, model_name

def parse_camera_setup(text):
    if not text: return []
    cameras = []
    camera_segments = re.finditer(r'(\d+\s*MP.*?)(?=\d+\s*MP|$)', text)
    for match in camera_segments:
        cam_str = match.group(1); cam_data = {}
        if "ultrawide" in cam_str.lower(): cam_data['type'] = 'ultrawide'
        elif "telephoto" in cam_str.lower(): cam_data['type'] = 'telephoto'
        elif "wide" in cam_str.lower(): cam_data['type'] = 'main'
        elif "depth" in cam_str.lower(): cam_data['type'] = 'depth'
        else: cam_data['type'] = 'unknown'
        mp_match = re.search(r'(\d+)\s*MP', cam_str, re.I)
        cam_data['sensor_mp'] = int(mp_match.group(1)) if mp_match else None
        aperture_match = re.search(r'f/(\d+\.?\d*)', cam_str, re.I)
        cam_data['aperture'] = f"f/{aperture_match.group(1)}" if aperture_match else None
        cam_data['ois'] = 'ois' in cam_str.lower()
        sensor_size_match = re.search(r'1/(\d+\.?\d*)"', cam_str, re.I)
        cam_data['sensor_size'] = f'1/{sensor_size_match.group(1)}"' if sensor_size_match else None
        zoom_match = re.search(r'(\d+)x optical zoom', cam_str, re.I)
        if zoom_match: cam_data['optical_zoom'] = f"{zoom_match.group(1)}x"
        cameras.append(cam_data)
    return cameras


# --- Main Scraping and Transformation Logic ---

def scrape_and_format_phone(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        r = requests.get(url, headers=headers, timeout=15); r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"    - Error fetching URL {url}: {e}")
        return None

    try:
        raw_data = {}
        phone_name_elem = soup.select_one("h1.specs-phone-name-title")
        if not phone_name_elem:
            print(f"    - Could not find phone name on {url}")
            return None
        phone_name = phone_name_elem.get_text(strip=True)
        
        specs_container = soup.select_one("#specs-list")
        if specs_container:
            for table in specs_container.find_all("table"):
                category = table.find("th").get_text(strip=True)
                raw_data[category] = {}
                for row in table.find_all("tr"):
                    cells = row.find_all("td")
                    if len(cells) == 2:
                        key = cells[0].get_text(strip=True)
                        value = cells[1].get_text(strip=True)
                        raw_data[category][key] = value

        def get_spec(category, key): return raw_data.get(category, {}).get(key, "")

        manufacturer, brand, model_name = parse_name(phone_name)

        release_str = get_spec("Launch", "Status"); release_date = None
        date_match = re.search(r'Released (\d{4}), (\w+) (\d+)', release_str)
        if date_match:
            year, month_str, day = date_match.groups()
            month_num = datetime.strptime(month_str, '%B').month
            release_date = f"{year}-{month_num:02d}-{int(day):02d}"

        dim_str = get_spec("Body", "Dimensions"); dimensions_mm = dim_str.split('(')[0].strip() if dim_str else None
        display_type_str = get_spec("Display", "Type")
        refresh_rate_match = re.search(r'(\d+)Hz', display_type_str)
        max_hz = int(refresh_rate_match.group(1)) if refresh_rate_match else None
        internal_mem_str = get_spec("Memory", "Internal")
        ram_gb = list(set(map(int, re.findall(r'(\d+)GB RAM', internal_mem_str))))
        storage_gb = list(set(map(int, re.findall(r'(\d+)GB(?! RAM)', internal_mem_str))))
        if "1TB" in internal_mem_str: storage_gb.append(1024)
        if "2TB" in internal_mem_str: storage_gb.append(2048)
        charging_str = get_spec("Battery", "Charging")
        wireless_match = re.search(r'(\d+)W\s*wireless', charging_str, re.I)
        wireless_w = int(wireless_match.group(1)) if wireless_match else None
        wired_match = re.search(r'(\d+)W\s*wired', charging_str, re.I)
        wired_w = int(wired_match.group(1)) if wired_match else None
        fast_charging_match = re.search(r'(\d+%\s*in\s*\d+\s*min)', charging_str, re.I)
        fast_charging_details = fast_charging_match.group(1) if fast_charging_match else None
        wlan_str = get_spec("Comms", "WLAN"); wifi_match = re.search(r'Wi-Fi\s*(.*)', wlan_str)
        main_camera_spec_key = next((key for key in raw_data.get("Main Camera", {}) if key not in ["Features", "Video"]), None)
        camera_text = get_spec("Main Camera", main_camera_spec_key)
        sensors_str = get_spec("Features", "Sensors")

        formatted_data = {
            "manufacturer": manufacturer, "brand": brand, "model_name": model_name,
            "model_number": get_spec("Misc", "Models"), "release_date": release_date,
            "msrp_usd": find_first_number(get_spec("Misc", "Price")),
            "discontinued": "Discontinued" in get_spec("Launch", "Status"),
            "color_options": [c.strip() for c in get_spec("Misc", "Colors").split(',') if c.strip()],
            "dimensions_mm": dimensions_mm, "weight_g": find_first_number(get_spec("Body", "Weight"), int),
            "build_materials": get_spec("Body", "Build"),
            "display": {"size_in": find_first_number(get_spec("Display", "Size")),"resolution": get_spec("Display", "Resolution").split(',')[0].replace(' pixels', ''), "ppi": find_first_number(get_spec("Display", "Resolution").split('(')[-1], int), "type": display_type_str.split(',')[0], "refresh_rate": { "max_hz": max_hz, "min_hz": 1 if "LTPO" in display_type_str else None, "adaptive": "LTPO" in display_type_str }, "hdr_support": [hdr for hdr in ["HDR10", "Dolby Vision"] if hdr in display_type_str], "protection": get_spec("Display", "Protection") },
            "platform": { "os": get_spec("Platform", "OS"), "ui_skin": None },
            "performance": { "soc": get_spec("Platform", "Chipset"), "cpu": get_spec("Platform", "CPU"), "gpu": get_spec("Platform", "GPU"), "ram_gb": sorted(ram_gb) if ram_gb else None },
            "storage_options_gb": sorted(storage_gb) if storage_gb else None, "expandable_storage": get_spec("Memory", "Card slot") != "No",
            "battery_capacity_mah": find_first_number(get_spec("Battery", "Type"), int), "charging_wired_w": wired_w, "charging_wireless_w": wireless_w, "fast_charging_details": fast_charging_details,
            "rear_camera_setup": parse_camera_setup(camera_text),
            "front_camera": { "sensor_mp": find_first_number(get_spec("Selfie camera", "Single"), int), "aperture": (re.search(r'f/\d+\.?\d*', get_spec("Selfie camera", "Single")).group(0) if re.search(r'f/\d+\.?\d*', get_spec("Selfie camera", "Single")) else None), "video_max": (get_spec("Selfie camera", "Video")).split(',')[0] },
            "connectivity": { "sim_type": get_spec("Body", "SIM"), "5g": "5G" in get_spec("Network", "Technology"), "wifi": f"Wi-Fi {wifi_match.group(1).strip()}" if wifi_match else None, "bluetooth": get_spec("Comms", "Bluetooth"), "nfc": get_spec("Comms", "NFC") == "Yes", "usb_port": get_spec("Comms", "USB"), "headphone_jack": get_spec("Sound", "3.5mm jack") != "No" },
            "biometrics": [b for b in ["fingerprint", "face id"] if b in sensors_str.lower()], "sensors": [s.strip() for s in sensors_str.split(',') if s.strip()],
            "water_resistance_rating": (re.search(r'(IP\d+)', str(raw_data.get("Body", "")), re.I).group(1) if re.search(r'(IP\d+)', str(raw_data.get("Body", "")), re.I) else None),
            "source": url, "last_verified": datetime.now().isoformat()
        }
        return formatted_data
    
    except Exception as e:
        print(f"    - An error occurred during parsing for {url}: {e}")
        return None

# --- Main Execution Block for Batch Processing ---
def main(input_filename, output_filename):
    """Loads a list of phones from a file, scrapes them, and saves the results."""
    try:
        with open(input_filename, 'r') as f:
            json_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file not found at '{input_filename}'")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_filename}'. Please check the file format.")
        return

    all_phones_data = []
    failed_phones = []
    
    # --- FIX APPLIED HERE ---
    # This logic now correctly handles both a direct list and a dictionary with a "phones" key.
    if isinstance(json_data, dict):
        phone_list = json_data.get("phones", [])
    elif isinstance(json_data, list):
        phone_list = json_data
    else:
        print("Error: JSON data is not in a recognized format (expected a list or a dictionary with a 'phones' key).")
        return
    # --- END OF FIX ---

    if not phone_list:
        print("Error: Could not find a list of phones in the JSON file.")
        return
        
    total_phones = len(phone_list)
    print(f"📱 Found {total_phones} phones to process...")
    
    for i, phone in enumerate(phone_list, 1):
        print(f"[{i}/{total_phones}] 📄 Scraping: {phone['title']}")
        
        url_to_scrape = phone.get('full_url')
        if not url_to_scrape:
            print(f"    - ❌ FAILED: Missing 'full_url' for {phone['title']}")
            failed_phones.append(phone)
            continue

        scraped_data = scrape_and_format_phone(url_to_scrape)
        
        if scraped_data:
            print(f"    - ✅ Success!")
            phone['specs'] = scraped_data
            all_phones_data.append(phone)
        else:
            print(f"    - ❌ FAILED!")
            failed_phones.append(phone)
            
        time.sleep(1)

    with open(output_filename, "w") as f:
        json.dump(all_phones_data, f, indent=2)

    print("\n" + "="*50); print("📊 SCRAPING COMPLETE"); print("="*50)
    print(f"Total Phones Processed: {total_phones}")
    print(f"✅ Successful: {len(all_phones_data)}")
    print(f"❌ Failed: {len(failed_phones)}")
    
    if failed_phones:
        print("\nFailed Phones/URLs:")
        for phone in failed_phones:
            print(f"- {phone.get('title', 'Unknown Title')}: {phone.get('full_url', 'No URL')}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python your_script_name.py <input_json_file> [output_json_file]")
        print("Example: python your_script_name.py phones_to_scrape.json scraped_data.json")
        sys.exit(1)
        
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'scraped_output.json'
    
    main(input_filename=input_file, output_filename=output_file)