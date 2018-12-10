const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter: (req, file, next) => {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto){
            next(null, true);
        }else{
            next({message: 'That filetype isn\'t allowed'}, false);
        }
    }
}


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

    req.body.location.type = 'Point';
    // find and update the store
    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, { 
        new: true, // returns the updated item
        runValidators: true
    }).exec();

    // redirect to the store and display message

    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is a new file
    if (!req.file){
        next();
        return;
    }

    const fileType = req.file.mimetype.split('/')[1];
    
    req.body.photo = `${uuid.v4()}.${fileType}`;
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);

    await photo.write(`./public/uploads/${req.body.photo}`);

    // now can continue
    next();

}

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({slug: req.params.slug});
    if(!store){
        next();
        return;
    }

    res.render('store', { titel: store.name, store});
}

exports.getStoresByTag = async(req, res) => {
    const tags = await Store.getTagsList();
    const tag = req.params.tag;
    res.render('tags', {title: 'Tags', tags, tag})
}