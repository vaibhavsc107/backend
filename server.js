// Import modules
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("./models/db");
const authenticate = require("./middleware/Authentication"); // Check if this path is correct

// Import Models
const User = require("./models/User");
const AuctionItem = require("./models/AuctionItem");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";


// ✅ Utility function for error handling
const handleError = (res, message, status = 500) => {
  console.error(`❌ Error: ${message}`);
  res.status(status).json({ message });
};

// ✅ Registration API
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) return handleError(res, "All fields are required!", 400);

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return handleError(res, "Email already in use", 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    await user.save();
    res.json({ message: "✅ User Registered Successfully!" });
  } catch (err) {
    handleError(res, "Server error", 500);
  }
});

// ✅ Login API with JWT Authentication
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return handleError(res, "Email and password are required", 400);

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return handleError(res, "Invalid credentials", 400);
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, {
      expiresIn: "2h",
    });

    res.json({ message: "✅ Login successful", token, username: user.username });
  } catch (err) {
    handleError(res, "Server error", 500);
  }
});

// ✅ Create Auction Item (Protected)
app.post("/auction", authenticate, async (req, res) => {
  const { itemName, description, startingBid, closingTime } = req.body;

  if (!itemName || !description || !startingBid || !closingTime) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newItem = new AuctionItem({
      itemName,
      description,
      currentBid: startingBid,
      highestBidder: null,
      closingTime,
      isClosed: false,
    });

    await newItem.save();
    res.status(201).json({ message: "Auction item created", item: newItem });
  } catch (error) {
    console.error("Auction Post Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get all auction items
app.get("/auctions", async (req, res) => {
  try {
    const auctions = await AuctionItem.find();
    res.json(auctions);
  } catch (error) {
    console.error("Fetching Auctions Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get a single auction item by ID
app.get("/auctions/:id", async (req, res) => {
  try {
    const auctionItem = await AuctionItem.findById(req.params.id);
    if (!auctionItem) return res.status(404).json({ message: "Auction not found" });

    res.json(auctionItem);
  } catch (error) {
    console.error("Fetching Auction Item Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Bidding on an item (Protected)
app.post("/bid/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { bid } = req.body;

  try {
    const item = await AuctionItem.findById(id);
    if (!item) return res.status(404).json({ message: "Auction item not found" });

    if (item.isClosed || new Date() > new Date(item.closingTime)) {
      item.isClosed = true;
      await item.save();
      return res.status(400).json({ message: "Auction is closed", winner: item.highestBidder });
    }

    if (bid <= item.currentBid) return res.status(400).json({ message: "Bid must be higher" });

    item.currentBid = bid;
    item.highestBidder = req.user.username;
    await item.save();

    res.json({ message: "Bid successful", item });
  } catch (error) {
    console.error("Bidding Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
