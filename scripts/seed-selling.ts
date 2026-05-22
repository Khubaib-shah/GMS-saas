import mongoose from "mongoose";
import fs from "fs";
import path from "path";

import Gym from "../models/Gym";
import User from "../models/User";
import ProductCategory from "../models/ProductCategory";
import ProductBrand from "../models/ProductBrand";
import Product from "../models/Product";
import InventoryLog from "../models/InventoryLog";
import Order from "../models/Order";

// Load environment variables
function loadEnv() {
    const envFiles = [".env.local", ".env"];
    for (const file of envFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            console.log(`Loading environment from ${file}`);
            const content = fs.readFileSync(filePath, "utf8");
            for (const line of content.split("\n")) {
                if (!line || line.startsWith("#") || !line.includes("=")) continue;
                const [key, ...valueParts] = line.split("=");
                const value = valueParts.join("=").trim().replace(/^["'](.*)["']$/, "$1");
                if (key && value && !process.env[key.trim()]) {
                    process.env[key.trim()] = value;
                }
            }
        }
    }
}

loadEnv();

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.error("MONGODB_URL not found in environment variables");
    process.exit(1);
}

async function seedSelling() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URL!);
        console.log("Database connection established");

        const gyms = await Gym.find();

        if (gyms.length === 0) {
            console.error(`No gyms found. Please run seed-pakistani.ts first.`);
            process.exit(1);
        }

        console.log(`Found ${gyms.length} Gyms. Seeding selling module for all of them...`);

        // Clean existing selling module data globally
        console.log("Cleaning existing selling module data globally...");
        await ProductCategory.deleteMany({});
        await ProductBrand.deleteMany({});
        await Product.deleteMany({});
        await InventoryLog.deleteMany({});
        await Order.deleteMany({});

        for (const gym of gyms) {
            console.log(`\n--- Seeding Gym: ${gym.name} ---`);
            const staff = await User.findOne({ gymId: gym._id, role: "manager" });
            const staffId = staff ? staff._id : new mongoose.Types.ObjectId(); // Fallback if no manager

            // 1. Categories
            console.log("Seeding Categories...");
            const supplementsCategory = await ProductCategory.create({
                gymId: gym._id,
                name: "Supplements",
                slug: "supplements",
                description: "Protein powders, pre-workouts, and vitamins",
                isActive: true
            });

            const apparelCategory = await ProductCategory.create({
                gymId: gym._id,
                name: "Apparel",
                slug: "apparel",
                description: "Gym clothing and accessories",
                isActive: true
            });

            // 2. Brands
            console.log("Seeding Brands...");
            const brandON = await ProductBrand.create({
                gymId: gym._id,
                name: "Optimum Nutrition",
                slug: "optimum-nutrition",
                description: "High quality whey protein"
            });

            const brandGym = await ProductBrand.create({
                gymId: gym._id,
                name: gym.name,
                slug: gym.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: "Official Gym Merchandise"
            });

            // 3. Products
            console.log("Seeding Products...");
            const wheyProtein = await Product.create({
                gymId: gym._id,
                name: "Gold Standard 100% Whey - 5lbs",
                slug: "gold-standard-whey-5lbs",
                shortDescription: "The world's best-selling whey protein powder.",
                description: "<p>Gold Standard 100% Whey Blend – 24g blended protein consisting of whey protein isolate, whey protein concentrate, and whey peptides to support lean muscle mass.</p>",
                price: 18500,
                discountPrice: 17000,
                categoryId: supplementsCategory._id,
                brandId: brandON._id,
                status: "active",
                trackInventory: true,
                stockQuantity: 24,
                sku: "ON-WHEY-5LB-CHOC",
                images: [],
                visibility: "public"
            });

            const preWorkout = await Product.create({
                gymId: gym._id,
                name: "C4 Original Pre-Workout",
                slug: "c4-original-preworkout",
                shortDescription: "Explosive energy and performance.",
                price: 6500,
                categoryId: supplementsCategory._id,
                status: "active",
                trackInventory: true,
                stockQuantity: 15,
                sku: "C4-PRE-30S",
                visibility: "public"
            });

            const gymTshirt = await Product.create({
                gymId: gym._id,
                name: "Gym Logo T-Shirt - Large",
                slug: "gym-logo-tshirt-l",
                shortDescription: "Breathable cotton t-shirt with gym logo.",
                price: 1500,
                categoryId: apparelCategory._id,
                brandId: brandGym._id,
                status: "active",
                trackInventory: true,
                stockQuantity: 50,
                sku: "GYM-TSHIRT-L",
                visibility: "public"
            });
            
            const gymTowel = await Product.create({
                gymId: gym._id,
                name: "Premium Sweat Towel",
                slug: "premium-sweat-towel",
                shortDescription: "Premium microfiber sweat towel.",
                price: 800,
                categoryId: apparelCategory._id,
                brandId: brandGym._id,
                status: "active",
                trackInventory: true,
                stockQuantity: 100,
                sku: "GYM-TOWEL-01",
                visibility: "public"
            });

            // 4. Initial Inventory Logs
            console.log("Seeding Inventory Logs...");
            await InventoryLog.insertMany([
                {
                    gymId: gym._id,
                    productId: wheyProtein._id,
                    type: "restock",
                    quantityChange: 24,
                    previousQuantity: 0,
                    newQuantity: 24,
                    reason: "Initial Stock",
                    performedBy: staffId
                },
                {
                    gymId: gym._id,
                    productId: preWorkout._id,
                    type: "restock",
                    quantityChange: 15,
                    previousQuantity: 0,
                    newQuantity: 15,
                    reason: "Initial Stock",
                    performedBy: staffId
                },
                {
                    gymId: gym._id,
                    productId: gymTshirt._id,
                    type: "restock",
                    quantityChange: 50,
                    previousQuantity: 0,
                    newQuantity: 50,
                    reason: "Initial Stock",
                    performedBy: staffId
                },
                {
                    gymId: gym._id,
                    productId: gymTowel._id,
                    type: "restock",
                    quantityChange: 100,
                    previousQuantity: 0,
                    newQuantity: 100,
                    reason: "Initial Stock",
                    performedBy: staffId
                }
            ]);

            // 5. Orders (Past Sales)
            console.log("Seeding Orders...");
            
            // Simulating a sale
            const sale1 = await Order.create({
                gymId: gym._id,
                processedBy: staffId,
                items: [
                    {
                        productId: gymTshirt._id,
                        name: gymTshirt.name,
                        quantity: 2,
                        unitPrice: gymTshirt.price,
                        subtotal: gymTshirt.price * 2
                    },
                    {
                        productId: gymTowel._id,
                        name: gymTowel.name,
                        quantity: 1,
                        unitPrice: gymTowel.price,
                        subtotal: gymTowel.price
                    }
                ],
                totalAmount: (gymTshirt.price * 2) + gymTowel.price,
                finalAmount: (gymTshirt.price * 2) + gymTowel.price,
                paymentMethod: "cash",
                status: "completed",
                source: "pos"
            });

            const sale2 = await Order.create({
                gymId: gym._id,
                processedBy: staffId,
                items: [
                    {
                        productId: wheyProtein._id,
                        name: wheyProtein.name,
                        quantity: 1,
                        unitPrice: wheyProtein.discountPrice,
                        subtotal: wheyProtein.discountPrice
                    }
                ],
                totalAmount: wheyProtein.discountPrice,
                finalAmount: wheyProtein.discountPrice,
                paymentMethod: "card",
                status: "completed",
                source: "pos"
            });

            // Simulating the stock deduction for those past sales
            gymTshirt.stockQuantity -= 2;
            await gymTshirt.save();
            await InventoryLog.create({
                gymId: gym._id, productId: gymTshirt._id, type: "sale", quantityChange: -2, previousQuantity: 50, newQuantity: 48, reason: "POS Sale", referenceId: sale1.receiptNumber, performedBy: staffId
            });

            gymTowel.stockQuantity -= 1;
            await gymTowel.save();
            await InventoryLog.create({
                gymId: gym._id, productId: gymTowel._id, type: "sale", quantityChange: -1, previousQuantity: 100, newQuantity: 99, reason: "POS Sale", referenceId: sale1.receiptNumber, performedBy: staffId
            });

            wheyProtein.stockQuantity -= 1;
            await wheyProtein.save();
            await InventoryLog.create({
                gymId: gym._id, productId: wheyProtein._id, type: "sale", quantityChange: -1, previousQuantity: 24, newQuantity: 23, reason: "POS Sale", referenceId: sale2.receiptNumber, performedBy: staffId
            });
        }

        console.log("Seeding process completed successfully for ALL Gyms!");
    } catch (e) {
        console.error("Seeding failed:", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seedSelling();
