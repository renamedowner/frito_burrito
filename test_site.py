import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

PORT = 8099
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
        # Scenario 1: Desktop View (1280x860) - Kuper Dark Theme
        # ---------------------------------------------------------
        print("\n--- Running Desktop Scenario (1280x860) [Kuper Dark Theme] ---")
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        page.goto(f"http://127.0.0.1:{PORT}/index.html?v=5", wait_until="domcontentloaded")
        page.wait_for_selector(".product-card")

        # Verify Dark Theme Body
        body_class = page.locator("body").get_attribute("class")
        assert "kuper-dark-theme" in body_class, "Body must have 'kuper-dark-theme'"
        print("✓ Verified Kuper Dark Theme class on body")

        # Verify Empty Desktop Cart Sidebar (Kuper bag illustration with eyes)
        empty_state = page.locator("#cartEmptyState")
        assert empty_state.is_visible(), "Kuper bag empty state must be visible initially"
        print("✓ Verified Kuper Empty Cart Bag with eyes ( • _ • )")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "10_desktop_kuper_dark_empty.png"))

        # Test Search
        print("Testing search filter...")
        page.fill("#searchInput", "Хуанит")
        time.sleep(0.3)
        cards = page.locator(".product-card")
        assert cards.count() >= 1, "Search for 'Хуанит' returned no cards"
        print(f"✓ Search filter returned {cards.count()} matching dish")
        page.click("#searchClearBtn")
        time.sleep(0.3)

        # Test Category Tiles
        print("Testing Category Tile click...")
        burrito_tile = page.locator(".cat-tile").filter(has_text="Буррито").first
        burrito_tile.click()
        time.sleep(0.2)
        print("✓ Clicked category tile")

        # Test Dish Detail Modal
        print("Testing Dish Modal...")
        first_card = page.locator(".product-card").first
        first_card.click()
        page.wait_for_selector("#dishModalBackdrop.active")
        modal_title = page.locator("#dishModalTitle").inner_text()
        print(f"✓ Modal opened for: {modal_title}")

        # Select a modifier if available
        first_mod = page.locator("#dishModalModifiersList .mod-row").first
        if first_mod.is_visible():
            first_mod.click()
            print("✓ Selected modifier in modal")

        page.click("#btnDishModalAddToCart")
        page.wait_for_selector("#dishModalBackdrop:not(.active)")
        print("✓ Added dish from modal to cart")

        # Add another dish using the direct card "+ Добавить" button
        print("Adding another item via '+ Добавить' card button...")
        second_card = page.locator(".product-card").nth(1)
        second_card.locator(".btn-kuper-add").click()
        time.sleep(0.3)

        # Verify Desktop Sidebar Cart populated
        assert not empty_state.is_visible(), "Empty state should be hidden when cart has items"
        cart_total = page.locator("#sidebarTotalCost").inner_text()
        print(f"✓ Desktop Sidebar Cart Total: {cart_total}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "11_desktop_kuper_dark_cart.png"))

        # Test Promo code activation
        print("Testing Promo Voucher...")
        page.click("#btnApplyHeroPromo")
        time.sleep(0.3)

        # Open Checkout
        page.click("#btnSidebarCheckout")
        page.wait_for_selector("#checkoutModalBackdrop.active")
        page.fill("#orderInputName", "Константин")
        page.fill("#orderInputPhone", "9996505576")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "12_desktop_checkout.png"))

        # Submit Order
        page.click("#checkoutForm button[type='submit']")
        page.wait_for_selector("#trackerBackdrop.active")
        order_num = page.locator("#trackerOrderTag").inner_text()
        print(f"✓ Order placed successfully! Live Tracker: {order_num}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "13_desktop_tracker.png"))

        page.click("#btnTrackerDone")
        page.wait_for_selector("#trackerBackdrop:not(.active)")
        time.sleep(0.3)
        context.close()

        # ---------------------------------------------------------
        # Scenario 2: Mobile View (390x844 iPhone 14)
        # ---------------------------------------------------------
        print("\n--- Running Mobile Scenario (390x844) [Kuper Dark Theme] ---")
        m_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        m_page = m_context.new_page()

        m_page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        m_page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        m_page.goto(f"http://127.0.0.1:{PORT}/index.html?v=5", wait_until="domcontentloaded")
        m_page.wait_for_selector(".product-card")

        # Check mobile overflow
        scroll_width, client_width = m_page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        assert scroll_width == client_width, f"Mobile overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}"
        print(f"✓ Mobile zero overflow verified: scrollWidth={scroll_width} == clientWidth={client_width}")

        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "14_mobile_kuper_dark_home.png"))

        # Add item on mobile
        first_m_card = m_page.locator(".product-card").first
        first_m_card.locator(".btn-kuper-add").click()
        time.sleep(0.3)

        # Check Mobile Floating Bottom Bar
        float_bar = m_page.locator("#mobileBottomBar")
        assert float_bar.is_visible(), "Mobile bottom floating cart bar must be visible"
        m_sum = m_page.locator("#mobileCartTotalSum").inner_text()
        print(f"✓ Mobile float cart bar visible with total: {m_sum}")

        # Open Mobile Cart Drawer Sheet
        m_page.click("#btnOpenMobileDrawer")
        m_page.wait_for_selector("#mobileCartBackdrop.active")
        time.sleep(0.4)
        print("✓ Mobile Cart Drawer Sheet opened smoothly")
        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "15_mobile_kuper_dark_sheet.png"))

        m_page.click("#btnCloseMobileCart")
        m_page.wait_for_selector("#mobileCartBackdrop:not(.active)")
        time.sleep(0.3)

        m_context.close()
        browser.close()

    print("\n--- Audit Summary ---")
    if console_errors:
        print(f"FAILED: Found {len(console_errors)} console errors:")
        for err in console_errors:
            print("  -", err)
        sys.exit(1)
    else:
        print("✓ ALL TESTS PASSED! 0 console errors, 0 page errors, 100% rock-solid execution.")

if __name__ == "__main__":
    run_tests()
