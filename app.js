const config = require('./config');
const port = 3000;
let connection = config.connection;
var bodyParser = require('body-parser');
var express = require('express');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var Cookies = require('cookies');
var app = express();
var moment = require('moment');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname+'/views/');


app.listen(port, function init(){
    console.log('Server Started At '+port);
});

// Entry Component
app.get('/',async function (req, res, next) {
    console.log('GET / ');
    var cookies = new Cookies(req, res);
    if(cookies.get('jwt') == undefined)
        res.render('login.html');    
    else{
        checkToken(cookies.get('jwt')).then(function (){
            res.redirect('dashboard');
        }).catch(function (){
            res.render('login.html');            
        })
    }
});

// Entry Component Registration
app.get('/registration',async function (req, res, next) {
    console.log('GET /registration ');
    res.render('register.html');            
});

// users Datatable
app.get('/users',verifyToken,async function(req,res){
    console.log('GET /users ');    
    res.render('users.html');            
});

// Dashboard
['get','put','post'].forEach(function(method){
    app[method]('/dashboard',verifyToken,async function(req,res){
        console.log('GET /users ');    
        res.render('dashboard.html');            
    });
});

// User Info
app.get('/user',verifyToken,async function(req,res){
    console.log('GET /user ');
    var params = req.query;
    if(params.id == undefined)
        res.redirect('users');
    console.log(JSON.stringify(params));
    var data = new Object;
    getTable('userMaster','WHERE userId = '+params.id+' LIMIT 1','userId,userName,userEmail').then(function (userInfo){
        if(userInfo.length>0){
            data.userInfo = userInfo[0];
            getTable('userAddress','WHERE userId = '+params.id,'userAddress').then(function (userAddress){
                if(userAddress.length > 0){
                    data.userAddress = userAddress;
                }
                console.log("Passing Data :: "+JSON.stringify(data));
                res.render('userInfo',data);    
            }).catch(function (errAddress){
                res.render('userInfo',data);
            })
        }else{
            res.redirect('users');
        }
    }).catch(function (err){
        res.redirect('users');

    })
    
});

// Logout
app.get('/logout',verifyToken,async function(req,res){
    var cookies = new Cookies(req, res)
    cookies.set('jwt', jwt,{maxAge : Date.now()});
    res.redirect('/');
});

// Login  
app.post('/',async function(req,res){
    console.log('Post / ');
    var params = req.body;
    console.log(params); 
    if(params.jwt != undefined){
        checkToken(params.jwt).then(function (data){
            console.log(data.userId);
            var dataFromUser = "userId,userName,userEmail,userPassword";
            getTable('userMaster','WHERE userId = "'+data.userId+'"',dataFromUser).then(function (userInfo){
                if(userInfo.length > 0){
                    delete userInfo[0].userPassword;
                    return res.status(200).json({
                        "status"  : true,
                        "error"   : 0,
                        "message" : "Login Successfully",
                        "userInfo": userInfo[0],
                        "jwt"     : params.jwt
                    });
                }else{
                    return res.status(400).json({
                        "status" : false,
                        "error"  : 5,
                        "message": "Unable to find the user"
                    });
                }
            })

        }).catch(function (error){
            console.log("error in jwt :",error)
            return res.status(400).json({
                "status" : false,
                "error"  : 8,
                "message": "Autologin fail"
            });
        }) 
    }else{
        if(params.userEmail == undefined){
            return res.status(400).json({
                "status" : false,
                "error"  : 1,
                "message": "A Key Is Missing",
                "key"    : "userEmail"
            });
        }
        if(params.userPassword == undefined){
            res.status(400).json({
                "status" : false,
                "error"  : 1,
                "message": "A Key Is Missing",
                "key"    : "userPassword"
            });
            return 0;
        }
        var dataFromUser = "userId,userName,userEmail,userPassword";
        getTable('userMaster','WHERE userEmail = "'+params.userEmail+'" ORDER BY userId DESC LIMIT 1',dataFromUser).then(function (userInfo){
            console.log('User Info : '+JSON.stringify(userInfo));
            if(userInfo.length > 0){
                checkHashPassword(params.userPassword,userInfo[0].userPassword).then(function (isVerified){
                    generateToken({"userId":userInfo[0].userId}).then( function (jwt){
                        delete userInfo[0].userPassword;
                        var cookies = new Cookies(req, res)
                        cookies.set('jwt', jwt)
                        console.log('Set Cookie')
                        return res.redirect(307,'/dashboard');
                    }).catch( function (err){
                        console.log(err);
                        return res.status(400).json({
                            "status" : false,
                            "error"  : 3,
                            "message": "Error While Generating Json Web Token"
                        });
                    });
                }).catch(function (error){
                    return res.status(400).json({
                        "status" : false,
                        "error"  : 6,
                        "message": "Password is incorrect"
                    });
                })
            }else{
                return res.status(400).json({
                    "status" : false,
                    "error"  : 5,
                    "message": "Unable to find the user"
                });
            }
        }).catch( function (err){
            console.log("Error In Get User Informtaion",err);
            return res.status(400).json({
                "status" : false,
                "error"  : 4,
                "message": "Unable to get userinfo"
            });
        });


         
    }
    // res.send(400,"data");
});

