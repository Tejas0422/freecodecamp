const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// MongoDB setup
mongoose.connect('mongodb+srv://tejas0422:dm7YT0PWOOIwVCEG@cluster0.aw77m65.mongodb.net/freecodecamp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Define a schema for user data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});
const User = mongoose.model('users', userSchema);

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const jwt_secret = "letsGo";

function authCheck(req, res,next){
  var token = req.headers['authorization']
  if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
  jwt.verify(token.split(" ")[1],jwt_secret, async function(err, decoded) {
    if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
    else{
      const userInfo = await User.findById(decoded.id);
      req.userInfo = userInfo
      next()
    }
  })  
}

// Routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const newUser = await User.findOne({  email, password });
  console.log(newUser);
  if(newUser){
    var token = jwt.sign({ id: newUser._id },jwt_secret, {
      expiresIn: 86400 // expires in 24 hours
    });
    res.status(200).send({ auth: true, token: token });
  } else{
    res.status(400).json({error:'User not found'});
  }
});
app.get("/", async (req,res) => {
  const userInfo = await User.find();
res.json({message:userInfo})
})
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body);
  const newUser = await User.create({ name, email, password });
  console.log(newUser);
  newUser.save()
    .then(() => {
      var token = jwt.sign({ id: newUser._id },jwt_secret, {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).send({ auth: true, token: token });
    })
    .catch(err => {
      res.status(400).json({error:'Failed to sign up user'});
    });
});

app.get('/dashboard',authCheck,(req,res) => {
  res.json({message:{name: req.userInfo.name, email: req.userInfo.email}})
})

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
