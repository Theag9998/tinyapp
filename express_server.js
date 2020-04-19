const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080
//access random string generator
const generateRandomString = require("./randomStringGenerator");
//access helper functions
const {emailLookUp, checkShortUrl, urlsForUser, idWithCookie} = require("./helpers");
//access cookies
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(bodyParser.urlencoded({extended: true}));
//use EJS as templating engine
app.set("view engine", "ejs");


//unique url is equal to the new random string
let uniqueShortURL = generateRandomString;
//unique Id for a new registered user
let uniqueID = generateRandomString;

//when server is running log the port its on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//an object with the list of urls in the database
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "theabo"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "tommyboi"}
};

//an object which will be used to store and access the users registered
const users = {
//fill with user info
};

app.get("/", (req, res) => {
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
	const userID = currentID;
	//if the user is logged in
  if (userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//display the register page
app.get("/register", (req, res) => {
  //check if the user is logged in/registered by requesting cookies
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //if the user is logged in  redirect to urls
  if (currentID) {
    res.redirect("urls");
    //if the user is not logged in display message
  } else {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("register", templateVars);
  }
});

//add end point to handle registration form data
app.post("/register", (req, res) => {
  //get the info from body for email and password that was entered
  const {email, password} = req.body;
  //hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);
  //if email or password entered are empty string send back 404 status
  if (email === "" || password === "") {
    res.status(400).send("Error 400 please enter email or password");
  }
  //if someone registers with an email that already exists in users return 404 status
  if (emailLookUp(email, users)) {
    res.status(400).send("Error 400 email already exists");
  } else {
    //update the users database with a unique id so new email and hashed password are saved
    users[uniqueID] = {'id': uniqueID, email, hashedPassword};
    //set a userID cookie containing the new generated ID
    req.session.user_id = uniqueID;
  }
  //after being registered redirect to /urls
  res.redirect("/urls");
});

//display the login page
app.get("/login", (req, res) => {
  //check if the user is logged in/registered by requesting cookies
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //if the user exists redirect them to the urls page
  if (currentID) {
    res.redirect("/urls");
    //if the user is not logged in/registered display login page
  } else {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("login", templateVars);
  }
});

//add end point to /login
app.post("/login", (req, res) => {
  //get the info from body for email and password
  const { email, password} = req.body;
  //hash the password that was entered
  const hashedPassword = bcrypt.hashSync(password, 10);
  //obtain the current Id of the user associated with that email
  const currentId = emailLookUp(email, users);
	
  //if email or password are empty string send back 404 status
  if (email === "" || password === "") {
    res.status(403).send("Error 404 please enter email or password");
  }
  //if the email does not exist
  if (!currentId) {
    res.status(403).send("Error 403 email cannot be found");
  }
  //access the specific user object in users in order to get their password value
  const existingUser = users[currentId];
  //need to compare the users password to the one was hashed and entered
  const passwordCompare = bcrypt.compareSync(existingUser.password, hashedPassword);
  //if someone enters an email and a matching password log them in and start a cookie
  if (currentId && passwordCompare === true) {
    //set a userID cookie containing the logged in ID of the user
    req.session.user_id = currentId;
    //if email exists but the password does not match
  } else if (currentId && passwordCompare === false) {
    res.status(403).send("Error 403 password does not match");
  }
			
  //after being logged in redirect to /urls
  res.redirect("/urls");
});

//add end point to /logout and remove the user_id cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//redict to website of longURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

//display the urls associated with the specific logged in user
app.get("/urls", (req, res) => {
//check if the user is logged in/registered by requesting cookies
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //if the user exists allow them to view webpage
  if (currentID) {
    //only show the urls created by the individual user
    let templateVars = { userID: users[req.session.user_id], urls: urlsForUser(cookieID, urlDatabase)};
    res.render("urls_index", templateVars);
    //if the user is not logged in/registered display message
  } else {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("urls_index", templateVars);
  }
});

//add a new short url to the urlDatabase when given a longURl
app.post("/urls", (req, res) => {
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  const userID = currentID;
  //access long url from the input from page
  const {longURL} = req.body;
  //update the url database so new shortUrls are saved
  //with their longURLs and the user that added them
  urlDatabase[uniqueShortURL] = {longURL, userID};
  res.redirect(`/urls/${uniqueShortURL}`);
});

//display and create new urls if the user is logged in/registered
app.get("/urls/new", (req, res) => {
  //check if the user is logged in/registered by requesting cookies
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //if the user exists allow them to view webpage
  if (currentID) {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  } else {
    //if the user is not found redirect to login
    res.redirect("/login");
  }
});

//display the unique short url page for the user that created the shortUrl
app.get("/urls/:shortURL", (req, res) => {
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  //if the user exists allow them to view webpage of the specific short url
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      //show the webpage
      let templateVars = { userUrl: checkShortUrl(req.params.shortURL, urlForID), userID: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'] };
      res.render("urls_show", templateVars);
    } else {
      let templateVars = { userUrl: checkShortUrl(req.params.shortURL, urlForID), userID: users[req.session.user_id]};
      res.render("urls_show", templateVars);
    }
		//if user is not logged in 
  } else {
    res.send("Please login first");
  }
	
});

//delete url if the user created it
app.post("/urls/:shortURL/delete", (req, res) => {
  //check if the current user is the one that created the url that wants to be deleted
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  //if the user exists and is logged in
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    //then they have permission to delete it
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    }
  }
});

//update url if the user created it
app.post("/urls/:shortURL", (req, res) => {
  //check if the current user is the one that created the url that wants to be deleted
  //set cookieID to the cookie user_id
  const cookieID = req.session.user_id;
  //set currentID to the users ID if the cookieID is found
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  //if the user exists and is logged in
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    //then they have permission to delete it
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      //access long url from the input from page
      const longURL = req.body.longURL;
      urlDatabase[req.params.shortURL].longURL = longURL;
      //redirect to the new short url page
      res.redirect('/urls');
    }
  }
});