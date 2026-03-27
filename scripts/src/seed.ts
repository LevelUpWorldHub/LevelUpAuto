import { db } from "@workspace/db";
import { servicesTable, testimonialsTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  await db.execute(sql`TRUNCATE TABLE testimonials RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE services RESTART IDENTITY CASCADE`);

  await db.insert(servicesTable).values([
    {
      name: "Full Synthetic Oil Change",
      description: "Complete oil change with full synthetic oil, new filter, and 21-point inspection. Keeps your engine running at peak performance.",
      price: "79.99",
      durationMinutes: 30,
      category: "oil-change",
    },
    {
      name: "Conventional Oil Change",
      description: "Standard oil change with conventional oil and new filter. Includes top-off of all fluids and tire pressure check.",
      price: "39.99",
      durationMinutes: 20,
      category: "oil-change",
    },
    {
      name: "Brake Pad Replacement",
      description: "Front or rear brake pad replacement with OEM or high-performance pads. Includes brake inspection and rotor measurement.",
      price: "149.99",
      durationMinutes: 90,
      category: "brakes",
    },
    {
      name: "Brake Rotor & Pad Service",
      description: "Complete brake service including new rotors and pads for front or rear axle. Ensures maximum stopping power.",
      price: "299.99",
      durationMinutes: 120,
      category: "brakes",
    },
    {
      name: "Tire Rotation & Balance",
      description: "Rotate all four tires and balance for even wear and optimal performance. Extends tire life significantly.",
      price: "59.99",
      durationMinutes: 45,
      category: "tires",
    },
    {
      name: "Tire Installation (Set of 4)",
      description: "Mount and balance four new tires. TPMS service included. Proper disposal of old tires.",
      price: "99.99",
      durationMinutes: 60,
      category: "tires",
    },
    {
      name: "Full Diagnostic Scan",
      description: "Complete computer diagnostic of all vehicle systems. Identifies check engine lights, transmission codes, ABS, and more.",
      price: "89.99",
      durationMinutes: 60,
      category: "diagnostics",
    },
    {
      name: "Premium Detail Package",
      description: "Full interior and exterior detail. Hand wash, clay bar, wax, interior deep clean, leather conditioning, and odor treatment.",
      price: "249.99",
      durationMinutes: 240,
      category: "detailing",
    },
    {
      name: "Express Wash & Vacuum",
      description: "Quick exterior wash and interior vacuum. Great for routine maintenance between full details.",
      price: "49.99",
      durationMinutes: 30,
      category: "detailing",
    },
    {
      name: "Transmission Service",
      description: "Transmission fluid flush and filter replacement. Prevents transmission failure and extends transmission life.",
      price: "199.99",
      durationMinutes: 90,
      category: "transmission",
    },
  ]);

  await db.insert(testimonialsTable).values([
    {
      customerName: "Marcus Johnson",
      rating: 5,
      comment: "LevelUpAuto is hands down the best shop in town. Brought my Mustang in for a full diagnostic and they found the issue in under an hour. Fast, honest, and professional.",
      serviceName: "Full Diagnostic Scan",
      createdAt: new Date("2026-01-15"),
    },
    {
      customerName: "Sarah Mitchell",
      rating: 5,
      comment: "I was nervous about my brakes squealing for weeks. The team here made it easy — explained everything, gave me a fair price, and my car feels brand new. Highly recommend!",
      serviceName: "Brake Rotor & Pad Service",
      createdAt: new Date("2026-02-03"),
    },
    {
      customerName: "David Reyes",
      rating: 5,
      comment: "Got the premium detail package for my Range Rover and it looked better than when I drove it off the lot. These guys take real pride in their work.",
      serviceName: "Premium Detail Package",
      createdAt: new Date("2026-02-20"),
    },
    {
      customerName: "Jennifer Park",
      rating: 5,
      comment: "Quick oil change, no upselling, no nonsense. I was in and out in 25 minutes. I've been coming here for 2 years and they've never let me down.",
      serviceName: "Full Synthetic Oil Change",
      createdAt: new Date("2026-03-05"),
    },
    {
      customerName: "Tyler Brooks",
      rating: 4,
      comment: "Transmission service was thorough and reasonably priced. The team kept me updated the whole time. Will definitely be back for future service.",
      serviceName: "Transmission Service",
      createdAt: new Date("2026-03-10"),
    },
    {
      customerName: "Amanda Torres",
      rating: 5,
      comment: "After getting quoted crazy prices at the dealership, I came to LevelUpAuto and saved over $200 on my brake job. Same quality, better service, honest people.",
      serviceName: "Brake Pad Replacement",
      createdAt: new Date("2026-03-18"),
    },
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
