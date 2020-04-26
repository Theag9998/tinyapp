const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080

//access helper functions
const {emailLookUp, checkShortUrl, urlsForUser, idWithCookie, checkShortUrlDatabase} = require("./helpers");

//access cookie session
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(bodyParser.urlencoded({extended: true}));
//use EJS as templating engine
app.set("view engine", "ejs");

//display six random characters into a string for the short url
const generateRandomString = function() {
  let newRandomString = "";
  for (let i = 0; i < 6; i++) {
    newRandomString += randomCharacter();
  }
  return newRandomString;
};
//create a random string for the short url
const randomCharacter = function() {
  let chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
  return chars.substr(Math.floor(Math.random() * 62), 1);
};



//an object with the list of urls in the database
const urlDatabase = {
  // "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "theabo"},
  // "9sm5xK": {longURL: "http://www.google.com", userID: "tommyboi"}
};

//an object which will be used to store and access the users registered
const users = {
};

app.get("/", (req, res) => {
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
	const userID = currentID;
  if (userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//display the register page
app.get("/register", (req, res) => {
  //check if the user is logged in/registered by requesting cookies
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  if (currentID) {
    res.redirect("urls");
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
  if (!email || !password) {
    res.status(400).send("Error 400 please enter email or password");
  }
  else if (emailLookUp(email, users)) {
    res.status(400).send("Error 400 email already exists");
  } else {
    //unique Id for a new registered user
    let uniqueID = generateRandomString();
    //update the users database with a unique id so new email and hashed password are saved
    users[uniqueID] = {'id': uniqueID, email, hashedPassword};
    req.session.user_id = uniqueID;
  }
  res.redirect("/urls");
});

//display the login page
app.get("/login", (req, res) => {
  //check if the user is logged in/registered by requesting cookies
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  if (currentID) {
    res.redirect("/urls");
  } else {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("login", templateVars);
  }
});

//add end point to /login
app.post("/login", (req, res) => {
  //get the info from body for email and password
  const { email, password} = req.body;
  
  //obtain the current Id of the user associated with that email
  const currentId = emailLookUp(email, users);
	
  if (!email || !password) {
    res.status(403).send("Error 404 please enter email or password");
  }
  if (!currentId) {
    res.status(403).send("Error 403 email cannot be found");
  }
  //access the specific user object in users in order to get their password value
  const existingUser = users[currentId];
  
  const passwordCompare = bcrypt.compareSync(password, existingUser.hashedPassword);
  //if someone enters an email and a matching password log them in and start a cookie
  if (currentId && passwordCompare === true) {
    //set a userID cookie containing the logged in ID of the user
    req.session.user_id = currentId;
  } else if (currentId && passwordCompare === false) {
    res.status(403).send("Error 403 password does not match");
  }
			
  res.redirect("/urls");
});

//add end point to /logout and remove the user_id cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//redict to website of longURL
app.get("/u/:shortURL", (req, res) => {
  if (checkShortUrlDatabase(req.params.shortURL, urlDatabase)) {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
  } else {
    res.status(400).send("Error URL for ID does not exist");
  }
});

//display the urls associated with the specific logged in user
app.get("/urls", (req, res) => {
//check if the user is logged in/registered by requesting cookies
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
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
  //unique url is equal to the new random string
  let uniqueShortURL = generateRandomString();
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  const userID = currentID;
  //access long url from the input from page
  const {longURL} = req.body;
  //update the url database so new shortUrls are saved
  urlDatabase[uniqueShortURL] = {longURL, userID};
  res.redirect(`/urls/${uniqueShortURL}`);
});

//display and create new urls if the user is logged in/registered
app.get("/urls/new", (req, res) => {
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  if (currentID) {
    let templateVars = { userID: users[req.session.user_id]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

//display the unique short url page for the user that created the shortUrl
app.get("/urls/:shortURL", (req, res) => {
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  //if the user exists allow them to view webpage of the specific short url
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      let templateVars = { userUrl: checkShortUrl(req.params.shortURL, urlForID), userID: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'] };
      res.render("urls_show", templateVars);
    } else {
      let templateVars = { userUrl: checkShortUrl(req.params.shortURL, urlForID), userID: users[req.session.user_id], urlExists: checkShortUrlDatabase(req.params.shortURL, urlDatabase)};
      res.render("urls_show", templateVars);
    }
  } else {
    res.send("Please login first");
  }
	
});

//delete url if the user created it
app.post("/urls/:shortURL/delete", (req, res) => {
  //check if the current user is the one that created the url that wants to be deleted
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    //then they have permission to delete it
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      delete urlDatabase[req.params.shortURL];
      res.redirect("/urls");
    } else {
      res.send("ID does not belong to you")
    }

    } else {
      res.send("Please login first");
  }
});

//update url if the user created it
app.post("/urls/:shortURL", (req, res) => {
  //check if the current user is the one that created the url that wants to be deleted
  const cookieID = req.session.user_id;
  const currentID = idWithCookie(cookieID, users);
  //set urlForID to equal the object that contains the specific users URLS
  const urlForID = urlsForUser(currentID, urlDatabase);
  if (currentID) {
    //if the shortUrl is equal to the shorturl in users url database
    //then they have permission to delete it
    if (checkShortUrl(req.params.shortURL, urlForID)) {
      //access long url from the input from page
      const longURL = req.body.longURL;
      urlDatabase[req.params.shortURL].longURL = longURL;
      res.redirect('/urls');
    }
  }
});

//when server is running log the port its on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});