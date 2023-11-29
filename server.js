const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');

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

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  mobile: String,
});

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

// Temporary storage for OTPs (replace this with a database or a more secure storage mechanism)
const otpStorage = {};

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'Email not found' });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'sept5780@gmail.com', // your email for sending reset emails
        pass: 'smwg wapp ffxr drah', // your email password
      },
    });

    const otp = randomstring.generate({
      length: 4,
      charset: 'numeric',
    });

    otpStorage[email] = otp; // Store the OTP temporarily

    const mailOptions = {
      from: 'sept5780@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <h2 style="color: #F77F00;">Password Reset OTP</h2>
            <p style="color: #555; font-size: 16px">Your OTP for password reset is: <br>
            <strong><span style="color:#023476; font-size:40px" >${otp}</span></strong></p>
            <p style="color: #555;">Please use this OTP to reset your password.</p>
            <p style="color: #555;">If you did not request a password reset, please ignore this email.</p>
        </div>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully' });
      }
    });
  } catch (err) {
    console.error('Error processing forgot password:', err);
    res.status(500).json({ message: 'Error processing forgot password' });
  }
});

app.post('/verify-otp', (req, res) => {
  const { email, enteredOtp } = req.body;

  const storedOtp = otpStorage[email];

  if (storedOtp && enteredOtp === storedOtp) {
    delete otpStorage[email]; // Remove the OTP after successful verification
    res.status(200).json({ message: 'OTP verified' });
  } else {
    res.status(401).json({ message: 'Invalid OTP' });
  }
});

app.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: 'Email not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