// Registration
app.put('/',async function(req,res){
    console.log('Put / ');
    var params = req.body;
    console.log(params);    
    if(params.userEmail == undefined){
        return res.status(400).json({
            "status" : false,
            "error"  : 1,
            "message": "A Key Is Missing",
            "key"    : "userEmail"
        });
        
    }
    if(params.userPassword == undefined){
        return res.status(400).json({
            "status" : false,
            "error"  : 1,
            "message": "A Key Is Missing",
            "key"    : "userPassword"
        });
    }

    getTable('userMaster','WHERE userEmail = "'+params.userEmail+'"  LIMIT 1','userId').then(function (userInfo){
        console.log('Geted Data'+JSON.stringify(userInfo))
        if(userInfo.length>0){
            return res.status(400).json({
                "status" : false,
                "error"  : 7,
                "message": "Duplicate Record",
            });
        }else{
            generateHash(params.userPassword).then(function (hashedPassword){
                params.userPassword = hashedPassword;
                delete params.userCnfPassword;
                console.log('Final Updated Value : ',params)
                insert("userMaster",params).then(function (insertInfo){
                    generateToken({"userId":insertInfo.insertId}).then( function (jwt){
                        delete params.userPassword;
                        params.userId = insertInfo.insertId;
                        var cookies = new Cookies(req, res)
                        cookies.set('jwt', jwt)
                        console.log('Set Cookie')
                        return res.redirect('/dashboard');
                    }).catch( function (err){
                        console.log(err);
                        return res.status(400).json({
                            "status" : false,
                            "error"  : 3,
                            "message": "Error While Generating Json Web Token"
                        });
                    });
                }).catch(function (err){
                    return res.status(400).json({
                        "status" : false,
                        "error"  : 2,
                        "message": "Error While Inserting To Database"
                    });
                })
            }).catch(function (err){
                return res.status(400).json({
                    "status" : false,
                    "error"  : 2,
                    "message": "Error While Encrypt The Password"
                });
            })
        }
    })

});

// Get User For Datatable
app.post('/getUsers',verifyToken,async function(req,res){
    var params=req.body;
    var data = [];
    console.log(JSON.stringify(params))
    var fullData = await createQueryForDataTable(params);
    if(fullData != false){
        console.log("Full Data :: ",JSON.stringify(fullData));
        for (let i = 0; i < fullData.length; i++) {
            var tempArr = [fullData[i].userId,fullData[i].userName,fullData[i].userEmail, moment(fullData[i].userCreatedAt).format('DD-MM-YYYY HH:mm:ss'),'<a href="/user?id='+fullData[i].userId+'" class="btn btn-outline-primary"><i class="mdi mdi-account-edit"></i></a> <a onclick="deleteUser('+fullData[i].userId+')" class="btn btn-outline-danger"><i class="mdi mdi-delete"></i></a>'];
            data.push(tempArr);
        }
        var totalRecord = await countTotalRecords("userMaster");
        console.log('total Record : '+totalRecord)
        res.json({
            data : data,
            draw : params.draw,
            recordsFiltered : fullData.length,
            recordsTotal : totalRecord
        })
    }else{
        res.json({
            data : data,
            draw : params.draw,
            recordsFiltered : 0,
            recordsTotal : 0
        })

    }
});

