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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const existCookie = (x => {
    if(x) {
      return x;
    }
});

const existEmail = (id => {
  if(existCookie(id)) {
    return users[id]['email'];
  } else {
    return false
  }
});

function verifyEmail(email) {
  for (let id in users) {
      if (users[id]['email'] === email) {
          return true;
      }
  }
};

function generateRandomString(n) {
  return Math.random().toString(36).substr(2, n);
};

//route index
app.get("/", (req, res) => {
  let email = existEmail(req.cookies.id);
  res.render('index', {email: email});
});

// route to test urlDatabase
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// route to url
app.get("/urls", (req, res) => {
  let email = existEmail(req.cookies.id);
  // console.log(id);
  // let email = users[id]['email'];
  console.log(email);

  let templateVars = urlDatabase;
  let urlsKeys = Object.keys(urlDatabase);
  res.render("urls_index", {
    urlsKeys: urlsKeys,
    templateVars: templateVars,
    email: email

  });
  // res.send(email)
});

// route hello
app.get("/hello", (req, res) => {
  let templateVars = { greeting: 'Hello World!' };
  res.render("hello_world", templateVars);
});

// route new url
app.get("/urls/new", (req, res) => {
  let email = existEmail(req.cookies.id);
  res.render("urls_new", {email: email});
});

// route urls/short_urls
app.get("/urls/:shortURL", (req, res) => {
  let email = existEmail(req.cookies.id);
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL];
  res.render("urls_show", {
    shortURL: shortURL,
    longURL: longURL,
    email: email
  });
});

// route to redirect
app.get("/u/:shortURL", (req, res) => {
  let templateVars = urlDatabase;
  let shortURL = req.params.shortURL;
  let longURL = templateVars[shortURL];
  res.redirect(longURL);
});

// route to /register
app.get('/register', (req, res) => {
  let email = existEmail(req.cookies.id);
  res.render('registration', {
    email: email
  })
});

// route to /login
app.get('/login', (req, res) => {
  let email = existEmail(req.cookies.id);
  res.render('login', {
    email: email
  })
});

// END of GET

// POST
app.post("/urls", (req, res) => {
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString(6);
  urlDatabase[newShortURL] = newLongURL;
  res.redirect("/urls/" + newShortURL);
});

app.post('/urls/:shortURL', (req, res) => {
  let email = existEmail(req.cookies.id);
  let newLongURL = req.body.longURL;
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = newLongURL;
  res.render("urls_show", {
    shortURL: shortURL,
    longURL: newLongURL,
    email: email
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
  res.clearCookie('id')
  res.redirect('/urls')
});

app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let id = generateRandomString(2);

  if (email === '' || password === '') {
    return res.status(400).send('Empty Email or Password does not accept');
  } else if (verifyEmail(email)) {
    return res.status(400).send('Email already exist!');
  } else {
      users[id] = {
        id: id,
        email: email,
        password: password
      };

    res.cookie('id', id, {expire : new Date() + 9999});
    res.redirect('/urls')
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});