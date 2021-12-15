const express = require("express");
const morgan = require("morgan");
require('dotenv').config()
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET_KEY = "gop4u5t9g309tuf94tufg2t92u42urf2r";

const Admin = require("./models/Admin");
const VerifyToken = require("./middlewares/adminAuthetication");
const UserVerifyToken = require("./middlewares/userAuthentication");
const User = require("./models/User");
const BankAccount = require('./models/bankAccount')
const Transactions = require('./models/transaction')

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

//THIS ENDPOINT FIRES FOR AN ADMIN TO LOGIN AND PERFORM ADMINISTRATIVE ACTIVITIES
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

//THIS ENDPOINT FIRES WHEN AN ADMIN WANTS TO ADD A USER
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

    res.status(201).send({
      message: "User Created",
      data: {
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

//THIS ENDPOINT FIRES WHEN AN ADMIN WANTS TO DELETE A USER
app.delete("/admin-delete-user/:user_id", VerifyToken, async (req, res) => {
    try {
        if (!req.admin){
            return res.status(403).send({ message: "You can't delete this user" })
        }
      const userToBeDeleted = await User.findOne({ _id: req.params.user_id })
      console.log(userToBeDeleted, 'this is remove');
      const user = await User.findByIdAndDelete(req.params.user_id)
      res.status(200).send({ message: "User deleted", data: {user} })
    } catch (error) {
        res.status(401).send({message:error.message,status:false});
    }
  });
  
// THIS ENDPOINT FIRES WHEN ADMIN WANT TO DISABLE OR ACTIVATE A USER
app.post("/admin-change-status", VerifyToken, async (req, res) => {
    const { user_id , status  } = req.body
    try {
       const account = await BankAccount.findOneAndUpdate({ user: user_id }, {account_status : (status) ?  'active' : 'disabled' },{new : true})
      if (account.account_status){
          return res.status(400).send({ message: `User account ${(status) ?  'activated' : 'disabled'}` })
      }
    } catch (error) {
        res.status(401).send({message:'Account status failed to change',status:false});

    }
  }
  )

// THIS ENDPOINT FIRES WHEN A USER WANTS TO LOGIN
app.post("/user-login", async (req, res) => {
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

//THIS ENPOINT FIRES WHEN A USER WANTS TO DEPOSIT MONEY TO AN ACCOUNT
  app.post("/deposit",UserVerifyToken, async (req,res)=> {
      const {user} = req;
      const data = req.body;
      try{
        const account = await BankAccount.findOneAndUpdate({user : user._id }, {$inc :  { total_account_balance : data.amount  }});
        const transaction = await new Transaction({
          transaction_type: 'deposit',
          amount: data.amount,
          account_number: data.account_number
        }).save();
        if(account.account_status){
          res.status(200).send({message:`User successfully deposited ${data.amount}`,status:true});
        }
      }catch(error){
        res.status(401).send({message:`Sorry  deposit of ${data.amount} failed `,status:false});
      }
  })

//THIS ENPOINT FIRES WHEN A USER WANTS TO WITHDRAW FUNDS FROM HIS/HER ACCOUNT
  app.post("/withdraw",UserVerifyToken, async (req,res)=> {
    const {user} = req;
    const {amount} = req.body;
    try{
      const account = await BankAccount.findOneAndUpdate({user : user._id }, {$inc :  { total_account_balance : -amount  }});
      if(account.account_status){
        res.status(200).send({message:`User successfully withdrew ${amount}`,status:true});
      }
    }catch(error){
      res.status(401).send({message:`Sorry  withdrawal of ${amount} failed `,status:false});
    }
})


// THIS ENPOINT FIRES WHEN A USER WANTS TO TRRANSFER FUNDS TO ANOTHER ACCOUNT
app.post("/transfer",UserVerifyToken, async (req,res)=> {
  const {user} = req;
  const {amount , account_number} = req.body;
  try{
    let account  = await BankAccount.findOne( { user : user._id });
    if(account.total_account_balance  < amount){
      throw new Error(`Insufficient fund`);
    }
     account = await BankAccount.findOneAndUpdate({user  : user._id }, {$inc :  { total_account_balance : -amount  }} ); // deduct from sender
     await BankAccount.findOneAndUpdate({account_number : account_number }, {$inc :  { total_account_balance : amount  }}); // add t reciever
    if(account.account_status){
      res.status(200).send({message:`Transfer of ${amount} to ${account_number} was successfull `,status:true});
    }
  }catch(error){
    res.status(401).send({message:(error.message) ? error.message : `Sorry  transfer of ${amount} failed `,status:false});
  }
})

app.listen(port, async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(":::> Connected to MongoDB database");
  } catch (error) {
    console.log("<::: Couldn't connect to database ", error);
  }

  console.log(`:::> listening on http://localhost:${port}`);
});
