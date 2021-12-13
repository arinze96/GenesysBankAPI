const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const UserSchema = new Schema({
  fullname: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 1,
  }
},
{timestamps:true}
);

module.exports = mongoose.model("user", UserSchema);
