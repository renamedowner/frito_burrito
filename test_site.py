import os
import sys
import time
import subprocess
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

PORT = 8098
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def start_server():
    httpd = ThreadingHTTPServer(('127.0.0.1', PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    return httpd

def run_tests():
    print(f"Starting server on http://127.0.0.1:{PORT} ...")
    httpd = start_server()
    time.sleep(0.5)

    os.makedirs(os.path.join(ROOT_DIR, "screenshots"), exist_ok=True)
    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ---------------------------------------------------------
        # Scenario 1: Desktop View (1280x860)
        # ---------------------------------------------------------
        print("\n--- Running Desktop Scenario (1280x860) ---")
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="domcontentloaded")
        page.wait_for_selector(".dish-card")

        # Check title & header
        assert "Фрито Буррито" in page.title(), "Title does not contain 'Фрито Буррито'"
        restaurant_title = page.locator(".hero-title").inner_text()
        print(f"✓ Restaurant Title: {restaurant_title}")
        assert "Фрито Буррито" in restaurant_title

        rating_text = page.locator(".meta-pill.rating").inner_text()
        print(f"✓ Rating: {rating_text}")
        assert "5.0" in rating_text

        # Screenshot Hero & Desktop Catalog
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "01_desktop_main.png"), full_page=False)

        # Test Search
        print("Testing search filter...")
        page.fill("#searchInput", "Хуанит")
        time.sleep(0.3)
        cards = page.locator(".dish-card")
        assert cards.count() >= 1, "Search for 'Хуанит' returned no cards"
        print(f"✓ Search returned {cards.count()} matching dish")
        page.click("#searchClearBtn")
        time.sleep(0.3)

        # Open Dish Modal for 'Буррито «Месть Хуаниты»'
        print("Testing Dish Detail Modal & Modifiers...")
        juanita_card = page.locator(".dish-card").filter(has_text="Месть Хуаниты").first
        juanita_card.click()
        page.wait_for_selector("#dishModalBackdrop.active")
        
        modal_title = page.locator("#dishModalTitle").inner_text()
        print(f"✓ Modal opened for: {modal_title}")
        
        # Select first modifier
        first_mod = page.locator("#dishModalModifiersList .modifier-option").first
        if first_mod.is_visible():
            first_mod.click()
            print("✓ Selected modifier in modal")

        page.click("#dishModalAddBtn")
        page.wait_for_selector("#dishModalBackdrop:not(.active)")
        print("✓ Dish added to cart with modifier")

        # Add another item directly using card button
        print("Adding another item via card button...")
        fries_card = page.locator(".dish-card").filter(has_text="Картофель Фри").first
        fries_card.locator(".btn-add-card").click()
        time.sleep(0.3)

        # Verify Cart sidebar
        cart_total = page.locator("#cartTotalSum").inner_text()
        print(f"✓ Desktop Cart Total: {cart_total}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "02_desktop_cart_filled.png"), full_page=False)

        # Open Checkout
        print("Opening Checkout Modal...")
        page.click("#btnCheckout")
        page.wait_for_selector("#checkoutModalBackdrop.active")
        
        page.fill("#checkoutNameInput", "Алексей")
        page.fill("#checkoutPhoneInput", "9991234567")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "03_desktop_checkout.png"), full_page=False)

        # Submit Checkout (Cash upon delivery)
        print("Submitting order (Cash upon delivery)...")
        page.click("#checkoutForm button[type='submit']")
        page.wait_for_selector("#trackerModalBackdrop.active")

        order_num = page.locator("#trackerOrderNum").inner_text()
        print(f"✓ Order placed successfully! Tracker active: {order_num}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "04_order_tracker.png"), full_page=False)

        page.click("#btnNewOrder")
        context.close()

        # ---------------------------------------------------------
        # Scenario 2: Mobile View (390x844 iPhone 14)
        # ---------------------------------------------------------
        print("\n--- Running Mobile Scenario (390x844) ---")
        m_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1")
        m_page = m_context.new_page()

        m_page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        m_page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        m_page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="domcontentloaded")
        m_page.wait_for_selector(".dish-card")

        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "05_mobile_home.png"), full_page=False)

        # Add item on mobile
        first_dish = m_page.locator(".dish-card").first
        first_dish.locator(".btn-add-card").click()
        time.sleep(0.3)

        # Check floating cart bar
        float_bar = m_page.locator("#mobileCartBar")
        assert float_bar.is_visible(), "Mobile floating cart bar is not visible"
        m_sum = m_page.locator("#mCartSum").inner_text()
        print(f"✓ Mobile float cart visible with sum: {m_sum}")

        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "06_mobile_float_cart.png"), full_page=False)

        # Click float bar to open checkout
        float_bar.click()
        m_page.wait_for_selector("#checkoutModalBackdrop.active")
        print("✓ Checkout modal opened smoothly on mobile")
        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "07_mobile_checkout.png"), full_page=False)

        # Test Restaurant Info Modal on Mobile
        m_page.click("#checkoutModalClose")
        m_page.click("#btnOpenInfo")
        m_page.wait_for_selector("#infoModalBackdrop.active")
        print("✓ Restaurant info modal opened on mobile")
        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "08_mobile_restaurant_info.png"), full_page=False)

        m_context.close()
        browser.close()

    print("\n--- Audit Summary ---")
    if console_errors:
        print(f"FAILED: Found {len(console_errors)} console errors:")
        for err in console_errors:
            print("  -", err)
        sys.exit(1)
    else:
        print("✓ ALL TESTS PASSED! 0 console errors, 0 page errors, 100% smooth execution.")

if __name__ == "__main__":
    run_tests()
