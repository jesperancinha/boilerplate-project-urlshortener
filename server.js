'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var parser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

app.use(parser.urlencoded({extended: false}));

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, { useNewUrlParser: true });

let Schema = mongoose.Schema;
let UrlSchema = new Schema({
  url: String,
  short: Number
});
let Url = mongoose.model('Url', UrlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

app.get("/api/shorturl/:short", function (req, res) {
  let short = req.params.short;
  Url.findOne({short: short}, (err, data)=>{
    if(err){
      res.json({"error":"No short url found for given input"});
    } else if(!data){
      res.json({"error":"No short url found for given input"});
    } else {
      res.redirect(data.url);
    }
  });           
});

app.post("/api/shorturl/new", function (req, res) {
  let url = req.body.url;
  if(/^http[s]*:\/\/w{3}\.\w+\.\w+(\/[a-z]+)*$/.test(url)){
  Url.find({})
      .sort('-short')
      .limit(1)
      .exec((err, higher) => { 
      var urlObject;
      if(err || higher.length === 0){
        urlObject = new Url({ url: url, short: 1});
      } else {
        urlObject = new Url({ url: url, short: higher[0].short + 1});
      }

     Url.findOneAndUpdate(
        {url: url},
        {$setOnInsert: urlObject},
        { upsert: true, new: true, runValidators: true },
      (err, data)=>{
            res.json(data);
      });
  
  });
  }else{
    res.json({"error":"invalid URL"});
  }
});