// Save Address
app.patch('/addAddress',verifyToken,async function(req,res){
  console.log('PATCH /addAddress');
  var params=req.body;
  console.log(JSON.stringify(params))
  deleteFromTable("userAddress"," WHERE userId = "+params.userId).then(function (isDeleted){
      console.log('Delete Address :: ',isDeleted)
      return (isDeleted);
  }).then(function (isDeleted){
      var finalUpdateData = [];
      for(var i =0; i<params.address.length; i++){
        finalUpdateData.push([params.address[i],params.userId]);
      }
      batchInsert('userAddress','`userAddress`,`userId`',finalUpdateData).then(function (bi){
        return res.status(200).json({
            "status" : true,
            "message": "Data Updated Successfully",
            "error"  : 0
        });
      }).catch(function (error){
        return res.status(400).json({
            "status" : false,
            "message": "Error While Inserting Record",
            "error"  : 9
        });
      })
  })
  .catch(function (err){
    console.log('Error In Delete Address :: ',err)
    return res.status(400).json({
        "status" : false,
        "message": "Error While Inserting Record",
        "error"  : 9
    });
  })
})

app.delete('/deleteUser/:id',verifyToken,async function(req,res){
    console.log("Delete /deleteUser ");
    console.log(req.params.id);
    deleteFromTable('userMaster','WHERE userId = '+req.params.id).then(function (data){
        return res.json({
            "status" : true,
            "message": "Deleted Successfully",
            "error"  : 0
        })
    }).catch(function(err){
        console.log("err in Delete user : ",err);
        return res.status(400).json({
            "status" : false,
            "message": "Something Went Wrong",
            "error"  : 11
        })
    })
});

// Save User Info
app.patch('/updateUser',verifyToken,async function(req,res){
    console.log('PATCH /updateUser');
    var params=req.body;
    var userId = params.userId;
    delete params.userId;
    updateMySql("userMaster",params,"WHERE userId = "+userId).then(function (isUpdate){
        return res.status(200).json({
            "status" : true,
            "message": "Data Updated Successfully",
            "error"  : 0
        });
    }).catch(function (err){
        return res.status(400).json({
            "status" : false,
            "message": "Error While Updating Record",
            "error"  : 10
        });
    });
});



// Generate User Password
var generateHash = function (password){
    return new Promise(function (resolve, reject) {
        bcrypt.hash(password, 10, function(err, hashed) {
            if(err){
                console.log(err);
                return reject(err);
            }else{
                return resolve(hashed); 
            }
        });
    });
}

// Check Hashed Pasword
var checkHashPassword = function (password, hashedPassword) {
    console.log(password, hashedPassword)
    return new Promise(function (resolve, reject) {
        bcrypt.compare(password, hashedPassword, function (err, correct) {
            console.log('Is Correct : '+correct);
            if(!correct) {
                return reject(false);
            }else{
                return resolve(true);
            }
        });
    });
}

// Generate Token
var generateToken = function (data) {
    return new Promise(function (resolve, reject) {
        jwt.sign(data, config.secretkey, { expiresIn: config.tokenExpTime }, (err, token) => {
            if (!err) {
                return resolve(token);
            } else {
                console.log("JSON Web Token Error ::: ",err);
                return reject(err);
            }
        });
    });
}

var checkToken  = function (token){
    return new Promise(function (resolve, reject) {
        jwt.verify(token, config.secretkey, (err, authData) => {
            if (err) {
                return reject(err);
            } else {
                return resolve(authData);
            }
        });
    });
}

// Verify JWT Token 
function verifyToken(req, res, next) {
    console.log("Verify Token");
    var cookies = new Cookies(req, res);
    var bearerHeader = (req.headers['Authorization'] != undefined )?req.headers['Authorization'] : cookies.get('jwt');
    if (bearerHeader != undefined) {
        checkToken(bearerHeader).then(function (){
            next();
        }).catch(function (){
            res.redirect('/');
        })
    } else {
        res.redirect('/');
    }
}

