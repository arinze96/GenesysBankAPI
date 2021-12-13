const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("./User");

const BankAccountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: User,
    },
    account_number: {
      type: Number,
      default: Math.floor(Math.random() * 10000000000) + 1,
    },
    total_account_balance: {
      type: Number,
      default: 0,
    },
    withdrawal_balance: {
      type: Number,
      default: 0,
    },
    deposit_balance: {
      type: Number,
      default: 0,
    },
    account_status: {
      type: String,
      default: 'active',
    },
    created_at: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("bankAccount", BankAccountSchema);
