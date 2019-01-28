const mongoose = require('mongoose');
const passport = require('passport');
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');

exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed Login!',
    successRedirect: '/',
    successFlash: 'You are now logged in!'
  });

  exports.logout = (req, res) => {
      req.logout();
      req.flash('success', 'You have been logged out')
      res.redirect('/');
  }

  exports.isLoggedIn = (req, res, next) => {
      if (req.isAuthenticated()){
        next();
        return;
      }

      req.flash('error', 'You must be logged in')
      res.redirect('/login')
  }

  exports.forgot = async(req, res) => {
    const user = await User.findOne({email: req.body.email});

    if (!user){
        req.flash('error', 'No account with that email exists');
        return res.redirect('/login');
    }

    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    // Send them an email with the token, by now return the token

    const resetUrl = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    req.flash('success', `You have been emailed a password reset link. ${resetUrl}`);

    res.redirect('/login');
  }

  exports.reset = async(req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user){
        req.flash("error", 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }

    res.render('reset', {title: 'Reset your password'});
  }

  exports.confirmedPasswords = (req, res, next) => {

    if(req.body.password === req.body['password-confirm']){
        next();
        return;
    }

    console.log('password', req.body.password);
    console.log('password-confirm', req.body['password-confirm']);

    req.flash('error', 'Passwords do not match!');
    res.redirect('back');
  }

  exports.update = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if(!user){
        req.flash("error", 'Password reset is invalid or has expired');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    const updateUser = await user.save();

    await req.login(updateUser);
    req.flash('success', 'Your password has been reset');
    res.redirect('/');
  }