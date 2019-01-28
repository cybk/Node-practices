const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', {title: 'Login Form'});
}

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register User'});
}

exports.validateRegister = (req, res, next) => {
    console.log('gotcha!')
    req.sanitizeBody('name');
    req.checkBody('name', 'You must supply a name!').notEmpty();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    });
    req.checkBody('email', 'The email is not valid').isEmail();
    req.checkBody('password', 'Password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
    req.checkBody('password-confirm', 'Password and confirmation do not match').equals(req.body.password);

    const errors = req.validationErrors();
    if (errors){
        req.flash('error', errors.map(err => err.msg));
        res.render('register', {title: 'Register', body: req.body, flashes: req.flash()});
        return;
    }

    next();
}

exports.register = async (req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name });
    const registerPromise = promisify(User.register, User);
    await registerPromise(user, req.body.password);
    next();
}

exports.account = (req, res) => {
    res.render('account', {title: 'Edit Your Account!'});
}

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email   
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set:updates },
        { new:true, runValidators: true, context: 'query'}
    );

    req.flash('Success', 'Updated the profile!');
        
    res.redirect('back');
}