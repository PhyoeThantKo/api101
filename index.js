const express = require("express");
const app = express();

const mongojs = require("mongojs");
const db = mongojs("travel", ["record"]);

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

//server
app.listen(8000, function(){
     console.log("Server running at port 8000");
});