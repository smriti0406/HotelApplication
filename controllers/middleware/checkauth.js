var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials();
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const docClient = new AWS.DynamoDB.DocumentClient();
const jwt = require('jsonwebtoken');
var user = {Name:"guest"};
module.exports = (req,res,next)=> {
    try{
        //console.log(process.env.JWT_KEY);
        var token = req.cookies.auth;
        //console.log(token);
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        var params2 = {
            TableName: "Users",
            Key:{
                "Email": decoded.email
            }
        };
        docClient.get(params2, function(err, data) {
            if(err)
            {
                console.log("Unable to query. Error:", JSON.stringify(err, null, 2));
            }
            else{
                user = data.Item;
                //console.log(user);
                req.user = user;
                next();
            }
        })
    }catch(error){
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
    

}