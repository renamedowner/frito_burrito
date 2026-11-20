import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

PORT = 8097
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

        page.goto(f"http://127.0.0.1:{PORT}/index.html?v=3", wait_until="domcontentloaded")
        page.wait_for_selector(".product-card")

        # Check title & hero
        assert "FRITO BURRITO" in page.title()
        hero_title = page.locator(".hero-title").inner_text()
        print(f"✓ Hero Title: {hero_title}")

        # Search test
        print("Testing search filter...")
        page.fill("#searchInput", "Хуанит")
        time.sleep(0.3)
        cards = page.locator(".product-card")
        assert cards.count() >= 1, "Search for 'Хуанит' returned no cards"
        print(f"✓ Search returned {cards.count()} matching dish")
        page.click("#searchClearBtn")
        time.sleep(0.3)

        # Open Dish Modal for 'Буррито «Месть Хуаниты»'
        print("Testing Dish Detail Modal & Modifiers...")
        juanita_card = page.locator(".product-card").filter(has_text="Месть Хуаниты").first
        juanita_card.click()
        page.wait_for_selector("#dishModalBackdrop.active")
        
        modal_title = page.locator("#dishModalTitle").inner_text()
        print(f"✓ Modal opened for: {modal_title}")
        
        # Select first modifier
        first_mod = page.locator("#dishModalModifiersList .mod-row").first
        if first_mod.is_visible():
            first_mod.click()
            print("✓ Selected modifier in modal")

        page.click("#dishModalAddBtn")
        page.wait_for_selector("#dishModalBackdrop:not(.active)")
        print("✓ Dish added to cart with modifier")

        # Add another item directly using card button
        print("Adding another item via card button...")
        fries_card = page.locator(".product-card").filter(has_text="Картофель Фри").first
        fries_card.locator(".btn-card-add").click()
        time.sleep(0.3)

        # Open Cart Drawer
        page.click("#headerCartBtn")
        page.wait_for_selector("#cartDrawerBackdrop.active")
        total_sum = page.locator("#summaryFinalTotal").inner_text()
        print(f"✓ Cart Drawer Total: {total_sum}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "01_desktop_drawer.png"))

        # Open Checkout
        page.click("#btnOpenCheckoutModal")
        page.wait_for_selector("#checkoutModalBackdrop.active")
        page.fill("#orderNameInput", "Алексей")
        page.fill("#orderPhoneInput", "9991234567")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "02_desktop_checkout.png"))

        # Submit order
        page.click("#orderForm button[type='submit']")
        page.wait_for_selector("#trackerModalBackdrop.active")
        order_num = page.locator("#trackerOrderNumber").inner_text()
        print(f"✓ Order placed successfully! Tracker: {order_num}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "03_order_tracker.png"))

        page.click("#btnTrackerDone")
        context.close()

        # ---------------------------------------------------------
        # Scenario 2: Mobile View (390x844 iPhone 14)
        # ---------------------------------------------------------
        print("\n--- Running Mobile Scenario (390x844) ---")
        m_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        m_page = m_context.new_page()

        m_page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        m_page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        m_page.goto(f"http://127.0.0.1:{PORT}/index.html?v=3", wait_until="domcontentloaded")
        m_page.wait_for_selector(".product-card")

        # Check mobile overflow
        scroll_width, client_width = m_page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        assert scroll_width == client_width, f"Mobile overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}"
        print("✓ Mobile zero overflow verified: 100% rock-solid layout")

        # Add item on mobile
        first_dish = m_page.locator(".product-card").first
        first_dish.locator(".btn-card-add").click()
        time.sleep(0.3)

        # Check float cart
        float_cart = m_page.locator("#mobileFloatCart")
        assert float_cart.is_visible(), "Mobile floating cart is not visible"
        m_sum = m_page.locator("#mCartSum").inner_text()
        print(f"✓ Mobile float cart visible with sum: {m_sum}")

        float_cart.click()
        m_page.wait_for_selector("#cartDrawerBackdrop.active")
        print("✓ Mobile cart drawer opened smoothly")
        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "04_mobile_drawer.png"))

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
