const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import the bcrypt library

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://khandelwalg578:MZhKWW3twS46SKMX@cluster0.jnvwlce.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Define the User schema directly
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
});

// Create the User model
const User = mongoose.model('User', userSchema);
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
        res.status(200).json({ message: 'Login successful' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (err) {
      console.error('Error logging in:', err);
      res.status(500).json({ message: 'Error logging in' });
    }
  });
// Rest of your code (login route, app.listen, etc.)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
