const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
  transaction_type: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  account_number: {
    type: Number,
    required: true,
  }
},
{timestamps:true});

module.exports = mongoose.model("Transaction", TransactionSchema);
