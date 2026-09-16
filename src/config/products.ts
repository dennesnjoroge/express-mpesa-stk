export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: "KES";
  stock: number;
}

export const products = [
  {
    id: 1,
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with USB receiver",
    price: 1500,
    currency: "KES",
    stock: 25,
  },
  {
    id: 2,
    name: "USB-C Fast Charger",
    description: "25W USB-C fast wall charger",
    price: 2200,
    currency: "KES",
    stock: 18,
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    description: "Portable Bluetooth speaker with 10-hour battery",
    price: 3500,
    currency: "KES",
    stock: 12,
  },
  {
    id: 4,
    name: "Wireless Keyboard",
    description: "Compact wireless keyboard for desktop and mobile use",
    price: 2800,
    currency: "KES",
    stock: 20,
  },
  {
    id: 5,
    name: "USB-C Cable",
    description: "1.5m USB-C charging and data cable",
    price: 800,
    currency: "KES",
    stock: 50,
  },
  {
    id: 6,
    name: "Power Bank 10,000mAh",
    description: "10,000mAh portable power bank with USB-C input",
    price: 3200,
    currency: "KES",
    stock: 15,
  },
  {
    id: 7,
    name: "Laptop Stand",
    description: "Adjustable aluminum laptop stand",
    price: 4500,
    currency: "KES",
    stock: 10,
  },
  {
    id: 8,
    name: "HDMI Cable",
    description: "High-speed HDMI cable for 4K displays",
    price: 1200,
    currency: "KES",
    stock: 30,
  },
  {
    id: 9,
    name: "Webcam",
    description: "1080p USB webcam with built-in microphone",
    price: 5500,
    currency: "KES",
    stock: 8,
  },
  {
    id: 10,
    name: "USB Flash Drive 64GB",
    description: "64GB USB 3.0 flash drive",
    price: 1800,
    currency: "KES",
    stock: 35,
  },
];
