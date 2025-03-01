const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const auctionItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
},
  description: {
    type: String,
    required: true
},
  currentBid: {
    type: Number,
    required: true
},
  highestBidder: {
    type: String,
    default: ""
},
  closingTime: {
    type: Date,
    required: true
},
  isClosed: {
    type: Boolean,
    default: false }
});

const AuctionItem = mongoose.model("AuctionItem", auctionItemSchema);
module.exports = AuctionItem;
