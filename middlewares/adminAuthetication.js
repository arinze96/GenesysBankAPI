const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const JWT_SECRET_KEY = "gop4u5t9g309tuf94tufg2t92u42urf2r";

const verifyToken = async (req, res, next) => {
    if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
         const decode = await jwt.verify(req.headers.authorization.split(' ')[1],JWT_SECRET_KEY);
        //  console.log(decode);
         try {
            const admin = await Admin.findOne({ _id : decode.admin_id }).exec();
            // console.log(admin);
            if (!admin.email) {
              throw new Error("Not Authorized");
            }
            req.admin = admin;
            next();
          } catch (error) {
           res.status(401).send({message:error.message,status:false});
          }
    } else {
      req.admin = undefined;
      res.status(401).send({message:'not authorized',status:false});
    }
  };
  module.exports = verifyToken;



