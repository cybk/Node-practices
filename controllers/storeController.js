const mongoose = require('mongoose');
const Store = mongoose.model('Store');


exports.myMiddleware = (req, res, next) => {
    req.name = 'wes';
    next();
};

exports.homePage = (req, res) => {
    
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.createStore =  async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
};