const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());
const PORT = 8080; // default port 8080

//display six random characters into a string for the short url
function generateRandomString() {
	let newRandomString = "";
	for (var i = 0; i < 6; i++){
			newRandomString += randomCharacter();
	}
	return newRandomString;
}
//create a random string for the short url
function randomCharacter() {
let chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
return chars.substr(Math.floor(Math.random() * 62), 1);
}
//unique url is equal to the new random string
let uniqueShortURL = generateRandomString()

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

//an object with the list of urls in the database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
  // "shortURL": "longURL"
};

//an object which will be used to store and acess the users
const users = { 
  "userRandomID": {
    id: "theabo", 
    email: "thea@example.com", 
    password: "12345"
  },
 "user2RandomID": {
    id: "tommyboi", 
    email: "thomas@example.com", 
    password: "5678"
  }
}

//send response to the front page
app.get("/", (req, res) => {
  res.send("Hello!");
});

//when server is running log the port its on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//display the urls and the username
app.get("/urls", (req, res) => {
	let templateVars = {username: req.cookies["username"], urls: urlDatabase}
	res.render("urls_index", templateVars)
})

//display the register page
app.get("/register", (req, res) => {
	let templateVars = { username: req.cookies["username"]};
  res.render("register", templateVars);
});

//display and create 
app.get("/urls/new", (req, res) => {
	let templateVars = { username: req.cookies["username"]}
  res.render("urls_new", templateVars);
});

//display the unique short url page
app.get("/urls/:shortURL", (req, res) => {
  // /urls/:shortURL -> /urls/ABC123 -> req.params.shortURL === 'ABC123'
  let templateVars = { username: req.cookies["username"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] }; 
	res.render("urls_show", templateVars);
});

//
app.post("/urls", (req, res) => {
	// Log the POST request body of longUrlto the console
	//console.log(req.body['longURL']);  
	// update the url database so new shortUrls are saved
	urlDatabase[uniqueShortURL] = req.body['longURL'];
	// log the new urlDatabase to console
	//console.log(urlDatabase)
	// Respond with 'Ok' (we will replace this)
	res.redirect(`/urls/${uniqueShortURL}`);
});

//redict to website of longURL
app.get("/u/:shortURL", (req, res) => {
	const longURL = urlDatabase[req.params.shortURL];
	
  res.redirect(longURL);
});

//delete url 
app.post("/urls/:shortURL/delete", (req, res) => {

 delete urlDatabase[req.params.shortURL]
	//console.log(urlDatabase)
	res.redirect("/urls");
})

//update url
app.post("/urls/:shortURL", (req, res) => {
	//redirect to the new short url page
	res.redirect(`/urls/${req.params.shortURL}`);
})

//add end point to /login and create username cookies
 app.post("/login", (req, res) => {
	res.cookie("username", req.body['username'])

	res.redirect("/urls")
})

//add end point to /logout and remove the username cookies
app.post("/logout", (req, res) => {

	res.clearCookie("username")

	res.redirect("/urls")
})

//add end point to handle registration form data
