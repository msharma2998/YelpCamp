var express                 = require("express"),
    mongoose                = require("mongoose"),
    bodyparser              = require("body-parser"),
    methodoverride          = require("method-override"),
    passport                = require("passport"),
    LocalStrategy           = require("passport-local"),
    flash                   = require("connect-flash"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    Campground              = require("./models/campground"),
    Comment                 = require("./models/comment"),
    User                    = require("./models/user");
    // var seedDb = require("./seeds");
    // seedDb();


var app = express();
mongoose.connect("mongodb://localhost:27017/yelpCamp", {useNewUrlParser:true , useUnifiedTopology:true,useFindAndModify:false});
app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodoverride("_method"));
app.use(flash());
app.locals.moment = require("moment");


// PASSPORT CONFIG

app.use(require("express-session")({
    secret : "Camping provides you a break from your hectic life!",
    resave :  false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// MIDDLEWARE

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//ROOT ROUTE

app.get("/",function(req,res)
{
    res.render("landing");
});

// CAMPGROUNDS ROUTES
// INDEX ROUTE

app.get("/campgrounds",function(req,res)
{   
    Campground.find({},function(err,campgrounds)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("campgrounds/index",{campgrounds : campgrounds});
        }
    });
});

// NEW ROUTE

app.get("/campgrounds/new",isLoggenIn,function(req,res)
{
    res.render("campgrounds/new");
});

// CREATE ROUTE

app.post("/campgrounds",isLoggenIn, function(req,res)
{
    Campground.create({
        name : req.body.name,
        image : req.body.image,
        description : req.body.description,
        price : req.body.price,
        author: {
            id : req.user._id,
            username : req.user.username
        }
    },function(err,newCampground)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            req.flash("success","Succesfully created a Campground!");
            res.redirect("/campgrounds");
        }
    });
});

// SHOW ROUTE

app.get("/campgrounds/:id",function(req,res)
{
    Campground.findById(req.params.id).populate("comments likes").exec(function(err,foundCampground)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("campgrounds/show",{campground : foundCampground});
        }
    });
});

// EDIT ROUTE
app.get("/campgrounds/:id/edit",checkCampgroundOwnership,function(req,res)
{
    Campground.findById(req.params.id, function(err,campground)
    {
            res.render("campgrounds/edit", {campground : campground});
    });
});

// UPDATE ROUTE
app.put("/campgrounds/:id",checkCampgroundOwnership,function(req,res)
{
    Campground.findById(req.params.id, function(err,campground)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            campground.name = req.body.campground.name;
            campground.description = req.body.campground.description;
            campground.image = req.body.campground.image;
            campground.save(function (err) 
            {
                if (err) 
                {
                    console.log(err);
                    res.redirect("/campgrounds");
                } 
                else 
                {
                    req.flash("success","Successfully updated the campground!");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

// DELETE ROUTE

app.delete("/campgrounds/:id",checkCampgroundOwnership,function(req,res)
{
    Campground.findByIdAndRemove(req.params.id,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            req.flash("success","Successfully deleted the campground!");
            res.redirect("/campgrounds");
        }
    });
});
 
// LIKE ROUTE

app.post("/campgrounds/:id/like", isLoggenIn , function (req, res) 
{
    Campground.findById(req.params.id, function (err, foundCampground) 
    {
        if (err) 
        {
            console.log(err);
            return res.redirect("/campgrounds");
        }

        // check if req.user._id exists in foundCampground.likes
        var foundUserLike = foundCampground.likes.some(function (like) 
        {
            return like.equals(req.user._id);
        });

        if (foundUserLike) 
        {
            // user already liked, removing like
            foundCampground.likes.pull(req.user._id);
        } 
        else 
        {
            // adding the new user like
            foundCampground.likes.push(req.user);
        }

        foundCampground.save(function (err) 
        {
            if (err) 
            {
                console.log(err);
                return res.redirect("/campgrounds");
            }
            return res.redirect("/campgrounds/" + foundCampground._id);
        });
    });
});


// COMMENTS ROUTE
// NEW ROUTE

app.get("/campgrounds/:id/comments/new", isLoggenIn ,function(req,res)
{
    Campground.findById(req.params.id,function(err,campground)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("comments/new", {campground : campground});
        }
    })
});

// CREATE ROUTE

app.post("/campgrounds/:id/comments",isLoggenIn ,function(req,res)
{
    Campground.findById(req.params.id,function(err,campground)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            Comment.create(req.body.comment,function(err,comment)
            {
                if(err)
                {
                    console.log(err);
                }
                else
                {
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save(function(err,updatedCampground)
                    {
                        if(err)
                        {
                            console.log(err);
                        }
                        else
                        {   
                            var url = "/campgrounds/" + updatedCampground._id;
                            req.flash("success","Successfully added the comment!");
                            res.redirect(url);
                        }
                    });
                }
            });
            
        }
    });
});

