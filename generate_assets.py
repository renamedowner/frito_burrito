import os
from PIL import Image, ImageDraw, ImageFont

img_dir = os.path.join(os.path.dirname(__file__), "img")
os.makedirs(img_dir, exist_ok=True)

dishes_config = [
    ("hero-cover.jpg", "ФРИТО БУРРИТО", "Мексиканский стритфуд на Петра Метальникова", (216, 67, 21), (255, 111, 0), "🌯🌮🥑"),
    ("burrito-classic.jpg", "Эль Классико", "Курица гриль • Моцарелла • Томаты", (230, 81, 0), (255, 167, 38), "🌯"),
    ("burrito-juanita.jpg", "Месть Хуаниты", "Мраморная говядина • Халапеньо • Сальса", (183, 28, 28), (229, 57, 53), "🌶️🌯"),
    ("burrito-diablo.jpg", "Эль Диабло", "Суперострый хабанеро • Говядина • Чеддер", (136, 14, 79), (194, 24, 91), "🔥🌶️"),
    ("burrito-mushroom.jpg", "Грибной Жюльен", "Шампиньоны гриль • Цыпленок • Ранч", (62, 39, 35), (141, 110, 99), "🍄🧀"),
    ("burrito-don-pedro.jpg", "Дон Педро", "Рубленое мясо • Хрустящий бекон • Барбекю", (191, 54, 12), (244, 81, 30), "🥓🌯"),
    ("burrito-las-vegan.jpg", "Лас Веган", "Печеный батат • Гуакамоле • Фасоль", (46, 125, 50), (102, 187, 106), "🥑🌱"),
    ("burrito-sea-devil.jpg", "Морской Дьявол", "Тигровые креветки • Авокадо • Лайм", (1, 87, 155), (38, 166, 154), "🍤🥑"),
    ("burrito-tex-mex.jpg", "Текс-Мекс", "Чили кон карне • Рис • Чеддер", (110, 44, 0), (230, 126, 34), "🌯🧀"),
    ("tacos-box.jpg", "Такос Ланч-Бокс", "3 тако: цыпленок, говядина, лайм", (230, 81, 0), (243, 156, 18), "🌮🌮🌮"),
    ("quesadilla-chicken.jpg", "Кесадилья с курицей", "Двойной чеддер • Моцарелла • Цыпленок", (214, 137, 16), (241, 196, 15), "🧀🌮"),
    ("quesadilla-4cheese.jpg", "Кесадилья 4 Сыра", "Чеддер • Моцарелла • Гауда • Сливочный", (243, 156, 18), (241, 196, 15), "🧀✨"),
    ("fries-crispy.jpg", "Картофель Фри", "Хрустящий золотистый картофель с солью", (214, 137, 16), (245, 176, 65), "🍟"),
    ("nuggets-chicken.jpg", "Наггетсы куриные", "7 шт • Золотистая панировка панко", (185, 119, 14), (220, 118, 51), "🍗"),
    ("cheese-sticks.jpg", "Сырные палочки", "5 шт • Тянущийся сыр моцарелла", (175, 122, 197), (244, 208, 63), "🧀"),
    ("king-shrimps.jpg", "Креветки в панировке", "6 шт • Королевские тигровые креветки", (229, 115, 115), (255, 138, 101), "🍤🍋"),
    ("sauce-guacamole.jpg", "Фирменный Гуакамоле", "Спелое авокадо • Лайм • Кинза", (46, 125, 50), (139, 195, 74), "🥑🌿"),
    ("sauce-salsa.jpg", "Соус Сальса Роха", "Пряные томаты • Халапеньо • Чеснок", (198, 40, 40), (239, 83, 80), "🍅🌶️"),
    ("sauce-ranch.jpg", "Чесночный Ранч", "Сливочный домашний соус с травами", (97, 97, 97), (189, 189, 189), "🥣🧄"),
    ("sauce-cheese.jpg", "Сырный Чеддер", "Густой бархатистый сырный дип", (245, 127, 23), (255, 214, 0), "🧀💛"),
    ("drink-cola.jpg", "Добрый Кола", "0.5 л • Сильногазированный охлажденный", (183, 28, 28), (49, 27, 146), "🥤🧊"),
    ("drink-mors.jpg", "Морс Клюквенный", "0.5 л • Натуральная таежная клюква", (136, 14, 79), (173, 20, 87), "🫐🥤"),
    ("drink-cappuccino.jpg", "Капучино горячий", "300 мл • Зерновой кофе с пенкой", (62, 39, 35), (109, 76, 65), "☕🥛"),
    ("combo-mexican.jpg", "Комбо «Мексиканец»", "Буррито + Фри + Сальса + Напиток", (216, 67, 21), (255, 179, 0), "🌯🍟🥤"),
    ("combo-fire.jpg", "Комбо «Огненная Фиеста»", "Месть Хуаниты + Сырные палочки + Чили", (183, 28, 28), (255, 111, 0), "🔥🌯🧀")
]

def draw_dish_image(filename, title, subtitle, color1, color2, icon):
    w, h = 600, 450
    if filename == "hero-cover.jpg":
        w, h = 1200, 400

    img = Image.new("RGB", (w, h), color1)
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(h):
        ratio = y / h
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # Decorative background circles & texture
    draw.ellipse([w - 180, -60, w + 140, 260], fill=(255, 255, 255, 30))
    draw.ellipse([-80, h - 140, 180, h + 120], fill=(0, 0, 0, 30))

    # Center card plate
    plate_margin_x = 40
    plate_margin_y = 30
    draw.rounded_rectangle(
        [plate_margin_x, plate_margin_y, w - plate_margin_x, h - plate_margin_y],
        radius=20,
        fill=(255, 255, 255),
        outline=(240, 240, 240),
        width=2
    )

    # Top food badge
    draw.rounded_rectangle(
        [plate_margin_x + 20, plate_margin_y + 20, plate_margin_x + 190, plate_margin_y + 54],
        radius=17,
        fill=(254, 243, 199)
    )
    draw.text((plate_margin_x + 35, plate_margin_y + 26), "ФРИТО БУРРИТО", fill=(180, 83, 9))

    # Dish title
    draw.text((plate_margin_x + 24, plate_margin_y + 75), title, fill=(33, 33, 33))
    
    # Subtitle / ingredients
    draw.text((plate_margin_x + 24, plate_margin_y + 115), subtitle, fill=(117, 117, 117))

    # Central large food illustration placeholder / symbol badge
    cx = w // 2
    cy = plate_margin_y + (h - 2 * plate_margin_y) // 2 + 50
    
    # Stylized food platter circle
    draw.ellipse([cx - 85, cy - 85, cx + 85, cy + 85], fill=(250, 250, 250), outline=(230, 230, 230), width=3)
    draw.ellipse([cx - 65, cy - 65, cx + 65, cy + 65], fill=color2)
    
    # Border accent
    draw.line([(plate_margin_x + 24, h - plate_margin_y - 35), (w - plate_margin_x - 24, h - plate_margin_y - 35)], fill=(240, 240, 240), width=1)
    draw.text((plate_margin_x + 24, h - plate_margin_y - 28), "Свежее приготовление • ул. Петра Метальникова, 3/1А", fill=(158, 158, 158))

    filepath = os.path.join(img_dir, filename)
    img.save(filepath, "JPEG", quality=90)
    print(f"Generated {filename}")

for item in dishes_config:
    draw_dish_image(*item)

print("All assets generated successfully!")
