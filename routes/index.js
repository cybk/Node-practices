const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
  const wes = {name: 'Wes', age: 100, cool: true};
  //res.send('Hey! It works!');
  //res.json(wes);
  //res.json(req.query);
  res.render('hello', {
    name: 'Wes',
    dog: req.query.dog || 'Snickers',
    title: 'I love food'
  } );
});

router.get('/reverse/:name',  (req, res) => {
  const reverse = [...req.params.name].reverse().join('');
  console.log([...req.params.name].reverse());
  res.send(reverse);
});

module.exports = router;
