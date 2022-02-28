const express = require('express');
const app = express();
const atlas = "mongodb+srv://firstuser:anirudh8334@cluster0.hnmyu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" || 'mongodb://localhost:27017/portfolio'

const mongoose = require('mongoose');
mongoose.connect(atlas)
    .then(() => {
        console.log("Connection sucessful")
    })
    .catch((e) => {
        console.log("Connection failed", e)
    })

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));


const portfolioSchema = new mongoose.Schema({
    user: String,
    capital: Number,
    stock: String
})

const portfolio = mongoose.model('portfolio', portfolioSchema);

app.get("/", async (req, res) => {
    const allPortfolio = await portfolio.find({})
    res.render("index", { allPortfolio })
})

app.get("/new", async (req, res) => {
    res.render("new")
})

app.post("/", async (req, res) => {
    const newportfolio = new portfolio(req.body)
    await newportfolio.save()
    res.redirect("/")
})

app.get("/show/:id", async (req, res) => {
    const details = await portfolio.findById(req.params.id)
    res.render("show", { details })
})

app.get("/edit/:id", async (req, res) => {
    const details = await portfolio.findById(req.params.id)
    res.render("edit", { details })
})

app.post("/edit/:id", async (req, res) => {
    const id = req.params.id
    const newdata = await portfolio.findByIdAndUpdate({ _id: id }, req.body)
    res.redirect("/")
})

app.get("/delete/:id", async (req, res) => {
    const id = req.params.id;
    const del = await portfolio.findByIdAndDelete(id)
    res.redirect("/")
})
// const userOne = new portfolio({ user: "Anirudh", capital: 200000, portfolio: "TCS,lti" })
// portfolio.findByIdAndUpdate({ _id: "621b062bacbd3baae4330fca" }, { user: "chhavi" }).then((res) => { console.log(res) })

// portfolio.find().then((data) => { console.log(data) });

// portfolio.deleteMany({ _id: "621b062bacbd3baae4330fca" }).then((res) => { console.log(res) })

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on ${port}`)
})