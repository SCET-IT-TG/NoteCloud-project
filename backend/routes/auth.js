const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = "nehaisagoodgirl"

//Route 1 : Create a user using:POST "/api/auth/createUser". Login not required

router.post('/createUser', [
   body('email', "Enter a valid Email").isEmail(),
   body('name', "Enter a valid name").isLength({ min: 3 }),
   body('password', "Password must be atleast 5 characters").isLength({ min: 5 }),
], 
   async (req, res) => {

   let success=false;
   //If there are errors,return bad request and  the errors
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({success,errors: errors.array() });
   }

   try {
   //Check whether the user with this email exists already
   let user = await User.findOne({ email: req.body.email });
   if (user) {
      return res.status(400).json({success, error: "Sorry a user with this email already exists" })
   }

   const salt = await bcrypt.genSalt(10);
   const secPass = await bcrypt.hash(req.body.password,salt)
      //create a new user
      user = await User.create({
         name: req.body.name,
         password: secPass,
         email: req.body.email,
      });
      const data ={
         user:{
            id:user.id
         }
      }
      const authtoken = jwt.sign(data,JWT_SECRET);
     
      // .then(user => res.json(user))
      // .catch(err=>{console.log(err)
      // res.json({error:"Please enter a unique value",message : err.message})})
      // res.json(user)
      let success=true;
      res.json({success,authtoken})

   }
   catch (error) {
      console.error(error.message)
      res.status(500).send("Some error occured")
   }

})

//Route 2 : Authenticate a user using:POST "/api/auth/login". Login not required

router.post('/login', [
   body('email', "Enter a valid Email").isEmail(),
   body('password', "Password cannot be blank").exists(),
], async (req, res) => {
   let success=false;
   //If there are errors,return bad request and  the errors
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }

   const {email,password} = req.body;
   try {
      let user= await User.findOne({email});
      if(!user){
         success=false;
         return res.status(400).json({error:"Please try to login using correct credentials"})
      }

      const passwordCompare = await bcrypt.compare(password,user.password);
      if(!passwordCompare){
         success=false;
         return res.status(400).json({success , error:"Please try to login using correct password"})
      }

      const data = {
         user:{
            id:user.id
         }  
      }
      
      var authtoken = jwt.sign(data,JWT_SECRET);
      success=true;
      res.json({success,authtoken})

   } catch (error) {
      console.error(error.message)
      res.status(500).send("Internal Server Error");
   }

});

//Route 3 : Get loggedin User details using :POST "/api/auth/getuser". Login required
router.post('/getuser',fetchuser, async (req, res) => {

try {
   const userId = req.user.id;
   const user = await User.findById(userId).select("-password")
   res.send(user)
} catch (error) {
   console.error(error.message)
   res.status(500).send("Internal Server Error");
}
})

module.exports = router