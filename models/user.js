const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const uniqueValidator = require("mongoose-unique-validator");
const findOrCreate = require('mongoose-findorcreate')

const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  username: { type: String, unique: true },
  passwordHash: { type: String },
  googleId: { type: String},
  googleProfile: { type: Object },
  googleAccessToken: {type: String}
});

UserSchema.index({username: 1});
UserSchema.plugin(uniqueValidator);
UserSchema.plugin(findOrCreate);

//boolean for pet sitter or not 
//chnages ejs pages to see different pages 
//change content based on user type 
//


//check the password against the saved salted hash
UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

// save a salted hash of the password
UserSchema.virtual("password").set(function(value) {
  this.passwordHash = bcrypt.hashSync(value, 12);
});

const User = mongoose.model("User", UserSchema);
module.exports = User;