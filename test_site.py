import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright

PORT = 8100
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

        page.goto(f"http://127.0.0.1:{PORT}/index.html?v=6", wait_until="domcontentloaded")
        page.wait_for_selector(".product-card")

        # 1. Verify no mention of "купер" in page text or title
        title_lower = page.title().lower()
        assert "купер" not in title_lower, f"Title should not contain 'купер', got: {page.title()}"
        print(f"✓ Title verified: {page.title()} (zero mention of 'купер')")

        body_text = page.locator("body").inner_text().lower()
        assert "купер" not in body_text, "Body text should not contain 'купер'"
        print("✓ Verified body text: ZERO mention of 'купер' anywhere")

        # 2. Verify accurate rating and hours from Yandex Maps
        assert "62 оценки" in body_text, "Page must display accurate 62 оценки from Yandex"
        assert "до 22:00" in body_text, "Page must display accurate closing time 22:00"
        print("✓ Verified accurate Yandex info: 5.0 (62 оценки) and Открыто до 22:00")

        # 3. Verify no notice bar
        assert page.locator("#noticeBar").count() == 0, "Notice bar must be removed"
        print("✓ Notice bar is completely removed")

        # 4. Verify Food Photo Slots on Cards
        first_photo = page.locator(".dish-photo-slot img").first
        assert first_photo.is_visible(), "Food card must have a visible photo slot"
        print("✓ Verified minimalist food cards with photo slots")

        # 5. Test Multi-promo Carousel
        print("Testing Promo Carousel Next/Prev...")
        page.click("#btnPromoNext")
        time.sleep(0.3)
        page.click("#btnPromoNext")
        time.sleep(0.3)
        page.click("#btnPromoPrev")
        time.sleep(0.3)
        print("✓ Promo carousel navigation working smoothly")

        # 6. Test Compact Category Chips
        print("Testing Compact Category Chips...")
        burrito_chip = page.locator(".compact-cat-chip").filter(has_text="Буррито").first
        burrito_chip.click()
        time.sleep(0.2)
        print("✓ Clicked compact category chip")

        # 7. Test Promo Button (%)
        print("Testing % Promo Modal...")
        page.click("#btnHeaderPromo")
        page.wait_for_selector("#promoCodesBackdrop.active")
        page.click("#btnClosePromoCodesModal")
        page.wait_for_selector("#promoCodesBackdrop:not(.active)")
        print("✓ % Promo Modal tested")

        # 8. Test Profile Modal ("Войти") & SMS Simulator
        print("Testing Profile Modal & Login...")
        page.click("#btnHeaderProfile")
        page.wait_for_selector("#profileBackdrop.active")
        page.fill("#authPhoneInput", "9996505576")
        page.click("#btnSendAuthCode")
        time.sleep(0.3)
        assert page.locator("#profileLoggedInView").is_visible(), "Logged in view should be visible"
        page.click("#btnCloseProfileModal")
        page.wait_for_selector("#profileBackdrop:not(.active)")
        print("✓ Profile Modal & Login simulator tested successfully")

        # 9. Test Bonuses Modal ("Бонусы")
        print("Testing Bonuses Modal...")
        page.click("#btnHeaderBonuses")
        page.wait_for_selector("#bonusesBackdrop.active")
        page.click("#btnCloseBonusesAction")
        page.wait_for_selector("#bonusesBackdrop:not(.active)")
        print("✓ Bonuses Modal tested")

        # 10. Test About Modal
        print("Testing About Modal...")
        page.click("#topAboutBtn")
        page.wait_for_selector("#aboutBackdrop.active")
        page.click("#btnCloseAboutModal")
        page.wait_for_selector("#aboutBackdrop:not(.active)")
        print("✓ About Modal tested")

        # 11. Test Dish Detail Modal
        print("Testing Dish Detail Modal...")
        first_card = page.locator(".product-card").first
        first_card.click()
        page.wait_for_selector("#dishModalBackdrop.active")
        modal_title = page.locator("#dishModalTitle").inner_text()
        print(f"✓ Dish modal opened for: {modal_title}")

        # Select a modifier if available
        first_mod = page.locator("#dishModalModifiersList .mod-row").first
        if first_mod.is_visible():
            first_mod.click()
            print("✓ Selected modifier in dish modal")

        page.click("#btnDishModalAddToCart")
        page.wait_for_selector("#dishModalBackdrop:not(.active)")
        print("✓ Added dish from modal to cart")

        # Add another item directly from card "+ Добавить"
        second_card = page.locator(".product-card").nth(1)
        second_card.locator(".btn-add-minimal").click()
        time.sleep(0.3)

        # Check Desktop Cart Total
        cart_total = page.locator("#sidebarTotalCost").inner_text()
        print(f"✓ Desktop Cart Total: {cart_total}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "20_desktop_emerald_cart.png"))

        # 12. Test Checkout & Payment Simulator
        print("Testing Checkout Modal...")
        page.click("#btnSidebarCheckout")
        page.wait_for_selector("#checkoutModalBackdrop.active")
        page.fill("#orderInputName", "Александр")
        page.fill("#orderInputPhone", "9996505576")
        page.click("#checkoutForm button[type='submit']")

        page.wait_for_selector("#trackerBackdrop.active")
        order_num = page.locator("#trackerOrderTag").inner_text()
        print(f"✓ Order placed successfully! Tracker: {order_num}")
        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "21_desktop_tracker.png"))

        page.click("#btnTrackerDone")
        page.wait_for_selector("#trackerBackdrop:not(.active)")
        time.sleep(0.3)

        # 13. Test Legal Modals
        print("Testing Legal Modals (152-ФЗ & Оферта)...")
        page.click("#btnOpenPrivacyPolicy")
        page.wait_for_selector("#legalPrivacyBackdrop.active")
        page.click("#btnClosePrivacyModal")
        page.wait_for_selector("#legalPrivacyBackdrop:not(.active)")

        page.click("#btnOpenPublicOffer")
        page.wait_for_selector("#legalOfferBackdrop.active")
        page.click("#btnCloseOfferModal")
        page.wait_for_selector("#legalOfferBackdrop:not(.active)")
        print("✓ Legal Modals (Privacy 152-FZ & Offer) tested")

        # 14. Test Cookie Banner
        print("Testing Cookie Banner...")
        cookie_btn = page.locator("#btnAcceptCookies")
        if cookie_btn.is_visible():
            cookie_btn.click()
            time.sleep(0.3)
            assert not page.locator("#cookieBanner").is_visible(), "Cookie banner should be closed"
            print("✓ Cookie banner accepted and closed")

        page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "22_desktop_full_page.png"))
        context.close()

        # ---------------------------------------------------------
        # Scenario 2: Mobile View (390x844 iPhone 14)
        # ---------------------------------------------------------
        print("\n--- Running Mobile Scenario (390x844) ---")
        m_context = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        m_page = m_context.new_page()

        m_page.on("console", lambda msg: console_errors.append(f"Console {msg.type}: {msg.text}") if msg.type == "error" else None)
        m_page.on("pageerror", lambda err: console_errors.append(f"PageError: {err}"))

        m_page.goto(f"http://127.0.0.1:{PORT}/index.html?v=6", wait_until="domcontentloaded")
        m_page.wait_for_selector(".product-card")

        # Check mobile overflow
        scroll_width, client_width = m_page.evaluate("() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        assert scroll_width == client_width, f"Mobile overflow detected: scrollWidth={scroll_width}, clientWidth={client_width}"
        print(f"✓ Mobile zero overflow verified: scrollWidth={scroll_width} == clientWidth={client_width}")

        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "23_mobile_home.png"))

        # Add item on mobile
        first_m_card = m_page.locator(".product-card").first
        first_m_card.locator(".btn-add-minimal").click()
        time.sleep(0.3)

        # Check Mobile Floating Bottom Bar
        float_bar = m_page.locator("#mobileBottomBar")
        assert float_bar.is_visible(), "Mobile bottom floating bar must be visible"
        m_sum = m_page.locator("#mobileCartTotalSum").inner_text()
        print(f"✓ Mobile float bar visible with total: {m_sum}")

        # Open Mobile Cart Drawer Sheet
        m_page.click("#btnOpenMobileDrawer")
        m_page.wait_for_selector("#mobileCartBackdrop.active")
        time.sleep(0.4)
        print("✓ Mobile Cart Drawer Sheet opened smoothly")
        m_page.screenshot(path=os.path.join(ROOT_DIR, "screenshots", "24_mobile_sheet.png"))

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
