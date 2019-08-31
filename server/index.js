require('dotenv').config()
const massive = require('massive');
const express = require('express');

const IgImport = require('./ig');

const app = module.exports = express();
const {CONNECTION} = process.env;

massive(CONNECTION)
.then( db => {
  app.set('db', db);

  const Ig = new IgImport.Ig();
  Ig.start(app);

  app.listen(8080, () => {
    console.log('yooo')
  })
}).catch((err) => {
  console.log(err)
})


