const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('your-mongodb-connection-string', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
  lastActivity: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

function generateToken(user) {
  const payload = {
    id: user._id,
    email: user.email,
  };
  const options = {
    expiresIn: '30m',
  };

  return jwt.sign(payload, 'your-secret-key', options);
}

function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }

    // Update the last activity time for the user
    User.findByIdAndUpdate(user.id, { lastActivity: Date.now() }, { new: true }, (err, updatedUser) => {
      if (err) {
        console.error('Error updating last activity:', err);
      }
    });

    req.user = user;
    next();
  });
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const token = generateToken(user);
      res.status(200).json({ message: 'Login successful', token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Protected route example
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route accessed successfully' });
});

// Middleware to check session timeout
function checkSessionTimeout(req, res, next) {
  const currentTime = Date.now();
  const lastActivityTime = req.user.lastActivity.getTime();
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds

  if (currentTime - lastActivityTime > sessionTimeout) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  next();
}

// Apply the checkSessionTimeout middleware to protected routes
app.use('/protected', authenticateToken, checkSessionTimeout);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
