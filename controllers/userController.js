const mongoose = require('mongoose');

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