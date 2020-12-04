var AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cookieParser=require('cookie-parser');
var credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const docClient = new AWS.DynamoDB.DocumentClient();
const FindByToken = require('./controllers/middleware/FindByToken');

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
        console.log('hi');
        if(req.user.Name==="guest")
        {
            res.render('login');
        }
        else
        {
            res.render('smriti',{user:req.user});
        }
    });
    app.post('/login',async(req,res)=>{
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
                                const token = jwt.sign({email: req.body.email}, process.env.JWT_KEY,{ expiresIn :  "1h"});
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
                console.log(req.user);
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
                        res.render('smriti',{user: user})
                    }
                })
                
    });
   
};