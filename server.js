// server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas and Models ---
const registrationSchema = new mongoose.Schema({
    studentName: { type: String, required: true },
    college: { type: String, required: true },
    email: { type: String, required: true },
    event: { type: String, required: true },
    amount: { type: Number, default: 500 },
    registrationDate: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
    utrNumber: { type: String, required: true },
    screenshotPath: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now }
});

const Registration = mongoose.model('Registration', registrationSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// --- Multer Configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// --- API Routes ---

// Route for student registration (FIXED)
app.post('/register', async (req, res) => {
    try {
        const { studentName, college, email, event } = req.body; // <-- FIXED: Added 'email'
        const newRegistration = new Registration({ studentName, college, email, event }); // <-- FIXED: Added 'email'
        const savedRegistration = await newRegistration.save();
        res.status(201).json({ message: 'Student details saved.', registrationId: savedRegistration._id });
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Route for student payment confirmation
app.post('/payment', upload.single('screenshot'), async (req, res) => {
    try {
        const { registrationId, utrNumber } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No screenshot file uploaded.' });
        }
        const screenshotPath = req.file.path;
        const newPayment = new Payment({ registrationId, utrNumber, screenshotPath });
        await newPayment.save();

        const registration = await Registration.findById(registrationId);
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found.' });
        }
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: registration.email,
            subject: 'Registration Confirmation',
            html: `
                <h2>Hello ${registration.studentName},</h2>
                <p>Thank you for registering for the event: <b>${registration.event}</b>.</p>
                <p>Your registration ID is: <b>${registrationId}</b></p>
                <p>Your payment with UTR number <b>${utrNumber}</b> has been received and is being verified.</p>
                <p>We look forward to seeing you there!</p>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Nodemailer error:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        
        res.status(200).json({ message: 'Payment and screenshot saved successfully.' });
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Route to get a single confirmation
app.get('/confirmation/:id', async (req, res) => {
    try {
        const registrationId = req.params.id;
        const registration = await Registration.findById(registrationId);
        const payment = await Payment.findOne({ registrationId: registrationId });
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found.' });
        }
        res.status(200).json({ registration, payment, message: 'Confirmation details fetched.' });
    } catch (error) {
        console.error('Fetching confirmation failed:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});