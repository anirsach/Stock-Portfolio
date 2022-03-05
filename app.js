const express = require('express');
const app = express();
const ejsMate = require('ejs-mate')
const mongoose = require('mongoose');
const bcrypt = require("bcrypt")
const session = require("express-session");
const axios = require("axios")


const portfolio = require('./models/user')
const Asset = require('./models/asset')

const atlas = "mongodb+srv://firstuser:anirudh8334@cluster0.hnmyu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority" || 'mongodb://localhost:27017/portfolio'


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
app.use(session({ secret: "notagoodsecret" }))

app.get("/signup", (req, res) => {
    res.render("auth/signup")
})

const getData = async (name) => {
    var options = {
        method: 'GET',
        url: `https://yfapi.net/v6/finance/quote?region=US&lang=en&symbols=${name}`,
        params: { modules: 'defaultKeyStatistics,assetProfile' },
        headers: {
            'x-api-key': 'nDCJebvQMh55KZYwPrVd75UXlnhWpFuf1CuEZ9n2'
        }
    };

    const cprice = await axios.request(options)
    return cprice.data.quoteResponse.result[0].bid
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
    console.log(newUser)
    try {
        const valid = await bcrypt.compare(password, newUser.password)
        if (valid) {
            req.session.user_id = newUser._id;
            res.redirect('/')
        }
        else {
            res.send("TRy again")
        }
    }
    catch {
        res.send("No user found")

    }
})


app.get("/", async (req, res) => {
    if (req.session.user_id) {
        const onePortfolio = await portfolio.findOne({ _id: req.session.user_id }).populate('asset')
        for (let asset of onePortfolio.asset) {
            var cprice = await getData(asset.name);
            var newAssetData = await Asset.findByIdAndUpdate(asset._id, { cprice: cprice })
            await newAssetData.save();
            console.log(newAssetData)
        }
        res.render("main/index", { onePortfolio })

    }
    else {
        res.render("auth/show")
    }
})

app.get("/new", async (req, res) => {
    if (req.session.user_id) {
        res.render("main/new")
    }
    else {
        res.render("auth/show")
    }
})

app.post("/", async (req, res) => {

    const newportfolio = new portfolio(req.body.portfolio)
    const findAsset = new Asset(req.body.asset)
    newportfolio.asset.push(findAsset)

    await findAsset.save()
    await newportfolio.save()

    res.redirect("/")
})

app.get("/show/:id", async (req, res) => {
    if (req.session.user_id) {
        const details = await portfolio.findById(req.params.id)
        res.render("main/show", { details })
    }
    else {
        res.render("auth/show")
    }
})

app.get("/edit/:id", async (req, res) => {
    if (req.session.user_id) {
        const details = await portfolio.findById(req.params.id)
        res.render("main/edit", { details })
    }
    else {
        res.render("auth/show")
    }
})

app.post("/edit/:id", async (req, res) => {
    const id = req.params.id
    const { user, capital } = req.body;
    console.log(user)
    const newportfolio = await portfolio.findByIdAndUpdate(id, { user: user, capital: capital })
    await newportfolio.save()

    res.redirect("/")
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

        res.render("asset/new", { id })
    }
    else {
        res.render("auth/show")
    }
})

app.post("/asset", async (req, res) => {
    const id = req.session.user_id;
    const newdata = await portfolio.findById({ _id: id })
    const newAsset = new Asset(req.body.asset)
    await newAsset.save()
    newdata.asset.push(newAsset)
    await newdata.save()

    res.redirect("/")
})

app.post('/logout', (req, res) => {
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

