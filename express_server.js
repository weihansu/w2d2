const express = require('express');
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['long secret here'],
  maxAge: 24 * 60 * 60 * 1000
}))

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" },
  test: { longURL: "https://www.google.ca", userID: "sfdfd" },
  ds: { longURL: "https://www.google.ca2", userID: "userRandomID" },
  dsds: { longURL: "https://www.google.ca3", userID: "userRandomID" },
  dsffe: { longURL: "https://www.google.ca5", userID: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "12"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

/**
 * If id exists, return his email, otherwise false
 */
const existEmail = (id => {
  if(id) {
    return users[id]['email'];
  } else {
    return false;
  }
});

/**
 * Compare a specific field in users database
 */
function verifyField(field, verify) {
  for (let id in users) {
      if (users[id][field] === verify) {
          return true;
      }
  }
}

/**
 * Loop through users and use bcrypt to compare password, return true if at least has one match
 */
function verifyPassword(pass) {
  for (let id in users) {
    let encriptedPass = users[id]['password'];
      if (bcrypt.compareSync(pass, encriptedPass)) {
          return true;
      }
  }
}

/**
 * Given a user's email, return his id or false
 */
function getIdByEmail(email) {
  for (let id in users) {
    if (users[id]['email'] === email) {
      return id;
    }
  }
  return false;
}

/**
 * Return a copy of urlDatabase given an user
 */
function urlsForUser(id) {
  let copyURL = JSON.parse(JSON.stringify(urlDatabase));
  for (url in copyURL) {
    let cutURL = copyURL[url]
    if (cutURL.userID !== id) {
      delete copyURL[url];
    }
  }
  return copyURL;
}

/**
 * Return alpha-numeric string
 * @param {n} digits in return
 */
function generateRandomString(n) {
  return Math.random().toString(36).substr(2, n);
}

//route index
app.get("/", (req, res) => {
  let id = req.session.user_id;
  let email = existEmail(id);

  if(email) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});


// routes to test Databases
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
app.get('/users.json', (req, res) => {
  res.json(users);
});


// route to url
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let email = existEmail(userID);
  let personalData = urlsForUser(userID);

  if (Object.keys(personalData).length > 0) {
    let urlsKeys = Object.keys(personalData);
    res.render("urls_index", {
      urlsKeys: urlsKeys,
      templateVars: personalData,
      email: email
    });
  } else {
    res.redirect('/login');
  }
});

// route new url
app.get("/urls/new", (req, res) => {
  let email = existEmail(req.session.user_id);

  if(email) {
    res.render("urls_new", {email: email});
  } else {
    res.redirect('/login');
  }
});

// route urls/short_urls
app.get("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  let email = existEmail(userID);
  let shortURL = req.params.shortURL;
  let personalData = urlsForUser(userID);

  if (Object.keys(personalData).length > 0 && personalData.hasOwnProperty(shortURL)) {
    let longURL = personalData[shortURL]['longURL'];
    res.render("urls_show", {
      shortURL: shortURL,
      longURL: longURL,
      email: email
    });
  } else {
    res.status(403).send('You are not allowed to access this URL');
  }
});

// route to redirect
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[shortURL]['longURL'];
  res.redirect(longURL);
});

// route to /register
app.get('/register', (req, res) => {
  let email = existEmail(req.session.user_id);
  res.render('registration', {
    email: email
  })
});

// route to /login
app.get('/login', (req, res) => {
  let email = existEmail(req.session.user_id);
  res.render('login', {
    email: email
  })
});
// END of GET


// POST CREATE NEM URL
app.post("/urls", (req, res) => {
  let userID = req.session.user_id;
  let newLongURL = req.body.longURL;
  let newShortURL = generateRandomString(6);

  urlDatabase[newShortURL] = {
    longURL: newLongURL,
    userID: userID
  }
  res.redirect("/urls/" + newShortURL);
});

app.post('/urls/:shortURL', (req, res) => {
  let userID = req.session.user_id;
  let email = existEmail(userID);
  let newLongURL = req.body.longURL;
  let shortURL = req.params.shortURL;
  urlDatabase[shortURL] = {
    longURL: newLongURL,
    userID: userID
  }
  res.render("urls_show", {
    shortURL: shortURL,
    longURL: newLongURL,
    email: email
  });
});

// POST DELETE URL
app.post('/urls/:shortURL/delete', (req, res) => {

  let userID = req.session.user_id;
  let shortURL = req.params.shortURL;
  let personalData = urlsForUser(userID);

  if (Object.keys(personalData).length > 0 && personalData.hasOwnProperty(shortURL)) {
    delete urlDatabase[shortURL];
    res.redirect('/urls')
  } else {
    res.status(403).send('You are not allowed to access this URL');
  }
});

// POST LOGIN
app.post('/login', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  if(verifyField('email', email) &&  verifyPassword(password)) {
    let cookieValue = getIdByEmail(email)
    req.session.user_id = cookieValue;
    res.redirect('/urls');
  } else {
    res.status(403).send('Email or Password wrong!');
  }
});

// POST LOGOUT
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

// POST REGISTER
app.post('/register', (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  let id = generateRandomString(2);
  req.session.user_id = id;

  if (email === '' || password === '') {
    return res.status(400).send('Empty Email or Password does not accept');
  } else if (verifyField('email', email)) {
    return res.status(400).send('Email already exist!');
  } else {
      users[id] = {
        id: req.session.user_id,
        email: email,
        password: hashedPassword
      };
    res.render("urls_new", {email: email});
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