// Delete Into Table
var deleteFromTable = function (table, where) {
    return new Promise(function (resolve, reject) {
        var query = connection.query('DELETE FROM ' + table + ' '+where, function (err, result) {
            if (err) {
                console.debug(err);
                return reject(false);
            }
            else {
                return resolve(result);
            }
        });
    })
}

// Insert Into Table
var insert = function (table, data) {
    return new Promise(function (resolve, reject) {
        var query = connection.query('INSERT INTO ' + table + ' SET ?', data, function (err, result) {
            if (err) {
                console.debug(err);
                return reject(false);
            }
            else {
                return resolve(result);
            }
        });
    })
}

// Insert Batch 
var batchInsert = function (table, coulmn, insertArray) {
    return new Promise(function (resolve, reject) {
        var response = new Object;
        var query = connection.query('INSERT INTO ' + table + ' (' + coulmn + ')  VALUES ?', [insertArray], function (err, result) {
            if (err) {
                console.debug(err);
                return reject(err);
            }
            else {
                return resolve(result);
            }
        });
        console.log('qry for insert booking adddress ------>' + query.sql);
    })
}

// Select From Table
var getTable = function (table, where = '', select = '*') {
    return new Promise(function (resolve, reject) {
        var query = connection.query('SELECT ' + select + ' FROM ' + table + ' ' + where, function (err, rows) {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
        console.log('Query of Table ' + table + ' ------>' + query.sql);
    });
}

// Count Total Records
var countTotalRecords = function (table) {
    return new Promise(function (resolve, reject) {
        var query = connection.query('SELECT COUNT(*) AS totalRecord FROM ' + table, function (err, rows) {
            if (err) {
                resolve(0);
            } else {
                resolve(rows[0].totalRecord);
            }
        })
        console.log('Query of Count Table ' + table + ' ------>' + query.sql);
    });
}

// Get Datatable Query
function createQueryForDataTable(data){
    var query = "SELECT * FROM ";
    var tableName = "userMaster";
    var searchColumn = ['userId','userName','userEmail','userCreatedAt'];
    var defaultOrder = {
        "column" : "userId",
        "dir"    : "DESC"
    }
    query += "`"+tableName+"` ";
    for(let index = 0; index < searchColumn.length; index++) {
        // Search Login
        if(data.search.value){
            var search = data.search.value;
            if(index == 0){ // First Loop
                query += "WHERE ( `"+searchColumn[0]+"` LIKE '%"+search+"%' ESCAPE '!' ";
            }else{
                query += "OR `"+searchColumn[index]+"` LIKE '%"+search+"%' ESCAPE '!' ";
            }
            if(searchColumn.length - 1 == index){
                query += " ) ";
            }
        }
    }
    // Set Order
    if(data.order != undefined){
        query += "ORDER BY `"+searchColumn[data.order[0].column]+"` "+data.order[0].dir+" ";  
    }
    else {
        query += "ORDER BY `"+defaultOrder.column+"` "+defaultOrder.dir+" ";  
    }
    // Set Limit
    if(data.length != -1)
        query += "LIMIT "+data.start+","+data.length+" ";  
    else{
        query += "LIMIT 10 ";  
    }
    console.log('Query For Datatable :-> '+query);
    return new Promise(function (resolve, reject) {
        connection.query(query, function (err, rows) {
            if (err) {
                console.log('Error In Data Table :: ',err)
                return resolve(false);
            } else {
                return resolve(rows);
            }
        })
    });

}

// Update Table
var updateMySql = function updateMySql(table, data, where) {
    return new Promise(function (resolve, reject) {
        var query = connection.query('UPDATE ' + table + ' SET ? ' + where, data, function (err, result) {
            if (err) {
                console.debug(err);
                return reject(err);
            }
            else {
                return resolve(result);
            }
        });
        console.log('Query OF Update Table : ' + table + ' ------>' + query.sql);
    })
}