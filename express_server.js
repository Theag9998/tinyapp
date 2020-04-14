const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

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
let uniqueShortURL = generateRandomString()
//console.log(uniqueShortURL)

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
  // "shortURL": "longURL"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
	let templateVars = {urls: urlDatabase}
	res.render("urls_index", templateVars)
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  // /urls/:shortURL -> /urls/ABC123 -> req.params.shortURL === 'ABC123'
  let templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {
	// Log the POST request body of longUrlto the console
	console.log(req.body['longURL']);  
	// update the url database so new shortUrls are saved
	urlDatabase[uniqueShortURL] = req.body['longURL'];
	// log the new urlDatabase to console
	console.log(urlDatabase)
	// Respond with 'Ok' (we will replace this)
	res.redirect(`/urls/${uniqueShortURL}`);
});
app.get("/u/:shortURL", (req, res) => {
	const longURL = urlDatabase[req.params.shortURL];
	
  res.redirect(longURL);
});
