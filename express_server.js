const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const getUsername = (x => {
    if(x) {
      return x
    }
});

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
};

//route index
app.get("/", (req, res) => {
  let username = getUsername(req.cookies.username);
  res.render('index', {username: username});
});

// route to test urlDatabase
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let username = getUsername(req.cookies.username);
  let templateVars = urlDatabase;
  let urlsKeys = Object.keys(urlDatabase);
  res.render("urls_index", {
    urlsKeys: urlsKeys,
    templateVars: templateVars,
    username: username

  });
});

// route hello
app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

// route new url
app.get("/urls/new", (req, res) => {
  let username = getUsername(req.cookies.username);
  res.render("urls_new", {username: username});
});

// route urls/short_urls
app.get("/urls/:shortURL", (req, res) => {
  let username = getUsername(req.cookies.username);
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.render("urls_show", {
    shortURL: shortURL,
    longURL: longURL,
    username: username
  });
});

// route to redirect
app.get("/u/:shortURL", (req, res) => {
  let templateVars = urlDatabase;
  let shortURL = req.params.shortURL;
  let longURL = templateVars[shortURL];
  res.redirect(longURL);
});


// POST
app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString();
  urlDatabase[newShortURL] = newLongURL;
  res.redirect("/urls/" + newShortURL);
});

app.post('/urls/:shortURL', (req, res) => {
  let username = getUsername(req.cookies.username);
  let newLongURL = req.body.longURL;
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newLongURL;
  res.render("urls_show", {
    shortURL: shortURL,
    longURL: newLongURL,
    username: username
  });
});

app.post('/urls/:shortURL/delete', (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});

app.post('/login', (req, res) => {
  let username = req.body.username;
  res.cookie('username', username, {expire : new Date() + 9999});
  res.redirect('/urls')
});

app.post('/logout', (req, res) => {
  res.clearCookie('username')
  res.redirect('/urls')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});