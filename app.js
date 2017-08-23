var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var expressValidator = require("express-validator");
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/linkbagusers");
var db = mongoose.connection;
var mongo = require("mongodb").MongoClient;
var objectId = require('mongodb').ObjectID;
var assert = require("assert");
var bodyparser = require("body-parser");
var url = "mongodb://localhost:27017/linkbag";
var open = require("opn");
var User = require("./models/users");

var app = express();

console.log("Link bag is on");
app.listen(4000);

//View engine setup
app.set("view engine","hbs");

app.use(express.static(path.join(__dirname,"public")));

app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(cookieParser());

//using sessions
app.use(session({
	secret : "231313",
	saveUninitialized : true,
	resave : true
}))

//maintain this order of using sessions before passport
app.use(passport.initialize());
app.use(passport.session());


//using express validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

//flash
app.use(flash());

//settng global variables for flash messages
app.use(function(req,resp,next){
	resp.locals.success_msg = req.flash("success_msg");
	resp.locals.error_msg = req.flash("error_msg");
	resp.locals.error = req.flash("error");
	next();
})

//Handling of various requests
app.get("/",function(req,resp){
	console.log(req.isAuthenticated());
	resp.render("login");
})

app.get("/register",function(req,resp){
	resp.render("register");
})

//strategy configuring for login
passport.use(new LocalStrategy(
		function(username,password,done){
			User.getUserByUsername(username,function(err,user){
				if(err) throw err;
				if(!user) return done(null,false,{message : "Invalid Username or Password..!!"});
					
				User.comparePassword(password,user.password,function(err,match){
					if(err) throw err;
					if(match){
						return done(null,user);
					}
					else{
						return done(null,false,{message : "Invalid Username or Password..!!"});
					}
				})
			})
		}
	));

//serializing and deserializing user
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});
//login handling
app.post('/loggedin',
  passport.authenticate('local', { successRedirect: '/dashboard',failureRedirect: '/',failureFlash: true }),
  function(req,resp){
  	resp.redirect("/dashboard");
  }
 );

//registration handling
app.post("/registered",function(req,resp){
	var username = req.body.username;
	var password = req.body.password;
	req.checkBody("password2","Passwords do not match").equals(req.body.password);
	var errors = req.validationErrors();
	if(errors){
		resp.render("register",{error : errors});
	}
	else{
		var newUser = new User({
			username : username,
			password : password
		});

		User.createUser(newUser,function(err,user){
			if(err) throw err;
			console.log(user);
		});
		 //req.flash("success_msg","You are successfully registered..!!");
		 resp.redirect("/");
	}
})

app.get("/add",function(req,resp){
	resp.render("addlink");
})

app.post("/submitted",function(req,resp){
	var item ={
		title : req.body.title,
		link : req.body.link,

	}
	mongo.connect(url,function(err,db){
		assert.equal(null,err);
		db.collection("linkcolllection").insertOne(item,function(err,result){
			assert.equal(null,err);
			db.close();
		})
	});
	resp.redirect("/");
})

app.post("/delete",function(req,resp){
	var delink = req.body.params.name;
	mongo.connect(url,function(err,db){
		assert.equal(null,err);
		db.collection("linkcolllection").remove({link : delink});
		db.close();

	});
	
	
})

app.get("/dashboard",checkAuthorization,function(req,resp,next){
	console.log(req.isAuthenticated());
	var linkarray = [];
	mongo.connect(url,function(err,db){
		var data = db.collection("linkcolllection").find();
		data.forEach(function(element){
			linkarray.push(element)
		},function(){
			db.close();
			resp.render("index",{contents : linkarray})
		})
	})
});

//to prevent unauthorized users
function checkAuthorization(req,resp,next){
	if(req.isAuthenticated()){
		return next();
	}
	else{
		req.flash("error_msg","Nope!...Log In First.");
		resp.redirect("/");
	}
}

app.get("/logout",function(req,resp){
	req.logout();
	req.flash("success_msg","You are logged out succcesfully..!!");
	resp.redirect("/");
})
