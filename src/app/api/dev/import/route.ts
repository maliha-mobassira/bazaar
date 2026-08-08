import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/db";
import { products, inventory } from "@/db/schema";
import { requireRole } from "@/lib/requireRole";
import { eq, and } from "drizzle-orm";

const adjectives = [
  "Premium", "Organic", "Classic", "Deluxe", "Artisanal",
  "Modern", "Vintage", "Essential", "Natural", "Ultimate",
  "Eco-Friendly", "Elite", "Pro", "Minimalist", "Luxury",
  "Smart", "Selected", "Signature", "Gourmet", "Handcrafted",
  "Rustic", "Sleek"
];

const categoryTemplates: Record<string, { baseNames: string[]; priceMin: number; priceMax: number; imageUrl: string }> = {
  "Fresh Fruit": {
    baseNames: ["Apples", "Bananas", "Strawberries", "Blueberries", "Oranges", "Mangoes", "Grapes", "Pineapples", "Peaches", "Cherries"],
    priceMin: 1.99, priceMax: 8.99,
    imageUrl: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&h=300&fit=crop&q=60"
  },
  "Fresh Vegetables": {
    baseNames: ["Tomatoes", "Spinach", "Carrots", "Broccoli", "Avocados", "Bell Peppers", "Onions", "Potatoes", "Garlic", "Cucumber"],
    priceMin: 0.99, priceMax: 6.99,
    imageUrl: "https://images.unsplash.com/photo-1566385101042-1a010c119002?w=400&h=300&fit=crop&q=60"
  },
  "Dairy & Eggs": {
    baseNames: ["Whole Milk", "Greek Yogurt", "Cheddar Cheese", "Salted Butter", "Organic Eggs", "Cream Cheese", "Almond Milk", "Sour Cream"],
    priceMin: 2.49, priceMax: 9.99,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop&q=60"
  },
  "Bakery & Bread": {
    baseNames: ["Sourdough Bread", "Butter Croissants", "Chocolate Chip Cookies", "Bagels", "Whole Wheat Loaf", "Blueberry Muffins"],
    priceMin: 3.49, priceMax: 7.99,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=60"
  },
  "Pantry Staples": {
    baseNames: ["Olive Oil", "White Rice", "Pasta Sauce", "Organic Honey", "Maple Syrup", "Sea Salt", "Black Pepper", "Peanut Butter"],
    priceMin: 1.99, priceMax: 14.99,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop&q=60"
  },
  "Snacks & Sweets": {
    baseNames: ["Potato Chips", "Dark Chocolate", "Mixed Nuts", "Gummy Bears", "Granola Bars", "Pretzels", "Popcorn"],
    priceMin: 1.49, priceMax: 8.99,
    imageUrl: "https://images.unsplash.com/photo-1599490659223-e1b69494db53?w=400&h=300&fit=crop&q=60"
  },
  "Beverages": {
    baseNames: ["Sparkling Water", "Green Tea", "Ground Coffee", "Orange Juice", "Apple Cider", "Energy Drink", "Kombucha"],
    priceMin: 1.99, priceMax: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1527960656306-ff37c55e144e?w=400&h=300&fit=crop&q=60"
  },
  "Meat & Seafood": {
    baseNames: ["Chicken Breast", "Ribeye Steak", "Atlantic Salmon", "Ground Beef", "Pork Chops", "Shrimp"],
    priceMin: 5.99, priceMax: 29.99,
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop&q=60"
  },
  "Smartphones": {
    baseNames: ["Pro Phone", "Lite Phone", "Flip Phone", "Fold Phone", "Ultra Phone", "Max Phone"],
    priceMin: 399.00, priceMax: 1199.00,
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop&q=60"
  },
  "Laptops & Computers": {
    baseNames: ["Workstation Laptop", "Gaming Laptop", "Ultrabook", "Desktop Tower", "Mini PC"],
    priceMin: 599.00, priceMax: 2499.00,
    imageUrl: "https://images.unsplash.com/photo-1496181130204-755241524eab?w=400&h=300&fit=crop&q=60"
  },
  "Monitors & Displays": {
    baseNames: ["4K Monitor", "Curved Gaming Monitor", "Ultrawide Screen", "Portable Display"],
    priceMin: 149.00, priceMax: 799.00,
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop&q=60"
  },
  "Keyboards & Mice": {
    baseNames: ["Mechanical Keyboard", "Wireless Mouse", "Ergonomic Keyboard", "Trackpad"],
    priceMin: 29.00, priceMax: 199.00,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop&q=60"
  },
  "Audio & Headphones": {
    baseNames: ["Noise Cancelling Headphones", "Wireless Earbuds", "Bluetooth Speaker", "Soundbar"],
    priceMin: 39.00, priceMax: 349.00,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&q=60"
  },
  "Wearable Tech": {
    baseNames: ["Smart Watch", "Fitness Tracker", "Smart Ring", "GPS Sports Watch"],
    priceMin: 49.00, priceMax: 399.00,
    imageUrl: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&h=300&fit=crop&q=60"
  },
  "Smart Home Devices": {
    baseNames: ["Smart Thermostat", "Smart Plug", "Security Camera", "Smart Light Bulb Kit"],
    priceMin: 19.00, priceMax: 249.00,
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=300&fit=crop&q=60"
  },
  "Cameras & Photography": {
    baseNames: ["Mirrorless Camera", "Action Camera", "Camera Lens", "Tripod", "Ring Light"],
    priceMin: 49.00, priceMax: 1499.00,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop&q=60"
  },
  "Men's Shirts": {
    baseNames: ["Button Down Shirt", "Crewneck T-Shirt", "Polo Shirt", "Flannel Shirt", "Linen Shirt"],
    priceMin: 19.00, priceMax: 79.00,
    imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=300&fit=crop&q=60"
  },
  "Men's Pants & Jeans": {
    baseNames: ["Slim Fit Jeans", "Chino Pants", "Cargo Pants", "Sweatpants", "Linen Trousers"],
    priceMin: 29.00, priceMax: 99.00,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&q=60"
  },
  "Men's Outerwear": {
    baseNames: ["Leather Jacket", "Denim Jacket", "Winter Parka", "Windbreaker", "Wool Coat"],
    priceMin: 49.00, priceMax: 299.00,
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop&q=60"
  },
  "Men's Footwear": {
    baseNames: ["Leather Boots", "Running Sneakers", "Casual Loafers", "Suede Shoes", "Sandals"],
    priceMin: 39.00, priceMax: 199.00,
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400&h=300&fit=crop&q=60"
  },
  "Women's Dresses": {
    baseNames: ["Maxi Dress", "Summer Dress", "Cocktail Dress", "Wrap Dress", "Linen Dress"],
    priceMin: 39.00, priceMax: 189.00,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop&q=60"
  },
  "Women's Tops & Blouses": {
    baseNames: ["Silk Blouse", "Ribbed Crop Top", "Knit Sweater", "V-Neck T-Shirt", "Cardigan"],
    priceMin: 19.00, priceMax: 89.00,
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&h=300&fit=crop&q=60"
  },
  "Women's Jeans & Pants": {
    baseNames: ["High-Waisted Jeans", "Wide Leg Trousers", "Leggings", "Culottes", "Shorts"],
    priceMin: 29.00, priceMax: 99.00,
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=300&fit=crop&q=60"
  },
  "Women's Footwear": {
    baseNames: ["Ankle Boots", "White Sneakers", "Stiletto Heels", "Flat Sandals", "Loafers"],
    priceMin: 34.00, priceMax: 179.00,
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=300&fit=crop&q=60"
  },
  "Kids & Baby Apparel": {
    baseNames: ["Baby Romper", "Toddler Pajamas", "Kids Graphic Tee", "Kids Denim Jacket"],
    priceMin: 12.00, priceMax: 49.00,
    imageUrl: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=300&fit=crop&q=60"
  },
  "Activewear & Sports": {
    baseNames: ["Running Shorts", "Compression Shirt", "Sports Bra", "Athletic Socks", "Track Jacket"],
    priceMin: 14.00, priceMax: 89.00,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=300&fit=crop&q=60"
  },
  "Living Room Furniture": {
    baseNames: ["Fabric Sofa", "Leather Armchair", "Coffee Table", "TV Stand", "Bookshelf"],
    priceMin: 99.00, priceMax: 999.00,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop&q=60"
  },
  "Bedroom Furniture": {
    baseNames: ["Wooden Bed Frame", "Memory Foam Mattress", "Nightstand", "Chest of Drawers", "Wardrobe"],
    priceMin: 79.00, priceMax: 899.00,
    imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop&q=60"
  },
  "Office Furniture": {
    baseNames: ["Ergonomic Desk Chair", "Standing Desk", "Filing Cabinet", "Desk Organizer"],
    priceMin: 49.00, priceMax: 499.00,
    imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400&h=300&fit=crop&q=60"
  },
  "Dining Room Furniture": {
    baseNames: ["Dining Table", "Wooden Dining Chair", "Sideboard Cabinet", "Bar Stools"],
    priceMin: 39.00, priceMax: 699.00,
    imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1db207f62?w=400&h=300&fit=crop&q=60"
  },
  "Outdoor Furniture": {
    baseNames: ["Patio Sofa Set", "Sun Lounger", "Hammock", "Garden Bench", "Outdoor Dining Table"],
    priceMin: 29.00, priceMax: 799.00,
    imageUrl: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=300&fit=crop&q=60"
  },
  "Lighting & Lamps": {
    baseNames: ["Floor Lamp", "Desk Lamp", "Pendant Light", "Smart LED Strip", "Bedside Lamp"],
    priceMin: 19.00, priceMax: 199.00,
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop&q=60"
  },
  "Wall Art & Frames": {
    baseNames: ["Abstract Canvas Art", "Wooden Photo Frame", "Metal Wall Sculpture", "Poster Print"],
    priceMin: 14.00, priceMax: 149.00,
    imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=300&fit=crop&q=60"
  },
  "Rugs & Carpets": {
    baseNames: ["Area Rug", "Runner Rug", "Shag Carpet", "Jute Doormat"],
    priceMin: 19.00, priceMax: 399.00,
    imageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=400&h=300&fit=crop&q=60"
  },
  "Bedding & Linen": {
    baseNames: ["Duvet Cover Set", "Cotton Sheet Set", "Down Pillow", "Knit Throw Blanket"],
    priceMin: 24.00, priceMax: 179.00,
    imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop&q=60"
  },
  "Kitchenware & Cookware": {
    baseNames: ["Ceramic Cookware Set", "Chef Knife", "Coffee Mug Set", "Cutting Board", "Blender"],
    priceMin: 14.00, priceMax: 299.00,
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop&q=60"
  },
  "Home Fragrance & Candles": {
    baseNames: ["Scented Candle", "Reed Diffuser", "Essential Oil Set", "Incense Holder"],
    priceMin: 9.00, priceMax: 49.00,
    imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&h=300&fit=crop&q=60"
  },
  "Mirrors & Wall Decor": {
    baseNames: ["Round Wall Mirror", "Floating Shelves Set", "Macrame Tapestry", "Wall Clock"],
    priceMin: 19.00, priceMax: 129.00,
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=300&fit=crop&q=60"
  },
  "Skin Care": {
    baseNames: ["Facial Cleanser", "Moisturizing Cream", "Hyaluronic Serum", "Sunscreen SPF 50", "Face Mask"],
    priceMin: 9.00, priceMax: 79.00,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop&q=60"
  },
  "Hair Care": {
    baseNames: ["Argan Oil Shampoo", "Hydrating Conditioner", "Hair Mask", "Styling Gel", "Hair Dryer"],
    priceMin: 7.00, priceMax: 149.00,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=60"
  },
  "Makeup & Cosmetics": {
    baseNames: ["Matte Lipstick", "Liquid Foundation", "Mascara", "Eyeshadow Palette", "Setting Powder"],
    priceMin: 9.00, priceMax: 69.00,
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop&q=60"
  },
  "Perfume & Fragrances": {
    baseNames: ["Eau de Parfum", "Body Spray", "Cologne", "Rollerball Perfume"],
    priceMin: 19.00, priceMax: 149.00,
    imageUrl: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop&q=60"
  },
  "Bath & Body": {
    baseNames: ["Exfoliating Body Wash", "Bath Bomb Gift Set", "Epsom Bath Salts", "Hand Cream"],
    priceMin: 4.00, priceMax: 29.00,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop&q=60"
  },
  "Bags & Backpacks": {
    baseNames: ["Leather Tote Bag", "Travel Backpack", "Crossbody Purse", "Canvas Duffle Bag"],
    priceMin: 29.00, priceMax: 249.00,
    imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400&h=300&fit=crop&q=60"
  },
  "Jewelry & Watches": {
    baseNames: ["Gold Chain Necklace", "Silver Stud Earrings", "Minimalist Wristwatch", "Leather Bracelet"],
    priceMin: 19.00, priceMax: 349.00,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop&q=60"
  },
  "Hats & Caps": {
    baseNames: ["Baseball Cap", "Wool Beanie", "Straw Sun Hat", "Fedora Hat"],
    priceMin: 12.00, priceMax: 39.00,
    imageUrl: "https://images.unsplash.com/photo-1533055640609-24b498dfd74c?w=400&h=300&fit=crop&q=60"
  },
  "Sunglasses & Eyewear": {
    baseNames: ["Polarized Sunglasses", "Blue Light Blocking Glasses", "Aviator Sunglasses"],
    priceMin: 14.00, priceMax: 149.00,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop&q=60"
  },
  "Belts & Wallets": {
    baseNames: ["Leather Belt", "Bi-fold Wallet", "Cardholder Wallet", "Travel Passport Wallet"],
    priceMin: 12.00, priceMax: 79.00,
    imageUrl: "https://images.unsplash.com/photo-1627124118123-e4d31489ed5f?w=400&h=300&fit=crop&q=60"
  },
  "Office Supplies": {
    baseNames: ["Notebook Set", "Gel Pens Pack", "Desk Calendar", "Sticky Notes Set"],
    priceMin: 4.00, priceMax: 19.00,
    imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&h=300&fit=crop&q=60"
  },
  "Fitness & Workout": {
    baseNames: ["Resistance Bands Set", "Yoga Mat", "Dumbbell Set", "Water Bottle", "Jump Rope"],
    priceMin: 9.00, priceMax: 149.00,
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=300&fit=crop&q=60"
  }
};

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Forbidden in production environment" },
      { status: 403 }
    );
  }

  const roleCheck = requireRole(req, ["admin"]);
  if (roleCheck) return roleCheck;

  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "No tenant context found" }, { status: 400 });
  }

  try {
    const productsToProcess: Array<{
      name: string;
      sku: string;
      price: string;
      stock: number;
      image: string;
      category: string;
    }> = [];

    // Loop through all 50 categories and generate 22 variants for each
    Object.entries(categoryTemplates).forEach(([categoryName, details]) => {
      for (let i = 1; i <= 22; i++) {
        const adjective = adjectives[i % adjectives.length];
        const baseName = details.baseNames[i % details.baseNames.length];
        const productName = `${adjective} ${baseName}`;
        
        const skuPrefix = categoryName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
        const skuSuffix = baseName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
        const sku = `${skuPrefix}-${i}-${skuSuffix}`;

        const range = details.priceMax - details.priceMin;
        const randomFactor = (i * 0.17) % 1;
        const price = (details.priceMin + range * randomFactor).toFixed(2);

        const stock = Math.floor(((i * 13) % 115) + 5); // 5 to 120

        productsToProcess.push({
          name: productName,
          sku,
          price,
          stock,
          image: details.imageUrl,
          category: categoryName,
        });
      }
    });

    let imported = 0;
    let skipped = 0;

    const result = await withTenant(tenantId, async (db) => {
      return db.transaction(async (tx) => {
        for (const item of productsToProcess) {
          const existingProduct = await tx
            .select()
            .from(products)
            .where(
              and(
                eq(products.tenantId, tenantId),
                eq(products.name, item.name)
              )
            )
            .then((r) => r[0]);

          if (existingProduct) {
            skipped++;
            continue;
          }

          const [newProduct] = await tx
            .insert(products)
            .values({
              tenantId,
              name: item.name,
              sku: item.sku,
              price: item.price,
              image: item.image,
              category: item.category,
            })
            .returning();

          await tx.insert(inventory).values({
            tenantId,
            productId: newProduct.id,
            quantity: item.stock,
          });

          imported++;
        }

        return {
          imported,
          skipped,
          totalGenerated: productsToProcess.length,
        };
      });
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Product import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
