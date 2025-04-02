const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Home route
app.get('/', (req, res) => {
    res.render("index");
});

//mypost action on navbar
app.get('/Mypost',isLoggedIn, async(req,res) =>{
    let user = await userModel.findOne({email:req.user.email}).populate("posts");
    res.render("Mypost",{user})
});




app.get('/login',(req,res) =>{
    res.render("login");
});
app.get('/profile', isLoggedIn, async(req,res) =>{
    let user = await userModel.findOne({email:req.user.email}).populate("posts");

    res.render("profile",{user});
});
//post on mongodb
app.post('/post', isLoggedIn, async(req,res) =>{
    let user = await userModel.findOne({email:req.user.email});
    let {content}=req.body;

    let post = await postModel.create({
        user:user._id,
        content
    });
user.posts.push(post._id);
await user.save();
res.redirect("/profile")
});


// Register route
app.post('/register', async (req, res) => {
    let { email, password, name, username, age } = req.body;

    // Check if the user already exists
    let user = await userModel.findOne({email});
    if (user) {
        return res.status(500).send("User already registered");
    }

    try {
        // Generate a salt and hash the password asynchronously
        const salt = await bcrypt.genSalt(10);  // Generate salt with 10 rounds
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password

        // Create a new user with the hashed password
        user = await userModel.create({
            username,
            age,
            name,
            email,
            password: hashedPassword  // Save the hashed password, not plain text
        });

        // Generate a JWT token for the user
        const token = jwt.sign({ email: email, userid: user._id }, "shhhh");
        
        // Send the token as a cookie
        res.cookie("token", token);

        // Send success response
        res.send("User registered successfully");

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});
//  login
app.post('/login', async (req, res) => {
    let { email, password} = req.body;

    // Check if the user already exists
    let user = await userModel.findOne({ email });
    if (!user) {
        return res.status(500).send("Something went wrong");
    }
bcrypt.compare(password,user.password,function(err,result){
    if(result) {
        const token = jwt.sign({ email: email, userid: user._id }, "shhhh");
        res.cookie("token", token);
        res.status(200).redirect("/profile");
    }
    else res.redirect("/login");
})
    
});
 
app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login");
});

function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;
    }
    next();
}


app.listen(9000, () => {
    console.log("Server is running on port 9000");
});
