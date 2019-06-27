const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
    req.body.author = req.updateStore._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // query database for all stores
    const page = req.params.page || 1;
    const limit = 4;
    const skip = (page * limit) - limit;

    const storePromise = Store
        .find()
        .skip(skip)
        .limit(limit)
        .sort({created: 'desc'});

    const countProm = Store.count();
    const [stores, count] = await Promise.all([storePromise, countProm]);
    const pages = Math.ceil(count/limit);

    if(!stores.length && skip){
        req.flash('info', `Hey you asked for page ${page}, but that doesn't exist, so I put you on page ${pages}`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }
    
    res.render('stores', { title: 'Stores', stores, page, pages, count });
}

const confirmOwner = (store, user) => {
    if (!store.author || !store.author.equals(user._id)){
        throw Error('You must own a store in order to edit it!');
    }
}

exports.editStore = async (req, res) => {
    // find store by ID
    const store = await Store.findOne({_id: req.params.id});
    // confirm they are owner of store
    confirmOwner(store, req.user);
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
    const store = await Store.findOne({slug: req.params.slug}).populate('author reviews');
    if(!store){
        next();
        return;
    }

    res.render('store', { titel: store.name, store});
}

exports.getStoresByTag = async(req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };

    const tagsPromise = Store.getTagsList();
    const storePromise = Store.find({ tags: tagQuery });
    const [tags, stores] = await Promise.all([tagsPromise, storePromise]);
    res.render('tags', {title: 'Tags', tags, tag, stores})
}

exports.searchStores = async (req, res) => {
    console.log(req.query);
    const stores = await Store.find({
        $text: {
            $search: req.query.q
        } 
    },{
        score: {
            $meta: 'textScore'
        }
    })
    .sort({
        score: {$meta: 'textScore'}
    })
    .limit(5);
    // limit only return 5 items
    res.json(stores);
}

exports.mapStores = async(req, res) => {
     const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
     const q = {
             location: {
                 $near: {
                     $geometry: {
                         type: 'Point',
                         coordinates
                     },
                
                     $maxDistance: 10000
                 }
             }
     }

     const stores = await Store.find(q).select('slug name description location photo');
     res.json(stores);
}

exports.mapPage =  async (req, res) => {
    res.render('map', {title: 'Map'});
}

exports.heartStore = async (req, res) => {
    const hearts = req.user.hearts.map(obj => obj.toString());
    const operator = hearts.includes(req.params.id) ? '$pull':'$addToSet';
    const user = await User
        .findByIdAndUpdate(req.user.id,
             {[operator]: {hearts: req.params.id}},
             { new: true}
             );
    res.json(user);
}

exports.getHearts = async (req, res) => {
    const stores = await Store.find({
        _id: {$in: req.user.hearts}
    });

    res.render('stores', {title: 'Hearted Stores', stores})
}

exports.getTopStores = async(req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', {stores, title: '★ Top Stores!'});
}