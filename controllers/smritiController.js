var AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const checkAuth = require('./middleware/checkauth');
const FindByToken = require('./middleware/FindByToken');
var credi = false;
var credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = function(app){
  app.get('/smriti', FindByToken,function(req,res){
    res.render('smriti',{user: req.user});     
  });
  
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.post('/smriti',FindByToken,function(req,res){
      
    response = {  
      inn_time:req.body.CheckINN,  
      out_time:req.body.CheckOUT,
      type:req.body.room
  };  
  console.log(response);
  var d = new Date(response.inn_time);
  var x = new Date(response.out_time);
  var y = new Date();
  if(x<d||d<y||x<y)
  {
    //console.log(user);
    credi=true;
    res.render('smriti',{user: req.user});
    credi=false;
  }
  else if(response.type==="all")
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
                var x1 = new Date(response.inn_time);
                var y1 = new Date(response.out_time);
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
          res.render('results',{list:vec});
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
          ":type": response.type
      }
  }
    docClient.query(params, function(err,data){
      if(err){
          console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
      }
      else{
          console.log("Query succeeded.");
          data.Items.forEach(function(item) {
            console.log(item);
              var inn_time = item.entry_time;
              var out_time = item.exit_time;
              var l = inn_time.length;
              var i=0;
              var select = true;
              for(i=0;i<l;i++)
              {
                  var x1 = new Date(response.inn_time);
                  var y1 = new Date(response.out_time);
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
          res.render('results',{list:vec,user: req.user});
                
      }
  })
  }
  })

  app.post('/results',checkAuth ,function(req,res){
    console.log(req.body);
    res.render('booking',{Room:req.body.Room_number,user:req.user});
  });

  
};