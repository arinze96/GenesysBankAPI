const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET_KEY = "gop4u5t9g309tuf94tufg2t92u42urf2r";

const userVerifyToken = async (req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
         const decode = await jwt.verify(req.headers.authorization.split(' ')[1],JWT_SECRET_KEY);
        //  console.log(decode);
         try {
            const user = await User.findOne({ _id : decode.id }).exec();
            // console.log(user)
            if (!user.email) {
              throw new Error("Not Authorized");
            }
            req.user = user;
            next();
          } catch (error) {
           res.status(401).send({message:error.message,status:true});
          }
    } else {
      req.user = undefined;
      res.status(401).send({message:'not authorized',status:false});
    }
  };
  module.exports = userVerifyToken;
