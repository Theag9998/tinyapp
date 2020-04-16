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
let uniqueShortURL = generateRandomString();
//unique Id for a new registered user
let uniqueID = generateRandomString();

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
  "theabo": {
    id: "theabo", 
    email: "thea@example.com", 
    password: "12345"
  },
 "tommyboi": {
    id: "tommyboi", 
    email: "thomas1@example.com", 
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

//display the urls and the userId
app.get("/urls", (req, res) => {
	let templateVars = { userID: users[req.cookies['user_id']], urls: urlDatabase}
	res.render("urls_index", templateVars)
})

//display the register page
app.get("/register", (req, res) => {
	let templateVars = { userID: users[req.cookies['user_id']]};
  res.render("register", templateVars);
});

//display the login page
app.get("/login", (req, res) => {
	let templateVars = { userID: users[req.cookies['user_id']]};
  res.render("login", templateVars);
});

//display and create 
app.get("/urls/new", (req, res) => {
	let templateVars = { userID: users[req.cookies['user_id']]}
  res.render("urls_new", templateVars);
});

//display the unique short url page
app.get("/urls/:shortURL", (req, res) => {
  // /urls/:shortURL -> /urls/ABC123 -> req.params.shortURL === 'ABC123'
  let templateVars = { userID: users[req.cookies['user_id']], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] }; 
	res.render("urls_show", templateVars);
});

//add a new short url to the urlDatabase when given a longURl
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

//add end point to /login 
 app.post("/login", (req, res) => {
	//get the info from body for email and password
	const { email, password} = req.body;
	console.log(req.body)
	const currentId = idLookUp(email);
	console.log(currentId)
	const existingUser = users[currentId];
	console.log(existingUser)

	//if email or password are empty string send back 404 status
	if (email === "" || password === "") {
		res.send("Error 404 please enter email or password")
	}
	
	//if someone enters an email and a matching password
		if (emailLookUp(email) && existingUser.password === password) {
		
		//set a userID cookie containing the logged in ID
			res.cookie("user_id", currentId);
		//if email exists but the password does not match 
		} else if (emailLookUp(email) && existingUser.password !== password) {
			res.send("Error 403 password does not match")
		//if email does not exist
		} else {
			res.send("Error 403 email cannot be found")
		}
	//after being logged in redirect to /urls
	res.redirect("/urls")
})

//add end point to /logout and remove the user_id cookies
app.post("/logout", (req, res) => {

	res.clearCookie("user_id")

	res.redirect("/urls")
})

//add end point to handle registration form data
app.post("/register", (req, res) => {
	//get the info from body for email and password
	const {email, password} = req.body;
	//if email or password are empty string send back 404 status
	if (email === "" || password === "") {
		res.send("Error 400 please enter email or password")
	}

	//if someone registers with an email that already exists in users return 404 status
		if (emailLookUp(email)) {
		res.send("Error 400 email already exists")
		} else {
			//update the users database with a unique id so new email and password are saved
			users[uniqueID] = {'id': uniqueID, email, password}
			//set a userID cookie containing the new generated ID
			res.cookie("user_id", uniqueID);
		}
	//after being registered redirect to /urls
	res.redirect("/urls")
})


//email look up function
const emailLookUp = function(email) {
	//search through users to see if email entered is already registered
	for (key in users) {
		if (email === users[key]['email']) {
			return true
		} 
	}
	return false
}

const idLookUp = function(email) {
	for (key in users) {
		if (email === users[key]['email']) {
			return users[key]['id']
		} 
	}
	return false
}