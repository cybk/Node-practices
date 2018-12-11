const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
// Routing for stores
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.post('/add', storeController.upload,
         catchErrors(storeController.resize),
          catchErrors(storeController.createStore));
router.post('/add/:id', storeController.upload,
        catchErrors(storeController.resize),
        catchErrors(storeController.updateStore));

// routing for tags
router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

//routing for users
router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

// 1 validate registration data
// 2 register the user
// 3 we need to log them in
router.post('/register', 
        userController.validateRegister,
        catchErrors(userController.register),
        authController.login);

module.exports = router;
