const express = require("express");
const app = express();

const mongojs = require("mongojs");
const db = mongojs("travel", ["records"]);

const bodyParser= require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const {
     body,
     param,
     validationResult
} = require("express-validator");
const { response } = require("har-validator");

//let's query records from database with sorting, filter and paging features
app.get("/api/travel-records", function(req, res){

     const options = req.query;

     const sort = options.sort || {};
     const filter = options.filter || {};
     const limit = 10;
     const page = parseInt(options.page) || 1;
     const skip = (page - 1) * 10;

     for ( i in sort){
          sort[i] = parseInt(sort[i]);
     };

     db.records.find(filter).sort(sort).skip(skip).limit(limit, function(err, data){
          if(err){
               return res.sendStatus(500);
          } else {
               return res.status(200).json({
                    meta: {
                         skip, limit, sort, filter, page,
                         total: data.length,
                    },
                    data,
                    links: {
                         self: req.originalUrl,
                    }
               });
          }
     });
});

//ok, let's try inserting new records to database with some validations
app.post("/api/travel-records", [
     body("name").not().isEmpty(),
     body("from").not().isEmpty(),
     body("to").not().isEmpty(),
], function(req, res){
     const errors = validationResult(req);
     if(!errors.isEmpty()){
          return res.status(400).json({ errors: errors.array() });
     }
     db.records.insert(req.body, function(err, data){
          if(err){
               return res.status(500);
          }
          const _id = data._id;
          res.append("Location", "/api/travel-records/" + _id);
          return res.status(201).json({
               meta: {_id},
               data
          });
     });
});


//records editing functions

//update datas with put method
app.put("/api/travel-records/:id", [
          param("id").isMongoId(),
     ], function(req, res) {
          const _id = req.params.id;
          const errors = validationResult(req);

          if (!errors.isEmpty()) {
               return res.status(400).json({ errors: errors.array() });
          }

          db.records.count({
               _id: mongojs.ObjectId(_id)
          }, function(err, count) {
               if(count) {
                    const record = {
                         _id: mongojs.ObjectId(_id),
                         ...req.body
                    };

                    db.records.save(record, function(err, data) {
                                   return res.status(200).json({
                                        meta: { _id },
                                        data
                                   });
                               });
               } else{
                    db.records.save(req.body, function(err, data) {
                         return res.status(201).json({
                              meta: { _id: data._id },
                              data
                         });
                    });
               }
          });
});

//let's update only parts of data with patch method
app.patch("/api/travel-records/:id", function(req, res) {
     const _id = req.params.id;

     db.records.count({
          _id: mongojs.ObjectId(_id)
     }, function(err, count){
          if(count){
               db.records.update(
                    { _id: mongojs.ObjectId(_id) },
                    { $set: req.body },
                    { multi: false },
                    function(err, data){
                         db.records.find({
                              _id : mongojs.ObjectId(_id)
                         }, function(err, data){
                              return res.status(200).json({
                                   meta: { _id }, data
                              });
                         });
                    }
               )
          } else {
               return res.sendStatus(404);
          }
     });
});

//server
app.listen(8000, function(){
     console.log("Server running at port 8000");
});