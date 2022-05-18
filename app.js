const express = require('express');
const app = express();
const ejsMate = require('ejs-mate')
const mongoose = require('mongoose');
const bcrypt = require("bcrypt")
const session = require("express-session");
const axios = require("axios")
const { stockNames, script } = require("./seed")
require("dotenv").config();


const portfolio = require('./models/user')
const Asset = require('./models/asset');


const atlas = process.env.DATABASE_URL || 'mongodb://localhost:27017/portfolio'


mongoose.connect(atlas, { useNewUrlParser: true, useUnifiedTopology: true })

    .then(() => {
        console.log("Connection sucessful")
    })
    .catch((e) => {
        console.log("Connection failed", e)
    })

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.SECRET }))

app.get("/signup", (req, res) => {
    res.render("auth/signup")
})

const getData = async (name) => {
    var options = {
        method: 'GET',
        url: `https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${name}`,
        params: { modules: 'defaultKeyStatistics,assetProfile' },
        headers: {
            'x-api-key': process.env.YAHOO_KEY
        }
    };

    const cprice = await axios.request(options)
    return cprice.data.quoteResponse.result[0].fiftyTwoWeekHigh
}

app.post("/signup", async (req, res) => {
    const { user, password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const newUser = new portfolio({ user: user, password: hash })
    await newUser.save()
    req.session.user_id = newUser._id;
    res.redirect('/')
})

app.get("/login", (req, res) => {
    res.render("auth/login")
})

app.post("/login", async (req, res) => {
    const { user, password } = req.body;
    const newUser = await portfolio.findOne({ user: user })
    try {
        const valid = await bcrypt.compare(password, newUser.password)
        if (valid) {
            req.session.user_id = newUser._id;
            res.redirect('/')
        }
        else {
            res.send("Try again")
        }
    }
    catch {
        res.send("No user found")

    }
})


app.get("/", async (req, res) => {
    if (req.session.user_id) {
        var value = 0;
        const onePortfolio = await portfolio.findOne({ _id: req.session.user_id }).populate('asset')
        for (let asset of onePortfolio.asset) {
            console.log(asset.name)
            var cprice = await getData(asset.name);
            console.log("Cprice is: ", cprice)
            value = value + (asset.cprice * asset.quantity)
            var assetPL = ((asset.cprice - asset.price) * asset.quantity).toFixed(2);
            var newAssetData = await Asset.findByIdAndUpdate(asset._id, { cprice: cprice, assetPL: assetPL })
            await newAssetData.save();
            console.log(newAssetData)
        }
        res.render("main/index", { onePortfolio, value })

    }
    else {
        res.render("auth/show")
    }
})

app.get("/delete/:id", async (req, res) => {
    if (req.session.user_id) {
        const id = req.session.user_id;
        const del = await portfolio.findById(id)
        for (let asset of del.asset) {
            const assetId = asset._id;
            const data = await Asset.findByIdAndDelete(assetId)
        }
        const newdel = await portfolio.findByIdAndDelete(id)
        req.session.user_id = null;
        res.redirect("/")
    }
    else {
        res.render("auth/show")
    }
})

app.get("/asset", async (req, res) => {
    if (req.session.user_id) {
        const id = req.session.user_id;
        console.log(stockNames)
        res.render("asset/new", { id, stockNames, script })
    }
    else {
        res.render("auth/show")
    }
})

app.post("/asset", async (req, res) => {
    const id = req.session.user_id;
    const newdata = await portfolio.findById({ _id: id })
    const { name, price, quantity } = req.body.asset
    const newAsset = new Asset({ name: name, price: price, quantity: quantity, cprice: 0, assetPL: 0 })
    await newAsset.save()
    newdata.asset.push(newAsset)
    await newdata.save()

    res.redirect("/")
})

app.get('/logout', (req, res) => {
    req.session._id = null;
    res.redirect("/login")
})

app.get("/asset/edit/:id", (req, res) => {
    const id = req.params.id;
    res.render("asset/edit", { id })
})

app.post("/asset/edit/:id", async (req, res) => {
    const id = req.params.id
    const newAsset = await Asset.findByIdAndUpdate(id, req.body.asset)
    await newAsset.save()
    res.redirect("/")
})

app.get("/asset/delete/:id", async (req, res) => {
    const id = req.params.id;
    const data = await Asset.findByIdAndDelete(id)
    res.redirect("/")
})



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on ${port}`)
})

