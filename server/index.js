require('dotenv').config()
var massive = require('massive');

const IgImport = require('./ig');

const express = require('express');

const app = module.exports = express();

const {CONNECTION} = process.env;

massive(CONNECTION)
.then( db => {
  app.set('db', db);

  const Ig = new IgImport.Ig();
  Ig.start();

  app.listen(8080, () => {
    console.log('yooo')
  })
}).catch((err) => {
  console.log(err)
})