// EDIT ROUTE

app.get("/campgrounds/:id/comments/:cmt_id/edit",checkCommentOwnership,function(req,res)
{
    Comment.findById(req.params.cmt_id, function(err,comment)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("comments/edit", {campid : req.params.id , comment : comment});
        }
    });
});

// UPDATE ROUTE

app.put("/campgrounds/:id/comments/:cmt_id",checkCommentOwnership,function(req,res) 
{
    Comment.findByIdAndUpdate(req.params.cmt_id,req.body.comment, function(err,updatedComment)
    {
        if(err)
        {
            console.log(err);
        }
        else
        {
            req.flash("success","Successfully updated the comment!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DELETE ROUTE
app.delete("/campgrounds/:id/comments/:cmt_id",checkCommentOwnership,function(req,res)
{
    Comment.findByIdAndRemove(req.params.cmt_id,function(err)
    {
        if(err)
        {
            console.log(err);
        }
        else{
            req.flash("success","Successfully deleted the comment!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

// AUTH ROUTES
// SIGNUP FORM

app.get("/register",function(req,res)
{
    res.render("register");
});

// ADD NEW USER

app.post("/register",function(req,res)
{
    var newUser = new User({username : req.body.username});
    User.register(newUser, req.body.password , function(err,user)
    {
        if(err)
        {
            req.flash("error",err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req ,res, function(){
            req.flash("success","Welcome to YelpCamp, " + user.username);
            res.redirect("/campgrounds");
        });
        
    });
});

// LOGIN FORM

app.get("/login",function(req,res){
    res.render("login");
});

//LOGGING IN THE USER

app.post("/login",passport.authenticate("local",
{
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}),function(req,res){});

//LOGOUT USER

app.get("/logout",function(req,res)
{
    req.logout();
    req.flash("success","Successfully logged out");
    res.redirect("/campgrounds");
});

//MIDDLEWARE

function isLoggenIn(req,res,next)
{
    if(req.isAuthenticated())
    {
        return next();
    }
    req.flash("error","You should have an account. Try Signing/Logning in first");
    res.redirect("/login");
}

function checkCampgroundOwnership(req,res,next)
{
    if(req.isAuthenticated())
    {
        Campground.findById(req.params.id , function(err,foundCampground)
        {
            if(err)
            {
                req.flash("error","Campground not Found!");
                console.log(err);
            }
            else
            {
                if(foundCampground.author.id.equals(req.user._id))
                {
                    next();
                }
                else
                {
                    req.flash("error","You are not authorized to do the following changes!");
                    res.redirect("/campgrounds/" + foundCampground._id);
                }
            }
        });
    }
    else{
        req.flash("error","Sign in first and try Again!");
        res.redirect("back");
    }
}

function checkCommentOwnership(req,res,next)
{
    if(req.isAuthenticated())
    {
        Comment.findById(req.params.cmt_id , function(err,foundComment)
        {
            if(err)
            {
                req.flash("error","Something went wrong!");
                console.log(err);
            }
            else
            {
                if(foundComment.author.id.equals(req.user._id))
                {
                    next();
                }
                else
                {
                    req.flash("error","You are not authorised to do the following changes!");
                    res.redirect("back");
                }
            }
        });
    }
    else{
        req.flash("error","Sign in first and Try Again!");
        res.redirect("back");
    }
}

app.listen(3000,function()
{
    console.log("Server has started..!");
});

