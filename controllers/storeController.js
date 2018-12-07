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

exports.getStores = async (req, res) => {
    // query database for all stores
    const stores = await Store.find();
    
    res.render('stores', { title: 'Stores', stores });
}

exports.editStore = async (req, res) => {
    // find store by ID
    const store = await Store.findOne({_id: req.params.id});
    // confirm they are owner of store
    //Todo
    // render out the edit form
    res.render('editStore', {title: `Edit ${store.name}`, store});
}

exports.updateStore = async (req, res) => {
    // find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, { 
        new: true, // returns the updated item
        runValidators: true
    }).exec();

    // redirect to the store and display message

    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
}