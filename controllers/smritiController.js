var AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const { response } = require('express');
const checkAuth = require('./middleware/checkauth');
const FindByToken = require('./middleware/FindByToken');
var credi = false;
var credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = function(app){
  app.get('/home', FindByToken,function(req,res){
    res.render('smriti',{user: req.user});     
  });
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.post('/result',FindByToken,function(req,res){
      
  var response1 = {  
      inn_time:req.body.CheckINN,  
      out_time:req.body.CheckOUT,
      type:req.body.room
  };  
  console.log(response1);
  var d = new Date(response1.inn_time);
  var x = new Date(response1.out_time);
  var y = new Date();
  console.log(y);
  if(x<d||d<y||x<y)
  {
    //console.log(user);
    credi=true;
    res.render('smriti',{user: req.user});
    credi=false;
  }
  else if(response1.type==="all")
  {
    var vec = [];
     var params={
      TableName: "Hotel_smriti_management_database"
     }
     console.log("Scanning Movies table.");
     docClient.scan(params, onScan);
     function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          // print all the movies
          console.log("Scan succeeded.");
          data.Items.forEach(function(item) {
            var inn_time = item.entry_time;
            var out_time = item.exit_time;
            var l = inn_time.length;
            var i=0;
            var select = true;
            for(i=0;i<l;i++)
            {
                var x1 = new Date(response1.inn_time);
                var y1 = new Date(response1.out_time);
                inn_time[i]=new Date(inn_time[i]);
                out_time[i]=new Date(out_time[i]);
                if((x1>=inn_time[i]&&x1<=out_time[i])||(y1>=inn_time[i]&&y1<=out_time[i]))
                {
                    select = false;
                    break;
                }
            }
            if(select===true)
            {
              vec.push(item);
            }
                
          });
          if (typeof data.LastEvaluatedKey != "undefined") {
              console.log("Scanning for more...");
              params.ExclusiveStartKey = data.LastEvaluatedKey;
              docClient.scan(params, onScan);
          }
          res.render('results',{list:vec,user:req.user,room:response1.type,entry:response1.inn_time,exit:response1.out_time});
      }
     }
  }
  else
  {  
    var vec = []; 
    var params = {
      TableName: "Hotel_smriti_management_database",
      IndexName: "Room_type-index",
      KeyConditionExpression: "Room_type = :type",
      ExpressionAttributeValues: {
          ":type": response1.type
      }
  }
    docClient.query(params, function(err,data){
      if(err){
          console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
      }
      else{
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
            //console.log(item);
              var inn_time = item.entry_time;
              var out_time = item.exit_time;
              var l = inn_time.length;
              var i=0;
              //console.log(l,out_time,inn_time);
              var select = true;
              for(i=0;i<l;i++)
              {
                  var x1 = new Date(response1.inn_time);
                  var y1 = new Date(response1.out_time);
                  inn_time[i]=new Date(inn_time[i]);
                  out_time[i]=new Date(out_time[i]);
                  //console.log((x1>=inn_time[i]));
                  if((x1>=inn_time[i]&&x1<=out_time[i])||(y1>=inn_time[i]&&y1<=out_time[i]))
                  {
                      select = false;
                      break;
                  }
              }
              if(select===true)
              {
                 //console.log(item);
                 vec.push(item);
              }
          })
          //console.log(req.user);
          console.log(response1.type);
          res.render('results',{list:vec,user:req.user,room:response1.type,entry:response1.inn_time,exit:response1.out_time});
                
      }
  })
  }
  })
  
  app.post('/GuestDetail',checkAuth ,function(req,res){
    console.log(req.query);
    //console.log(req.body.Room_number);
    var arr = req.body.Room_number.split(",",2);
    arr[1] = parseInt(arr[1]);
    console.log(arr[1]);
    //console.log(req.user);
    var interval = ((new Date(req.query.exit)) - (new Date(req.query.entry)))/(1000*3600);
    //console.log(interval);
    var price = (arr[1]/24)*interval;
    console.log(price);
    var field = {
      room:arr[0],
      price:price,
      entry:req.query.entry,
      exit:req.query.exit
    }
    res.render('booking',{field: field,user:req.user});
  });

  app.post('/booking',checkAuth,function(req,res){
        //console.log(req.query.booking);
        var arr = req.query.booking.split("p",4);
        var id = ((new Date(arr[1]))-0)+arr[0];
        arr[0] = parseInt(arr[0]);
        var params = {
          TableName: "Booking",
          Key:{
              "Booking_ID": id
          }
      }
      docClient.get(params, function(err, data1) {
        if (err) {
            console.log("Unable to query. Error:", JSON.stringify(err, null, 2));

        } 
        else {
          if(Object.keys(data1).length===0)
          {
        var params = {
          TableName: "Booking",
          Item: {
              "Booking_ID": id,
              "Email": req.user.Email,
              "Name": req.body.Name,
              "Address": req.body.addres,
              "Contact": req.body.contact,
              "ID" : req.body.id,
              "Id_number": req.body.Id_number,
              "Check_INN": arr[1],
              "Check_OUT": arr[2],
              "Room": arr[0],
              "Price": arr[3]
          }
        }
        docClient.put(params,function(err,data){
          if(err){
              console.error(JSON.stringify(err, null, 2));
          }
          else{
              console.log("Success");
              //console.log(arr[0]);
              var params1 = {
                TableName: "Hotel_smriti_management_database",
                Key:{
                    "Room_number": arr[0]
                },
                UpdateExpression: "set #attrName = list_append(#attrName,:type) , #attrName2 = list_append(#attrName2,:type2), #attrName3 = list_append(#attrName3,:type3)",
                ExpressionAttributeNames : {
                  "#attrName" : "Booked_BY",
                  "#attrName2" : "entry_time",
                  "#attrName3" : "exit_time"
                },
                ExpressionAttributeValues: {
                    ":type": [req.body.Name],
                    ":type2": [arr[1]],
                    ":type3": [arr[2]]
                }
            }
              docClient.update(params1,function(err,data2){
                if(err)
                {
                    console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                    var params2 = {
                      TableName : "Booking"
                  };
                  
                  dynamodb.deleteTable(params2, function(err, data) {
                      if (err) {
                          console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
                      } else {
                          res.redirect('back');
                      }
                    });

                }else{
                    //console.log(data);
                    var details={
                      room:arr[0],
                      entry:arr[1],
                      exit:arr[2],
                      Name: req.body.Name,
                      Address: req.body.addres,
                      Contact: req.body.contact,
                      ID : req.body.id,
                      Id_number: req.body.Id_number,
                      Booking_ID: id,
                      Price: arr[3]
                    }
                    res.render('final',{details:details,user:req.user});
                }
            })
          }
      })
    }
    else{
      var error=[];
      error.push({msg:"Booking already exits"});
      res.render('smriti',{user:req.user,errors:error})
    }
  
   
  }  //res.render('smriti',{user:req.user});
  
  });   //res.render('smriti',{user:req.user});
  });
};