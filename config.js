var mysql = require('mysql');

// Create MySql Connection
var connection = mysql.createConnection({
  host: "localhost", // Your Host
  user: "root", // Database User
  password: "", // Password
  database: "basicLogin", // Database Name
});

// Connect to the mySql
connection.connect(function(err) {
  if(!err){
    console.log('MySql Is Connected Successfully');
  }else{
    console.log('Error While Connecting To MySql :: ',err);
  }
});

  
exports.connection = connection;   // MySql Connection
exports.secretkey = "secretKey";     // JWT token SecretKey
exports.tokenExpTime = "30d";      // JWT token Exp. Date  

