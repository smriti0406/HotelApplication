var AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser');
var credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const docClient = new AWS.DynamoDB.DocumentClient();
const FindByToken = require('./controllers/middleware/FindByToken');
const checkauth = require('./controllers/middleware/checkauth');
module.exports = function(app){
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.get('/',FindByToken,async(req,res)=> {
        if(req.user.Name==="guest")
        {
            res.render('welcome');
        }
        else
        {
            res.render('smriti',{user:req.user});
        }
        
    });
    
    app.get('/login',FindByToken ,async(req,res)=> {
        //console.log('hi');
        //console.log(req.user);
        if(req.user.Name==="guest")
        {
            res.render('login');
        }
        else
        {
            res.render('smriti',{user:req.user});
        }
    });
    app.post('/home',async(req,res)=>{
        var params = {
            TableName: "Users",
            Key:{
                "Email": req.body.email
            }
        }
        var error=[];
        docClient.get(params, function(err, data) {
            if (err) {
                console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                res.render('login');
            } 
            else {
                console.log("Query succeeded.");
                if(Object.keys(data).length===0){
                    //console.log('hi');
                    error.push({msg: 'User not exist'});
                    res.render('login',{errors:error});
                }
                else{
                    console.log(req.body.email);
                    if(req.body.password===data.Item.Password)
                            {
                                const token = jwt.sign({email: req.body.email}, process.env.JWT_KEY,{ expiresIn :  "5h"});
                                var params1 = {
                                    TableName: "Users",
                                    Key:{
                                        "Email": req.body.email
                                    },
                                    UpdateExpression: "set AuthToken = :type",
                                    ExpressionAttributeValues: {
                                        ":type": token
                                    }
                                }

                                docClient.update(params1,function(err,data2){
                                    if(err)
                                    {
                                        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                                        res.render('login');
                                    }else{
                                        //console.log(data);
                                        res.cookie('auth',token);
                                        res.render('smriti',{user: data.Item});
                                    }
                                })
                            }else{
                                error.push({msg: 'invalid Password'});
                                res.render('login', {errors:error});
                            }
                }  
            }
        })
    });
    app.get('/signup',FindByToken,async(req,res)=>{
        if(req.user.Name==="guest")
        {
            res.render('signup');
        }
        else
        {
            res.render('smriti',{user:req.user});
        }
       
    });
    app.post('/signup', async(req,res)=>{
        
        var errors=[];
        //console.log(req.body);
        if(req.body.password!==req.body.password2){
            errors.push({msg: "Password Don't Match"});
        }
        if(req.body.password.length<6){
            errors.push({msg: "Password Atleast 6 Characters"});
        }
        if(errors.length>0){
            res.render('signup',{
                errors: errors
            })
        }
        else{
            var param = {
                TableName: "Users",
                Key : {
                    "Email": req.body.email
                }
            }
            docClient.get(param,function(err,data){
                if(err)
                {
                    console.error(JSON.stringify(err,null,2));
                }
                else{
                    //console.log(JSON.stringify(data,null,2));
                    
                    // console.log(encryptedData);
                    if(Object.keys(data).length===0){
                        var params = {
                                        TableName: "Users",
                                        Item: {
                                            "Email": req.body.email,
                                            "Name": req.body.Name,
                                            "Address": req.body.addres,
                                            "Password": req.body.password,
                                            "Contact": req.body.contact,
                                            "ID" : req.body.id,
                                            "Id_number": req.body.Id_number
                                        }
                                   }
                                    docClient.put(params,function(err,data){
                                        if(err){
                                            console.error(JSON.stringify(err, null, 2));
                                        }
                                        else{
                                            console.log("Success");
                                        }
                                    })
                                    errors.push({msg: "Successfully registered"});
                                    res.render('login',{errors: errors});
                                
                            
                        
                    }else{
                        errors.push({msg: 'User already exits'});
                        res.render('login',{errors: errors});
                    }
                    //res.render('login');
                }
                
            })
        }
    });

    app.post('/logout',FindByToken,async(req,res)=> {
        var user = {Name: "guest"};
                //console.log(req.user);
                //console.log(decode);
                var params1 = {
                    TableName: "Users",
                    Key:{
                        "Email": req.user.Email
                    },
                    UpdateExpression: "remove AuthToken"

                }
                docClient.update(params1,function(err,data){
                    if(err)
                    {
                        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                        res.redirect();
                    }else{
                        res.clearCookie('auth');
                        //console.log()
                        console.log(req.cookies.auth);
                        //req.user = user;
                        //console.log(req.user);
                        res.render('smriti',{user: user})
                    }
                })
                
    });
    app.get('/user',checkauth,function(req,res){
         console.log("hi");
          res.render('user',{user:req.user});
    });
    app.get('/edit',checkauth,function(req,res){
         res.render('edit',{user:req.user});
    });
    app.post('/edit',checkauth,function(req,res){
        var email=req.user.Email;
        var params1 = {
            TableName: "Users",
            Key:{
                "Email": email
            },
            UpdateExpression: "set #Name = :type , #Add = :type2, #cont = :type3, #id= :type4, #num= :type5",
            ExpressionAttributeNames : {
              "#Name" : "Name",
              "#Add" : "Address",
              "#cont" : "Contact",
              "#id" : "ID",
              "#num": "Id_number"
            },
            ExpressionAttributeValues: {
                ":type": req.body.Name,
                ":type2": req.body.address,
                ":type3": req.body.contact,
                ":type4": req.body.id,
                ":type5": req.body.Id_number
            }
        }
        docClient.update(params1,function(err,data){
            if(err)
            {
                console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
            }
            else{
                var params = {
                    TableName: "Users",
                    Key:{
                        "Email": email
                    }
                };
                docClient.get(params,function(err,data3){
                    if(err){
                        console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                    }
                    else{
                        res.render('user',{user: data3.Item});
                    }
                });
                
            }
        });
    });
    app.get('/forgetpassword',function(req,res){
         res.render('forgetPassword');
    });
    app.post('/forgetpassword', function(req,res){
        if(req.body.password===req.body.password2)
        {
            var para = {
                TableName: "Users",
                Key:{
                    Email: req.body.email
                }
            };
            docClient.get(para,function(err,data4){
                if(err)
                {
                    console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                }
                else
                {
                    if(Object.keys(data4).length===0)
                    {
                        res.render('forgetPassword',{errors:[{msg:"User don't exist"}]});
                    }
                    else
                    {
                        var params1 = {
                            TableName: "Users",
                            Key:{
                                "Email": req.body.email
                            },
                            UpdateExpression: "set #pass = :type",
                            ExpressionAttributeNames : {
                              "#pass" : "Password"
                            },
                            ExpressionAttributeValues: {
                                ":type": req.body.password
                            }
                        };
                        docClient.update(params1,function(err,data){
                          if(err)
                          {
                            console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
                          }
                          else
                          {
                              res.render('login',{errors:[{msg:"Password Changed Successfully"}]});
                          }
                        });
                    }
                }
            })

        }
        else
        {
            res.render('forgetPassword',{errors:[{msg: "Password don't match"}]});
        }
    });
   
};