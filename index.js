// Index.js file used to run our website (node index.js)
// Includes connection to local MongoDB, passport authentication, and HTTP routes for pages

// Require statements 
const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const config = require('./config');
const util = require('util');
const bodyParser = require('body-parser');  
const fs = require('fs');

// Import necessary schemas 
const {Request} = require('./models/dogSitterDBModels');

var app = express();
const port = 3000;

app.set("view engine", "ejs");

// Connection to local MongoDB database using Mongoose
mongoose.connect('mongodb://localhost:27017/dogSittersDB')
    .then(() => {
        console.log('Connected to MongoDB!');
    })

    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process if unable to connect to MongoDB
    });

// Use statements 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
var User = require("./models/user");

// Begin user authentication process for logging in 
// Set up a session 
var session = require('express-session');
var FileStore = require('session-file-store')(session);

app.use(session({
  name: 'server-session-cookie-id',
  secret: 'my express secret <usually keyboard cat>',
  saveUninitialized: true,
  resave: true,
  store: new FileStore({path: 'sessions/'})
}));

// Initialize a passport 
const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

// passport.deserializeUser(function (userId, done) {
//   User.findById(userId, (err, user) => done(err, user));
// });
passport.deserializeUser(function (userId, done) {
  User.findById(userId)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

// Local strategy for login
const LocalStrategy = require("passport-local").Strategy;
const local = new LocalStrategy((username, password, done) => {
  User.findOne({ username : username})
    .then(user => {
      if (!user || !user.validPassword(password)) {
        done(null, false, { message: "Invalid username/password" });
      } else {
        done(null, user);
      }
    })
    .catch(e => done(e));
});

passport.use("local", local);

app.all("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { 
      console.error('Error during logout:', err);
      return next(err); // Assuming next is defined in the middleware
    }
    res.redirect("/");
  });
});

// Getting our pages
app.get("/login", function(req, res) {
  res.render("loginPage", {user:req.user});
});

app.get("/register", function(req, res) {
  res.sendFile(__dirname + "/public/register.html");
});

app.get("/infoForm", function(req, res) {
  console.log("Info form page requested");
  res.sendFile(__dirname + "/public/info.html");
});

app.post("/register", (req, res, next) => {
  const { username, password } = req.body;

  User.create({ username, password })
    .then(user => {
      console.log("Registered: " + username);
      req.login(user, err => {
        if (err) next(err);
        else res.redirect("/");
      });
    })
    .catch(err => {
      if (err.name === "ValidationError") {
        const errorMessage = "Sorry that username already exists!";
        // Send JavaScript to display an alert with the error message
        res.send(`<script>alert('${errorMessage}'); window.location.href = '/register';</script>`);
      } else next(err);
    });
});

app.post("/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login.html"
  })
);

app.post("/infoForm", (req, res) => {
  res.redirect('/');
});

// Google OAuth2 strategy for login
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const googleStrategy = new GoogleStrategy({
  clientID: config.googleKey,
  clientSecret: config.googleSecret,
  callbackURL: "http://localhost:3000/auth/google/callback"
}, function (accessToken, refreshToken, profile, done) {
  User.findOne({ googleId: profile.id })
    .then(user => {
      if (user) {
        // User found, continue with authentication
        return done(null, user);
      } else {
        // User not found, create new user
        return User.create({ googleId: profile.id })
          .then(newUser => done(null, newUser))
          .catch(err => done(err));
      }
    })
    .catch(err => done(err));
});

passport.use(googleStrategy);

app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Redirect to home page after successful authentication
    res.redirect('/');
  }
);

app.all("/logout", function(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Route for handling ad creation form submission 
app.post("/create-ad", ensureAuthenticated, (req, res) => {

  // Extract data from request body
  const { name, startDate, endDate, overnight, visits, animals, tasks, rules, location } = req.body;

  // Create new request object with the extracted data
  const newRequest = new Request({
    owner: req.user._id, // Assuming req.user contains the ID of the logged-in user
    dates: {
      start: new Date(startDate), 
      end: new Date(endDate) 
    },
    overnightStay: Boolean(overnight),
    numberOfVisitsPerDay: parseInt(visits),
    numberOfAnimals: parseInt(animals),
    additionalTasks: tasks,
    houseRules: rules,
    location: location,
    status: 'pending' 
  });

  // Save the new request object to the database
  newRequest.save()
    .then(savedRequest => {
      console.log("Ad created and saved to database:", savedRequest);
      res.redirect("/"); // Redirect the user to the home page after successful ad creation

    })
    .catch(error => {
      console.error("Error saving ad to database:", error);
      res.status(500).send("Error saving ad to database");
    });
});

// Middleware to ensure user is authenticated
// If the user is not logged in and tries to submit an ad, they will be redirected to the login page
function ensureAuthenticated(req, res, next) {
  console.log("ensureAuthenticated middleware called");
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

//  GeoLocation API
 // Define a route to handle geolocation data
 app.post('/updateLocation', (req, res) => {
  const { latitude, longitude } = req.body;
  res.sendStatus(200); // Send back a success response
});
 
// Import Job model (for job listings)
const Job = require('./models/jobListings');

// Define a route to handle job listings with filtering options
app.get('/jobListings', (req, res) => {
  const { minSalary, maxSalary, jobType } = req.query;
  const query = {};

  if (minSalary && maxSalary) {
    query.salary = { $gte: minSalary, $lte: maxSalary };
  } else if (minSalary) {
    query.salary = { $gte: minSalary };
  } else if (maxSalary) {
    query.salary = { $lte: maxSalary };
  }

  if (jobType) {
    query.jobType = jobType;
  }

  Job.find(query)
    .then(jobs => {
      res.json(jobs); // Send the filtered job listings as JSON
    })
    .catch(error => {
      console.error('Error fetching job listings:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Handle POST request to /find-job
app.post('/find-job', (req, res) => {
  const location = req.body.location; // Get the location from the request body
  res.send(`You submitted the location: ${location}`);
});

// Server running on port 3000
app.listen(port, function () {
  console.log("App listening on port " + port + " !");
  console.log("View the app in your browser at http://localhost:" + port);
  console.log("Press Ctrl+C to quit.")
});
