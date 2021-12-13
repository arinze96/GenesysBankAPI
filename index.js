const express = require("express");
const morgan = require("morgan");
require('dotenv').config()
const jwt = require("jsonwebtoken");
// const bcrypt = require("bcrypt")
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET_KEY = "gop4u5t9g309tuf94tufg2t92u42urf2r";

const Admin = require("./models/Admin");
const VerifyToken = require("./middlewares/adminAuthetication");
const UserVerifyToken = require("./middlewares/userAuthentication");
const User = require("./models/User");
const BankAccount = require('./models/bankAccount')
// const auth = require("./middlewares/auth")

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup MongoDB config
const mongoose = require("mongoose");
const MONGODB_URI = "mongodb://localhost:27017/bankAPI";

app.get("/", (req, res) => {
  res.status(200).send("Hello world!");
});

// THIS ENDPOINT IS USED TO CREATE PERSONS THAT HAVE ADMIN STATUS (WHICH MEANS THEY CAN CREATE, DELETE, EDIT USERS)
app.post("/create_admin", async (req, res) => {
  const data = req.body;

  try {
    const admin = await new Admin({
      fullname: data.fullname,
      email: data.email,
      password: data.password,
      admin: true,
    }).save();

    const token = jwt.sign({ admin_id: admin._id }, JWT_SECRET_KEY, {
      expiresIn: 60 * 1000,
    });

    res.status(201).send({
      message: "Admin Created",
      data: {
        token,
        email: admin.email,
        fullname: admin.fullname,
      },
    });
  } catch (error) {
    res
      .status(400)
      .send({ message: "Admin account could no be Created", data: error });
  }
});

app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email }).exec();
    if (!admin.email) {
      throw new Error("Invalid Login Details");
    }
    if (admin.password != password) {
      throw new Error("Invalid Login Details");
    }
    //signing token with user id
    var token = jwt.sign({ id: admin._id },JWT_SECRET_KEY, {
      expiresIn: 86400,
    });
    res.status(200).send({
      admin: {
        id: admin._id,
        email: admin.email,
        fullname: admin.fullname
      },
      message: "Login successfull",
      accessToken: token,
    });
  } catch (error) {
   res.status(401).send({message:error.message,status:false});
  }

});

app.post("/add-user", VerifyToken ,async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    const user = await new User({ 
      fullname: data.fullname,
      email: data.email,
      password: data.password
    })
    
    user.save( async function(err){
        if(err){
            return console.error(err.stack);
            
        }else{
            const bankAccount = await new BankAccount({
                user:user._id
            }).save();
            console.log('bank account is also created');
        }
    });

    const token = jwt.sign({ user_id: user._id }, JWT_SECRET_KEY);

    res.status(201).send({
      message: "User Created",
      data: {
        token,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    res
      .status(400)
      .send({ message: "User account could no be Created", data: error });
  }
});

app.delete("/admin-delete-user", VerifyToken, async(req, res) =>{

})

app.delete("/admin-delete-user/:user_id", VerifyToken, async (req, res) => {
    try {
        console.log(req.params.user_id);
        if (!req.admin){
            return res.status(403).send({ message: "You can't delete this user" })
        }
      const userToBeDeleted = await User.findOne({ _id: req.params.user_id })
      console.log(userToBeDeleted, 'this is remove');
      const user = await User.findByIdAndDelete(req.params.user_id)
    //   const bankAccount = await BankAccount.findByIdAndDelete(req.params.user_id)
      res.status(200).send({ message: "User deleted", data: {user} })
    } catch (error) {
        res.status(401).send({message:error.message,status:false});
    }
  });
  


  app.patch("/admin-disable-user-account/:user_id", VerifyToken, async (req, res) => {
    const data = req.body
    const user_id = req.params.user_id;
    try {
    //   const user = await User.findById(user_id)
    const userToBeUpdated = await User.findOne({ _id: req.params.user_id })
    //   console.log(user);
      if (!userToBeUpdated){
          return res.status(400).send({ message: "User profile does not exist" })
      } 
      const updatedUser = await User.findByIdAndUpdate(
        user_id,
        { $set: { account_status: data.account_status } },
        { new: true }
      )
      res.status(200).send({ message: "Updated user profile", data: updatedUser })
    } catch (error) {
        res.status(401).send({message:error.message,status:false});
    }
  }
  )

app.post("/user-login", UserVerifyToken, async (req, res) => {
    const data = req.body;
    try {
      const user = await User.findOne({ email: data.email }).exec();
      console.log(user)
      if (!user.email) {
        throw new Error("Invalid Login Details");
      }
      if (user.password != data.password) {
        throw new Error("Invalid Login Details");
      }
      //signing token with user id
      var token = jwt.sign({ id: user._id },JWT_SECRET_KEY, {
        expiresIn: 86400,
      });
      res.status(200).send({
        user: {
          id: user._id,
          email: user.email,
          fullname: user.fullname
        },
        message: "Login successfull",
        accessToken: token,
      });
    } catch (error) {
     res.status(401).send({message:error.message,status:true});
    }
  
  });

app.listen(port, async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(":::> Connected to MongoDB database");
  } catch (error) {
    console.log("<::: Couldn't connect to database ", error);
  }

  console.log(`:::> listening on http://localhost:${port}`);
});
