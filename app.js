const express = require('express');
const path = require('path');
const { User, Inventory } = require('./models');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('tiny-csrf');
const cookieParser = require('cookie-parser');

const app = express();
const saltRounds = 10;

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

// Flash message and CSRF token setup
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Passport configuration
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
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    return req.user.role === 'admin'
      ? res.redirect('/admin/dashboard')
      : req.user.role === 'manager'
      ? res.redirect('/manager/dashboard')
      : req.user.role === 'customer'
      ? res.redirect('/user/dashboard')
      : res.redirect('/staff/dashboard');
  }
  res.render('home');
});

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
    return req.user.role === 'admin'
      ? res.redirect('/admin/dashboard')
      : req.user.role === 'manager'
      ? res.redirect('/manager/dashboard')
      : req.user.role === 'customer'
      ? res.redirect('/user/dashboard')
      : res.redirect('/staff/dashboard');
  }
  res.render('login', { messages: req.flash() });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  (req, res) => {
    return req.user.role === 'admin'
      ? res.redirect('/admin/dashboard')
      : req.user.role === 'manager'
      ? res.redirect('/manager/dashboard')
      : req.user.role === 'customer'
      ? res.redirect('/user/dashboard')
      : res.redirect('/staff/dashboard');
  }
);

app.get('/signup', (req, res) => {
  res.render('signup', {
    failure: false,
    csrfToken: req.csrfToken(),
  });
});

app.post('/signup', async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  try {
    if (!firstname || !lastname || !email || !password || !role) {
      req.flash('error', 'All fields are required');
      return res.redirect('/signup');
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      req.flash('error', 'Email already registered');
      return res.redirect('/signup');
    }

    const hashedPwd = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hashedPwd,
      role,
    });

    req.login(newUser, (err) => {
      if (err) {
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect('/signup');
      }

      if (newUser.role === 'admin') {
        return res.redirect('/admin/dashboard');
      } else if (newUser.role === 'manager') {
        return res.redirect('/manager/dashboard');
      } else if (newUser.role === 'customer') {
        return res.redirect('/user/dashboard');
      } else {
        return res.redirect('/staff/dashboard');
      }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Internal server error');
    res.redirect('/signup');
  }
});

app.get('/admin/dashboard', async (request, response) => {
  if (!request.isAuthenticated() || request.user.role !== 'admin') {
    return response.status(403).send('Access denied');
  }

  try {
    const products = await Inventory.findAll();
    response.render('admindashboard', { 
      getUser: request.user,
      products: products,
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});

app.get('/manager/dashboard', async (request, response) => {
  if (!request.isAuthenticated() || request.user.role !== 'manager') {
    return response.status(403).send('Access denied');
  }

  try {
    const products = await Inventory.findAll();
    response.render('managerdashboard', { 
      getUser: request.user,
      products: products,
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
    const products = await Inventory.findAll();
    response.render('userdashboard', { 
      getUser: request.user,
      products: products,
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal server error');
  }
});



// Add Product Route
app.get('/products/add', (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send('Access denied');
  }
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

    // Redirect based on the user's role
    if (req.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (req.user.role === 'manager') {
      return res.redirect('/manager/dashboard'); // Redirect managers to their dashboard
    } else if (req.user.role === 'customer') {
      req.flash('error', 'Customers are not authorized to add products.');
      return res.redirect('/user/dashboard'); // Redirect customers with an error message
    } else {
      req.flash('error', 'Unauthorized action.');
      return res.redirect('/staff/dashboard'); // Default for staff or other roles
    }

  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to add product. Please try again.');
    res.redirect('/products/add');
  }
});


// View Product Route
app.get('/products/view/:id', async (req, res) => {
  try {
    const product = await Inventory.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/dashboard');
    }
    res.render('viewProduct', { product });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to retrieve product details.');
    res.redirect('/admin/dashboard');
  }
});


// Edit Product Route
app.get('/products/edit/:id', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send('Access denied');
  }
  try {
    const product = await Inventory.findByPk(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect('/admin/dashboard');
    }
    res.render('editProduct', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/products/edit/:id', async (req, res) => {
  const { ProductName, ProductCategoryName, StockLevel } = req.body;

  if (!ProductName || !ProductCategoryName || !StockLevel) {
    req.flash('error', 'Mandatory fields are missing.');
    return res.redirect(`/products/edit/${req.params.id}`);
  }

  try {
    await Inventory.update(req.body, { where: { id: req.params.id } });
    req.flash('success', 'Product updated successfully!');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to update product.');
    res.redirect(`/products/edit/${req.params.id}`);
  }
});

// Delete Product Route
app.post('/products/delete/:id', async (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).send('Access denied');
  }
  try {
    await Inventory.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Product deleted successfully!');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete product.');
    res.redirect('/admin/dashboard');
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
