const express = require('express');
const path = require('path');
const { User, Inventory } = require('./models'); // Import the User model
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('tiny-csrf');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

// Session setup
app.use(
  session({
    secret: 'this is my secret-258963147536214',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Flash message setup
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Passport local strategy for login
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

// Routes
app.get('/', (request, response) => {
  if (request.isAuthenticated()) {
    return request.user.role === 'admin'
      ? response.redirect('/admin/dashboard')
      : response.redirect('/user/dashboard');
  }
  response.render('home');
});

app.get('/login', (request, response) => {
  if (request.isAuthenticated()) {
    return request.user.role === 'admin'
      ? response.redirect('/admin/dashboard')
      : response.redirect('/user/dashboard');
  }
  response.render('login', { messages: request.flash() });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  (request, response) => {
    console.log("user role is...",request.user.role)
    return request.user.role === 'admin'
      ? response.redirect('/admin/dashboard')
      : response.redirect('/user/dashboard');
  }
);

app.get('/signup', (request, response) => {
  response.render('signup', {
    failure: false,
    csrfToken: request.csrfToken()
  })
})

app.post('/signup', async (request, response) => {
  const { firstname, lastname, email, password, role } = request.body;

  try {
    // Validate input
    if (!firstname || !lastname || !email || !password || !role) {
      request.flash('error', 'All fields are required');
      return response.redirect('/signup');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      request.flash('error', 'Email already registered');
      return response.redirect('/signup');
    }

    // Hash the password
    const hashedPwd = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.addUser({
      firstname: request.body.firstname,
      lastname: request.body.lastname,
      email: request.body.email,
      password: hashedPwd,
      role: request.body.role
    })
    console.log(newUser)
    // Log the user in
    request.login(newUser, (err) => {
      if (err) {
        console.error(err);
        request.flash('error', 'Something went wrong. Please try again.');
        return response.redirect('/signup');
      }
      return role === 'admin'
        ? response.redirect('/admin/dashboard')
        : response.redirect('/user/dashboard');
    });
  } catch (error) {
    console.error(error);
    request.flash('error', 'Internal server error');
    response.redirect('/signup');
  }
});

app.get('/admin/dashboard', async (request, response) => {
  if (!request.isAuthenticated() || request.user.role !== 'admin') {
    return response.status(403).send('Access denied');
  }

  try {
    // Retrieve all products from the database
    const products = await Inventory.findAll();

    response.render('admindashboard', { 
      getUser: request.user,
      products: products // Pass products to the view
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});


app.get('/user/dashboard', async (request, response) => {
  if (!request.isAuthenticated() || request.user.role !== 'customer') {
    return response.status(403).send('Access denied');
  }

  try {
    // Retrieve all products for the user dashboard
    const products = await Inventory.findAll();

    response.render('userdashboard', { 
      getUser: request.user,
      products: products // Pass products to the view
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});


app.get('/products/add', (req, res) => {
  res.render('addProduct'); 
});


app.post('/products/add', async (req, res) => {
  const {
    ProductName, Description, ProductImage, ProductCategoryName,
    ModelNumber, SerialNumber, StockLevel, ReorderPoint,
    SupplierName, SupplierMail, SupplierContact, OrderDate,
    Quantity, OrderStatus
  } = req.body;

  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).send("User not authenticated.");
  }

  try {
    const productData = {
      ProductName, Description, ProductImage, ProductCategoryName,
      ModelNumber, SerialNumber, StockLevel, ReorderPoint,
      SupplierName, SupplierMail, SupplierContact, OrderDate,
      Quantity, OrderStatus,
      userId
    };

    // Add the product with the userId
    const newProduct = await Inventory.addProduct(productData);

    // Log the product details to console
    console.log("Product added: ", newProduct);

    // Set a flash message
    req.flash('success', 'Product added successfully!');

    // Redirect to admin dashboard with product details
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else {
      return res.redirect('/user/dashboard');
    }

  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to add product. Please try again.');
    res.redirect('/products/add');
  }
});




app.get('/logout', (request, response) => {
  request.logout((err) => {
    if (err) {
      console.error(err);
    }
    response.render('home');
  });
});

module.exports = app;
