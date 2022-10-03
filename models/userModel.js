const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs');

const crypto = require('crypto');

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name!'],
  },
  email: {
    type: String,
    required: [true, 'A user must have an email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  photo: { type: String, default: 'default.jpg' },
  password: {
    type: String,
    required: [true, 'A user must have a password!'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      // This is only works on User.create() or User.save(), but not on find(), findOne() or update()...
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not the same!',
    },
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// encryption : with pre('save') mongoose document middleware
// encryption to be executed before the moment we received the data, and the moment its actually persisted in db
userSchema.pre('save', async function (next) {
  // only run this function if password modified
  if (!this.isModified('password')) return next(); // if the password has not been modified, continue and jump to next middleware

  // hashing (encrypting) : protect against bruteforce attacks (very standard algorithm)
  // for this we use npm i bcryptjs
  this.password = await bcrypt.hash(this.password, 12); // this returns a promise, so need to await (in that version, but it also exists a sync version of .hash())

  // delete passwordConfirm (won't appear in db)
  this.passwordConfirm = undefined; // we don't need to persist this, we just need this once

  next();
});

// this middleware runs before any document save in the db
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // function (next) because we want to have access to this keyword
  // pre(/^find/) remember, this middleware 'pre' hook applies to any method starting with find*...
  // this is pointing to current query
  this.find({ active: { $ne: false } });
  next();
});

// instance method available on all documents of a certain collection
// check if password is the same as the one stored in the db
// returns true of candidatePw and userPw are the same, false otherwise
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  //this.password; // not possible because password select=false by default in userSchema... that's why we need to add userpassword aswell in params
  return await bcrypt.compare(candidatePassword, userPassword); // candidatePassword is not hashed, but userPassword is...
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // means changed
    return JWTTimestamp < changedTimestamp;
  }
  // means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // generated token to send to the user (so that he can reset his password)
  // only this user can access this password
  // never to be stored in db
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
